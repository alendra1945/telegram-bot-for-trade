require("dotenv").config();
const cron = require("node-cron");
const { getDataClose } = require("./getData");
exports.getData = cron.schedule(
  process.env.TIME_CRONJOB || "*/10 * * * * *",
  async (callback) => {
    console.log("cronJobStart");
    console.log("alen", await getDataClose());
    console.log(callback);
  },
  {
    scheduled: false,
  }
);
