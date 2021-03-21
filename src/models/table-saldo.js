"use strict";
module.exports = (sequelize, DataTypes) => {
  const Saldo = sequelize.define(
    "Saldo",
    {
      saldoIDR: DataTypes.INTEGER,
    },
    {}
  );
  Saldo.associate = function (models) {
    // associations can be defined here
  };
  return Saldo;
};
