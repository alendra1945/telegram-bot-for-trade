require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TELEGRAM_BOT_KEY);

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

module.exports = bot;
