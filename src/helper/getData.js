"use strict";
const moment = require("moment");
const axios = require("axios");
const numDataToCalculate = 1000;

module.exports.getDataFrom = async (
  from,
  code = "BTCIDR",
  resolution = "60"
) => {
  try {
    const getData = await axios.get(
      `https://indodax.com/tradingview/history?symbol=${code}&resolution=${resolution}&from=${from}`
    );
    if (!getData.data) {
      throw new Error("error when get data");
    }
    return getData;
  } catch (err) {
    throw err;
  }
};
module.exports.getDataClose = async (
  numDays = 100,
  code = "BTCIDR",
  resolution = "60"
) => {
  const startFrom =
    moment().startOf("day").toDate().getTime() / 1000 - numDays * 24 * 60 * 60;
  try {
    const getData = await this.getDataFrom(startFrom, code, resolution);
    if (!getData.data) {
      throw new Error("error when get data");
    }
    const result = getData.data;
    if (result.s !== "ok") {
      throw new Error("data Empty");
    }
    const dataTime =
      result.t.length > numDataToCalculate
        ? result.t.slice(result.t.length - numDataToCalculate)
        : result.t;
    const closePrice =
      result.c.length > numDataToCalculate
        ? result.c.slice(result.c.length - numDataToCalculate)
        : result.c;
    return {
      status: true,
      dataTime: dataTime,
      dataClose: closePrice,
    };
  } catch (err) {
    console.log(err);
  }
  return {
    status: false,
    dataTime: [],
    dataClose: [],
  };
};

module.exports.calculateEMA = (periode, price, EMABefore) => {
  const a_MA_Periode = 2 / (periode + 1);
  return a_MA_Periode * price + (1 - a_MA_Periode) * EMABefore;
};
module.exports.getDataMAByPeriode = (data, periode) => {
  const MA_Periode = new Array(data.length);
  data.forEach((v, i) => {
    if (i === 0) {
      MA_Periode[i] = v;
    } else {
      MA_Periode[i] = this.calculateEMA(periode, v, MA_Periode[i - 1]);
    }
  });
  return MA_Periode;
};

module.exports.calculateRSI = (
  delta,
  beforeAveragePositif,
  beforeAverageNegatif,
  periode = 14
) => {
  const valuePositif = delta > 0 ? delta : 0;
  const valueNegatif = delta < 0 ? Math.abs(delta) : 0;
  const lastAveragePositif =
    (beforeAveragePositif * (periode - 1) + valuePositif) / periode;
  const lastAverageNegatif =
    (beforeAverageNegatif * (periode - 1) + valueNegatif) / periode;
  return {
    lastAveragePositif,
    lastAverageNegatif,
    rsi: 100 - 100 / (1 + lastAveragePositif / lastAverageNegatif),
  };
};
module.exports.getDataRSI = (data, periode = 14) => {
  const delta = new Array(data.length);
  data.forEach((v, i) => {
    if (i === 0) {
      delta[i] = 0;
    } else {
      delta[i] = data[i] - data[i - 1];
    }
  });
  const positif = [...delta.map((v) => (v > 0 ? v : 0))];
  const negatif = [...delta.map((v) => (v < 0 ? Math.abs(v) : 0))];
  const average_positif = new Array(data.length);
  const average_negatif = new Array(data.length);
  const rsi = new Array(data.length);
  delta.forEach((v, i) => {
    if (i < periode) {
      average_positif[i] =
        positif.slice(0, periode).reduce((sum, v) => sum + v, 0) / periode;
      average_negatif[i] =
        negatif.slice(0, periode).reduce((sum, v) => sum + v, 0) / periode;
      rsi[i] = 100 - 100 / (1 + average_positif[i] / average_negatif[i]);
    } else {
      const dataCalculateRSI = this.calculateRSI(
        v,
        average_positif[i - 1],
        average_negatif[i - 1]
      );
      average_positif[i] = dataCalculateRSI.lastAveragePositif;
      average_negatif[i] = dataCalculateRSI.lastAverageNegatif;
      rsi[i] = dataCalculateRSI.rsi;
    }
  });

  return {
    lastAveragePositif: average_positif[average_positif.length - 1],
    lastAverageNegatif: average_negatif[average_negatif.length - 1],
    rsi,
  };
};
