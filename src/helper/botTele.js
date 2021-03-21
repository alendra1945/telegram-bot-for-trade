require("dotenv").config();
const { Telegraf } = require("telegraf");
const { currencyFormatter } = require("./currencyFormat");
const { isMe } = require("./validation");
const bot = new Telegraf(process.env.TELEGRAM_BOT_KEY);
const { Saldos: SaldoModel } = require("../models");
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
    isMe(async (ctx) => {
      const dataSaldo = await SaldoModel.findOne();
      if (dataSaldo) {
        ctx.reply(
          `Your saldo ${currencyFormatter.format(dataSaldo.get("saldoIDR"))}`
        );
      }
    })
  );
} catch (err) {
  console.log(err);
}

module.exports = bot;
