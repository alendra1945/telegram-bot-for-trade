require("dotenv").config();
const cron = require("node-cron");
const bot = require("./botTele");
const {
  getDataClose,
  getDataMAByPeriode,
  getDataRSI,
  getDataFrom,
  calculateEMA,
  calculateRSI,
} = require("./getData");
const moment = require("moment");
let saldo = 1500000;

function TradeCrypto({
  name,
  code = "BTCIDR",
  periodeShort = 14,
  periodeLong = 26,
  periodeRSI = 14,
  numDays = 1000,
  resolution = "60",
  overSold = 58,
  overBought = 50,
}) {
  this.name = name;
  this.code = code || "BTCIDR";
  this.periodeShort = periodeShort || 14;
  this.periodeLong = periodeLong || 26;
  this.periodeRSI = periodeRSI || 14;
  this.numDays = numDays || 1000;
  this.resolution = resolution || "60";
  this.overSold = overSold || 58;
  this.overBought = overBought || 50;
  this.dataTime = [];
  this.dataClose = [];
  this.shortEMA = [];
  this.longEMA = [];
  this.DataRSI = {};
  this.buyFlag = false;
  this.dataBuy = {
    status: false,
    getCoin: 0,
  };
}
TradeCrypto.prototype.start = async function () {
  const data = await getDataClose(this.numDays, this.code, this.resolution);
  if (data.status) {
    this.dataTime = data.dataTime;
    this.dataClose = data.dataClose;
    this.shortEMA = getDataMAByPeriode(data.dataClose, this.periodeShort);
    this.longEMA = getDataMAByPeriode(data.dataClose, this.periodeLong);
    this.DataRSI = getDataRSI(data.dataClose, this.periodeRSI);
    this.calculateSignal();
    cron.schedule("35 0,15,30,45 * * * *", () => this.updateData());
    // this.tes();
  }
};
TradeCrypto.prototype.applyStrategy = function (
  shortEMAValue,
  shortEMABefore,
  LongEMAValue,
  LongEMABefore,
  RSIValue
) {
  if (
    !this.buyFlag &&
    shortEMAValue > LongEMAValue &&
    shortEMABefore < LongEMABefore &&
    RSIValue > this.overSold
  ) {
    this.buyFlag = true;
    return "buy";
  } else if (
    this.buyFlag &&
    shortEMAValue < LongEMAValue &&
    shortEMABefore > LongEMABefore &&
    RSIValue < this.overBought
  ) {
    this.buyFlag = false;
    return "sell";
  } else {
    return "";
  }
};
TradeCrypto.prototype.calculateSignal = function () {
  console.log(`calculate ${this.name}`);
  const lastIndex = this.dataClose.length - 1;
  switch (
    this.applyStrategy(
      this.shortEMA[lastIndex],
      this.shortEMA[lastIndex - 1],
      this.longEMA[lastIndex],
      this.longEMA[lastIndex - 1],
      this.DataRSI.rsi[lastIndex]
    )
  ) {
    case "buy":
      const buyWith = (10 / 100) * saldo;
      saldo -= buyWith;
      this.dataBuy = {
        getCoin: buyWith / dataClose[lastIndex],
      };
      console.log(`Buy ${this.name} on ${dataClose[lastIndex]}`);
      bot.telegram.sendMessage(
        process.env.MY_ID,
        `INFO: Buy ${this.name} on ${dataClose[lastIndex]}`
      );
      break;
    case "sell":
      const sellWith = this.dataBuy.getCoin * this.dataClose[lastIndex];
      saldo += sellWith;
      this.dataBuy = {
        getCoin: 0,
      };
      console.log(`Sell ${this.name} on ${dataClose[lastIndex]}`);
      bot.telegram.sendMessage(
        process.env.MY_ID,
        `INFO: Sell ${this.name} on ${dataClose[lastIndex]}`
      );
      break;
    default:
      console.log(`INFO ${this.name}: no trade signal`);
      bot.telegram.sendMessage(
        process.env.MY_ID,
        `INFO ${this.name}: no trade signal`
      );
      break;
  }
};
TradeCrypto.prototype.tes = function () {
  this.dataClose.forEach((v, i) => {
    if (i > 0) {
      switch (
        this.applyStrategy(
          this.shortEMA[i],
          this.shortEMA[i - 1],
          this.longEMA[i],
          this.longEMA[i - 1],
          this.DataRSI.rsi[i]
        )
      ) {
        case "buy":
          console.log(
            this.shortEMA[i],
            this.shortEMA[i - 1],
            this.longEMA[i],
            this.longEMA[i - 1],
            this.DataRSI.rsi[i]
          );
          console.log(
            `buy ${this.name} ${moment(this.dataTime[i] * 1000).format(
              "DD/MM/YY,HH:mm"
            )}`,
            v
          );
          break;
        case "sell":
          console.log(
            this.shortEMA[i],
            this.shortEMA[i - 1],
            this.longEMA[i],
            this.longEMA[i - 1],
            this.DataRSI.rsi[i]
          );
          console.log(
            `sell ${this.name} ${moment(this.dataTime[i] * 1000).format(
              "DD/MM/YY,HH:mm"
            )}`,
            v
          );
          break;
        default:
          console.log("no action");
          break;
      }
    }
  });
};
TradeCrypto.prototype.updateData = async function () {
  console.log(`get update ${this.name}`);
  const lastIndex = this.dataClose.length - 1;
  try {
    const newData = await getDataFrom(
      this.dataTime[lastIndex],
      this.code,
      this.resolution
    );
    if (newData.data && newData.data.s === "ok" && newData.data.t.length > 1) {
      this.dataTime = [...this.dataTime.slice(1), ...newData.data.t.slice(1)];
      this.dataClose = [...this.dataClose.slice(1), ...newData.data.c.slice(1)];
      this.shortEMA = [
        ...this.shortEMA.slice(1),
        calculateEMA(
          this.periodeShort,
          this.dataClose[lastIndex],
          this.shortEMA[lastIndex]
        ),
      ];
      this.longEMA = [
        ...this.longEMA.slice(1),
        calculateEMA(
          this.periodeLong,
          this.dataClose[lastIndex],
          this.longEMA[lastIndex]
        ),
      ];
      const resultCalculteRSI = calculateRSI(
        this.dataClose[lastIndex] - this.dataClose[lastIndex - 1],
        this.DataRSI.lastAveragePositif,
        this.DataRSI.lastAverageNegatif,
        this.periodeRSI
      );
      this.DataRSI = {
        lastAveragePositif: resultCalculteRSI.lastAveragePositif,
        lastAverageNegatif: resultCalculteRSI.lastAverageNegatif,
        rsi: [...this.DataRSI.rsi.slice(1), resultCalculteRSI.rsi],
      };
      this.calculateSignal();
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = TradeCrypto;
