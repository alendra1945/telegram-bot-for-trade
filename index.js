"use strict";
require("dotenv").config();
const cron = require("node-cron");
const { Telegraf } = require("telegraf");
const {
  getDataClose,
  getDataMAByPeriode,
  getDataRSI,
  getDataFrom,
  calculateEMA,
  calculateRSI,
} = require("./src/helper/getData");

let saldo = 1500000;
let dataTime = [];
let dataClose = [];
let MA14 = [];
let MA26 = [];
let DataRSI = {};
let onBuy = {
  status: false,
  getCoin: 0,
};

const bot = new Telegraf(process.env.TELEGRAM_BOT_KEY);
const calculateSignal = () => {
  const lastIndex = dataClose.length - 1;
  if (
    !onBuy.status &&
    MA14[lastIndex] > MA26[lastIndex] &&
    MA14[lastIndex - 1] < MA26[lastIndex - 1] &&
    DataRSI.rsi[lastIndex] > 50
  ) {
    buyWith = (10 / 100) * saldo;
    saldo -= buyWith;
    onBuy = {
      status: true,
      getCoin: buyWith / dataClose[lastIndex],
    };
    console.log(`Buy on ${dataClose[lastIndex]}`);
    bot.telegram.sendMessage(
      process.env.MY_ID,
      `INFO: Buy on ${dataClose[lastIndex]}`
    );
  } else if (
    onBuy.status &&
    MA14[lastIndex] < MA26[lastIndex] &&
    MA14[lastIndex - 1] > MA26[lastIndex - 1] &&
    DataRSI.rsi[lastIndex] < 50
  ) {
    sellWith = buyWith.getCoin * dataClose[lastIndex];
    saldo += sellWith;
    onBuy = {
      status: false,
      getCoin: 0,
    };
    console.log(`Sell on ${dataClose[lastIndex]}`);
    bot.telegram.sendMessage(
      process.env.MY_ID,
      `INFO: Sell on ${dataClose[lastIndex]}`
    );
  } else {
    console.log("no trade signal");
    bot.telegram.sendMessage(process.env.MY_ID, "INFO: no trade signal");
  }
};

const updateData = async () => {
  const lastIndex = dataClose.length - 1;
  try {
    const newData = await getDataFrom(dataTime[lastIndex]);
    if (newData.data && newData.data.s === "ok" && newData.data.t.length > 1) {
      dataTime = [...dataTime.slice(1), ...newData.data.t.slice(1)];
      dataClose = [...dataClose.slice(1), ...newData.data.c.slice(1)];
      MA14 = [
        ...MA14.slice(1),
        calculateEMA(14, dataClose[lastIndex], MA14[lastIndex]),
      ];
      MA26 = [
        ...MA26.slice(1),
        calculateEMA(26, dataClose[lastIndex], MA26[lastIndex]),
      ];
      const resultCalculteRSI = calculateRSI(
        dataClose[lastIndex] - dataClose[lastIndex - 1],
        DataRSI.lastAveragePositif,
        DataRSI.lastAverageNegatif
      );
      DataRSI = {
        lastAveragePositif: resultCalculteRSI.lastAveragePositif,
        lastAverageNegatif: resultCalculteRSI.lastAverageNegatif,
        rsi: [...DataRSI.rsi.slice(1), resultCalculteRSI.rsi],
      };
      calculateSignal();
    }
  } catch (err) {
    console.log(err);
  }
};
(async function () {
  const data = await getDataClose();
  if (data.status) {
    dataTime = data.dataTime;
    dataClose = data.dataClose;
    MA14 = getDataMAByPeriode(data.dataClose, 14);
    MA26 = getDataMAByPeriode(data.dataClose, 26);
    DataRSI = getDataRSI(data.dataClose);
    calculateSignal();
    cron.schedule("35 1 * * * *", updateData);
  }
})();

const isMe = (callback) => (ctx) => {
  if (`${ctx.message.from.id}` === process.env.MY_ID) {
    callback(ctx);
  } else {
    ctx.reply("You Dont Have Permission");
  }
};
bot.start(
  isMe((ctx) => {
    ctx.reply("Heloo");
  })
);
bot.command(
  "balance",
  isMe((ctx) => {
    ctx.reply(`Your saldo ${saldo}`);
  })
);
bot.command(
  "closePrice",
  isMe((ctx) => {
    ctx.reply(`ClosePrice on ${dataClose[dataClose.length - 1]}`);
  })
);
bot.command(
  "updateData",
  isMe((ctx) => {
    updateData();
    console.log(ctx.message);
    ctx.reply("Woke");
  })
);
bot.launch();
