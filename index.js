"use strict";
require("dotenv").config();
const TradeAlgo = require("./src/helper/TradeAlgo");
const bot = require("./src/helper/botTele");
const { isMe } = require("./src/helper/validation");
const { currencyFormatter } = require("./src/helper/currencyFormat");
const moment = require("moment");

const bitCoin = new TradeAlgo({
  name: "Bitcoin",
  code: "BTCIDR",
  domain: "indodax",
});
const doge = new TradeAlgo({
  name: "Doge",
  code: "DOGEIDR",
  periodeShort: 14,
  periodeLong: 27,
  numDays: 300,
  resolution: "15",
  overSold: 60,
  overBought: 40,
  domain: "indodax",
});
// const BRI = new TradeAlgo({
//   name: "BRI",
//   code: "101336",
//   domain: "investing",
// });
// const Telkom = new TradeAlgo({
//   name: "Telkom",
//   code: "101600",
//   domain: "investing",
// });
const { Saldos: SaldoModel } = require("./src/models");
try {
  (async () => {
    const mysaldo = await SaldoModel.findOne();
    if (!mysaldo) {
      await SaldoModel.create({
        saldoIDR: 15000,
      });
    }
  })();
  bitCoin.start();
  doge.start();
  bot.hears(
    "Close Bitcoin",
    isMe((ctx) => {
      ctx.reply(
        `${moment(bitCoin.dataTime[bitCoin.dataTime.length - 1] * 1000).format(
          "DD/MM/YY,HH:mm"
        )} ClosePrice on ${currencyFormatter.format(
          bitCoin.dataClose[bitCoin.dataClose.length - 1]
        )}`
      );
    })
  );
  bot.hears(
    "Close Doge",
    isMe((ctx) => {
      ctx.reply(
        `${moment(doge.dataTime[doge.dataTime.length - 1] * 1000).format(
          "DD/MM/YY,HH:mm"
        )} ClosePrice on ${currencyFormatter.format(
          doge.dataClose[doge.dataClose.length - 1]
        )}`
      );
    })
  );
  bot.hears(
    "Update Bitcoin",
    isMe((ctx) => {
      bitCoin.updateData();
      ctx.reply("Woke");
    })
  );
  bot.hears(
    "Update Doge",
    isMe((ctx) => {
      doge.updateData();
      ctx.reply("Woke");
    })
  );
  bot.launch();
} catch (error) {
  console.log(error);
}
