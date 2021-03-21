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

let saldo = 1500000;

function TradeCrypto(
  name,
  code = "BTCIDR",
  periodeShort = 14,
  periodeLong = 26,
  periodeRSI = 14,
  numDays = 100,
  resolution = "60"
) {
  this.name = name;
  this.code = code;
  this.periodeShort = periodeShort;
  this.periodeLong = periodeLong;
  this.periodeRSI = periodeRSI;
  this.numDays = numDays;
  this.resolution = resolution;
  this.dataTime = [];
  this.dataClose = [];
  this.shortEMA = [];
  this.longEMA = [];
  this.DataRSI = {};
  this.onBuy = {
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
    cron.schedule("35 0,15,30,45 * * * *", this.updateData);
  }
};
TradeCrypto.prototype.calculateSignal = function () {
  const lastIndex = this.dataClose.length - 1;
  if (
    !this.onBuy.status &&
    this.shortEMA[lastIndex] > this.longEMA[lastIndex] &&
    this.shortEMA[lastIndex - 1] < this.longEMA[lastIndex - 1] &&
    this.DataRSI.rsi[lastIndex] > 50
  ) {
    const buyWith = (10 / 100) * saldo;
    saldo -= buyWith;
    this.onBuy = {
      status: true,
      getCoin: buyWith / dataClose[lastIndex],
    };
    console.log(`Buy ${this.name} on ${dataClose[lastIndex]}`);
    bot.telegram.sendMessage(
      process.env.MY_ID,
      `INFO: Buy ${this.name} on ${dataClose[lastIndex]}`
    );
  } else if (
    this.onBuy.status &&
    this.shortEMA[lastIndex] < this.longEMA[lastIndex] &&
    this.shortEMA[lastIndex - 1] > this.longEMA[lastIndex - 1] &&
    this.DataRSI.rsi[lastIndex] < 50
  ) {
    const sellWith = this.buyWith.getCoin * this.dataClose[lastIndex];
    saldo += sellWith;
    this.onBuy = {
      status: false,
      getCoin: 0,
    };
    console.log(`Sell ${this.name} on ${dataClose[lastIndex]}`);
    bot.telegram.sendMessage(
      process.env.MY_ID,
      `INFO: Sell ${this.name} on ${dataClose[lastIndex]}`
    );
  } else {
    console.log(`INFO ${this.name}: no trade signal`);
    bot.telegram.sendMessage(
      process.env.MY_ID,
      `INFO ${this.name}: no trade signal`
    );
  }
};
TradeCrypto.prototype.updateData = async function () {
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
        rsi: [...DataRSI.rsi.slice(1), resultCalculteRSI.rsi],
      };
      this.calculateSignal();
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = TradeCrypto;
