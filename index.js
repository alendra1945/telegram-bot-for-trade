"use strict";
require("dotenv").config();
const http = require("http");
const TradeCrypto = require("./src/helper/TradeCrypto");
const bot = require("./src/helper/botTele");
const bitCoin = new TradeCrypto("BitCoin", "BTCIDR");

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.end("bot work");
});

server.listen(process.env.PORT || 3000);

try {
  bitCoin.start();
  bot.launch();
} catch (error) {
  console.log(error);
}
