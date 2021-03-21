require("dotenv").config();
const { Telegraf } = require("telegraf");
const { currencyFormatter } = require("./currencyFormat");
const { isMe } = require("./validation");
saldo = 1500000;
const bot = new Telegraf(process.env.TELEGRAM_BOT_KEY);

try {
  bot.start(
    isMe((ctx) => {
      ctx.reply("Heloo ");
    })
  );
  bot.command(
    "balance",
    isMe((ctx) => {
      ctx.reply(`Your saldo ${currencyFormatter.format(saldo)}`);
    })
  );

  bot.command(
    "updateData",
    isMe((ctx) => {
      updateData();
      ctx.reply("Woke");
    })
  );
} catch (err) {
  console.log(err);
}

module.exports = bot;
