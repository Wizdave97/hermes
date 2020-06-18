'use strict';
module.exports = (sequelize, DataTypes) => {
  const Orders = sequelize.define('Orders', {
    sender_psid: DataTypes.DOUBLE,
    order_number: DataTypes.DOUBLE,
    fullname: DataTypes.STRING(666),
    phone: DataTypes.STRING,
    address: DataTypes.TEXT,
    paid: DataTypes.BOOLEAN,
    transaction_ref: DataTypes.TEXT
  }, {underscored: true});
  Orders.associate = function(models) {
    // associations can be defined here
    Orders.hasMany(models.Items, { foreignKey: 'order_id'});
  };
  return Orders;
};