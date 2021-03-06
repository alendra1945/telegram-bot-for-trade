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
const {
  Saldos: SaldoModel,
  CryptoCoins: CryptoCoinModel,
} = require("../models");

function TradeAlgo({
  name,
  code = "BTCIDR",
  periodeShort = 21,
  periodeLong = 34,
  periodeRSI = 14,
  numDays = 1000,
  resolution = "60",
  overSold = 58,
  overBought = 50,
  domain = "indodax",
}) {
  this.name = name;
  this.code = code || "BTCIDR";
  this.domain = domain;
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
  this.dataBuy = {
    status: false,
    getCoin: 0,
  };
  this.dataSaldo;
  this.dataCoin;
}
TradeAlgo.prototype.start = async function () {
  const mycoin = await CryptoCoinModel.findOne({ where: { name: this.name } });
  if (!mycoin) {
    await CryptoCoinModel.create({
      name: this.name,
      coin: 0,
    });
  }
  const data = await getDataClose(
    this.numDays,
    this.code,
    this.resolution,
    this.domain
  );
  if (data.status) {
    this.dataTime = data.dataTime;
    this.dataClose = data.dataClose;
    this.shortEMA = getDataMAByPeriode(data.dataClose, this.periodeShort);
    this.longEMA = getDataMAByPeriode(data.dataClose, this.periodeLong);
    this.DataRSI = getDataRSI(data.dataClose, this.periodeRSI);

    this.dataSaldo = await SaldoModel.findOne();
    this.dataCoin = await CryptoCoinModel.findOne({
      where: {
        name: this.name,
      },
    });
    if (!(process.env.RUN_TES && parseInt(process.env.RUN_TES) === 1)) {
      this.calculateSignal();
      cron.schedule("35 0,3,15,30,45 * * * *", () => this.updateData());
    } else {
      this.tes();
    }
  }
};
TradeAlgo.prototype.applyStrategy = function (
  shortEMAValue,
  shortEMABefore,
  LongEMAValue,
  LongEMABefore,
  RSIValue
) {
  const buyFlag = this.dataCoin.get("buyFlag");
  if (
    !buyFlag &&
    shortEMAValue > LongEMAValue &&
    shortEMABefore < LongEMABefore &&
    RSIValue > this.overSold
  ) {
    this.dataCoin.update({
      buyFlag: 1,
    });
    return "buy";
  } else if (
    buyFlag &&
    shortEMAValue < LongEMAValue &&
    shortEMABefore > LongEMABefore &&
    RSIValue < this.overBought
  ) {
    this.dataCoin.update({
      buyFlag: 0,
    });
    return "sell";
  } else {
    return "";
  }
};
TradeAlgo.prototype.calculateSignal = async function () {
  console.log(`calculate ${this.name}`);
  const lastIndex = this.dataClose.length - 1;
  if (this.dataSaldo) {
    const mysaldo = this.dataSaldo.get("saldoIDR");
    console.log(
      this.shortEMA[lastIndex],
      this.shortEMA[lastIndex - 1],
      this.longEMA[lastIndex],
      this.longEMA[lastIndex - 1],
      this.DataRSI.rsi[lastIndex]
    );
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
        const buyWith = (10 / 100) * mysaldo;
        await this.dataSaldo.update({
          saldoIDR: mysaldo - buyWith,
        });
        await this.dataCoin.update({
          coin: buyWith / this.dataClose[lastIndex],
          buyFlag: 1,
        });
        console.log(`Buy ${this.name} on ${this.dataClose[lastIndex]}`);
        bot.telegram.sendMessage(
          process.env.MY_ID,
          `INFO: Buy ${this.name} on ${this.dataClose[lastIndex]}`
        );
        break;
      case "sell":
        const myCoin = this.dataCoin.get("coin");
        const sellWith = myCoin * this.dataClose[lastIndex];
        await this.dataSaldo.update({
          saldoIDR: mysaldo + sellWith,
        });
        await this.dataCoin.update({
          coin: 0,
          buyFlag: 0,
        });
        console.log(`Sell ${this.name} on ${this.dataClose[lastIndex]}`);
        bot.telegram.sendMessage(
          process.env.MY_ID,
          `INFO: Sell ${this.name} on ${this.dataClose[lastIndex]}`
        );
        break;
      case "":
        console.log(`INFO ${this.name}: no trade signal`);
        bot.telegram.sendMessage(
          process.env.MY_ID,
          `INFO ${this.name}: no trade signal`
        );
        break;
      default:
        break;
    }
  }
};
TradeAlgo.prototype.tes = async function () {
  let saldo = 10000000;
  let coin = 0;
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
          if (this.domain == "investing") {
            saldo -= 1000 * v;
          } else if (this.domain == "indodax") {
            const buywith = (90 / 100) * saldo;
            console.log("sisa", saldo - buywith);
            console.log("get", buywith / v);
            saldo -= buywith;
            coin = buywith / v;
          }
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
          if (this.domain == "investing") {
            saldo += 1000 * v;
          } else if (this.domain == "indodax") {
            console.log("get", coin * v);
            saldo += coin * v;
            console.log("saldo now", saldo);
            coin = 0;
          }
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
          break;
      }
    }
  });
  console.log("saldo akhir ", saldo);
  await this.dataCoin.update({
    coin: 0,
    buyFlag: 0,
  });
};
TradeAlgo.prototype.updateData = async function () {
  console.log(`get update ${this.name}`);
  const lastIndex = this.dataClose.length - 1;
  try {
    const newData = await getDataFrom(
      this.dataTime[lastIndex],
      this.code,
      this.resolution,
      this.domain
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

module.exports = TradeAlgo;
