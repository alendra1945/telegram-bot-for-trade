"use strict";
require("dotenv").config();
const http = require("http");
const TradeCrypto = require("./src/helper/TradeCrypto");
const bot = require("./src/helper/botTele");
const { isMe } = require("./src/helper/validation");
const { currencyFormatter } = require("./src/helper/currencyFormat");
const bitCoin = new TradeCrypto("BitCoin", "BTCIDR");

try {
  bitCoin.start();
  bot.command(
    "closebitcoin",
    isMe((ctx) => {
      ctx.reply(
        `ClosePrice on ${currencyFormatter.format(
          bitCoin.dataClose[bitCoin.dataClose.length - 1]
        )}`
      );
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

server.listen(process.env.PORT || 3000);
