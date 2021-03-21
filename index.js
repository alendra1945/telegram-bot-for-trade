"use strict";
require("dotenv").config();
const http = require("http");
const TradeCrypto = require("./src/helper/TradeCrypto");
const bot = require("./src/helper/botTele");
const { isMe } = require("./src/helper/validation");
const { currencyFormatter } = require("./src/helper/currencyFormat");
const moment = require("moment");
const bitCoin = new TradeCrypto("Bitcoin", "BTCIDR");
const doge = new TradeCrypto("Doge", "DOGEIDR");
const cron = require("node-cron");
const axios = require("axios");
try {
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
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.end("bot work");
});

server.listen(process.env.PORT || 3000, () => {
  console.log("run bot success");
});
cron.schedule("* */5 * * * *", () => {
  axios.get("https://bot-indodax.herokuapp.com/").then((res) => {
    console.log("res", res.data);
  });
});
