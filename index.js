"use strict";
require("dotenv").config();
const TradeCrypto = require("./src/helper/TradeCrypto");
const bot = require("./src/helper/botTele");
const bitCoin = new TradeCrypto("BitCoin", "BTCIDR");
bitCoin.start();
bot.launch();
