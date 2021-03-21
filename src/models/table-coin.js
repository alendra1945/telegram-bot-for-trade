"use strict";
module.exports = (sequelize, DataTypes) => {
  const CryptoCoin = sequelize.define(
    "CryptoCoin",
    {
      name: DataTypes.STRING,
      coin: DataTypes.INTEGER,
    },
    {}
  );
  CryptoCoin.associate = function (models) {
    // associations can be defined here
  };
  return CryptoCoin;
};
