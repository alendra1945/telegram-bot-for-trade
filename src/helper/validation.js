module.exports.isMe = (callback) => (ctx) => {
  if (`${ctx.message.from.id}` === process.env.MY_ID) {
    callback(ctx);
  } else {
    ctx.reply("You Dont Have Permission");
  }
};
