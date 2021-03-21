"use strict";
module.exports = (sequelize, DataTypes) => {
  const Saldos = sequelize.define(
    "Saldos",
    {
      saldoIDR: DataTypes.INTEGER,
    },
    {}
  );
  Saldos.associate = function (models) {
    // associations can be defined here
  };
  return Saldos;
};
