"use strict";
module.exports = (sequelize, DataTypes) => {
  const CryptoCoins = sequelize.define(
    "CryptoCoins",
    {
      name: DataTypes.STRING,
      coin: DataTypes.INTEGER,
      buyFlag: DataTypes.TINYINT,
    },
    {}
  );
  CryptoCoins.associate = function (models) {
    // associations can be defined here
  };
  return CryptoCoins;
};
