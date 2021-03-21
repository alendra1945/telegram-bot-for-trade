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
  bot.help(
    isMe((ctx) => {
      ctx.reply("Menu", {
        reply_markup: {
          keyboard: [
            ["Balance"],
            ["Close Bitcoin", "Update Bitcoin"],
            ["Close Doge", "Update Doge"],
          ],
        },
      });
    })
  );
  bot.hears(
    "Balance",
    isMe((ctx) => {
      ctx.reply(`Your saldo ${currencyFormatter.format(saldo)}`);
    })
  );
} catch (err) {
  console.log(err);
}

module.exports = bot;
