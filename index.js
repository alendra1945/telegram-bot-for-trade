"use strict";
const cron = require("node-cron");
const {
  getDataClose,
  getDataMAByPeriode,
  getDataRSI,
  getDataFrom,
  calculateEMA,
  calculateRSI,
} = require("./src/helper/getData");
const moment = require("moment");
let dataTime = [];
let dataClose = [];
let MA14 = [];
let MA26 = [];
let DataRSI = {};
let onBuy = false;

const calculateSignal = () => {
  const lastIndex = dataClose.length - 1;
  if (
    !onBuy &&
    MA14[lastIndex] > MA26[lastIndex] &&
    MA14[lastIndex - 1] < MA26[lastIndex - 1] &&
    DataRSI.rsi[lastIndex] > 50
  ) {
    onBuy = true;
    console.log(`Buy on ${dataClose[lastIndex]}`);
  } else if (
    onBuy &&
    MA14[lastIndex] < MA26[lastIndex] &&
    MA14[lastIndex - 1] > MA26[lastIndex - 1] &&
    DataRSI.rsi[lastIndex] < 50
  ) {
    onBuy = false;
    console.log(`Sell on ${dataClose[lastIndex]}`);
  } else {
    console.log("no trade signal");
  }
};

const updateData = async () => {
  const lastIndex = dataClose.length - 1;
  try {
    const newData = await getDataFrom(dataTime[lastIndex]);
    if (newData.data && newData.data.s === "ok" && newData.data.t.length > 1) {
      dataTime = [...dataTime.slice(1), ...newData.data.t.slice(1)];
      dataClose = [...dataClose.slice(1), ...newData.data.c.slice(1)];
      MA14 = [
        ...MA14.slice(1),
        calculateEMA(14, dataClose[lastIndex], MA14[lastIndex]),
      ];
      MA26 = [
        ...MA26.slice(1),
        calculateEMA(26, dataClose[lastIndex], MA26[lastIndex]),
      ];
      const resultCalculteRSI = calculateRSI(
        dataClose[lastIndex] - dataClose[lastIndex - 1],
        DataRSI.lastAveragePositif,
        DataRSI.lastAverageNegatif
      );
      DataRSI = {
        lastAveragePositif: resultCalculteRSI.lastAveragePositif,
        lastAverageNegatif: resultCalculteRSI.lastAverageNegatif,
        rsi: [...DataRSI.rsi.slice(1), resultCalculteRSI.rsi],
      };
      calculateSignal();
    }
  } catch (err) {
    console.log(err);
  }
};
(async function () {
  const data = await getDataClose();
  if (data.status) {
    dataTime = data.dataTime;
    dataClose = data.dataClose;
    MA14 = getDataMAByPeriode(data.dataClose, 14);
    MA26 = getDataMAByPeriode(data.dataClose, 26);
    DataRSI = getDataRSI(data.dataClose);
    calculateSignal();
    cron.schedule("35 1 * * * *", updateData);
  }
})();
