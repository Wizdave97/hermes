'use strict';
module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    sender_psid: DataTypes.DOUBLE,
    quantity: DataTypes.INTEGER
  }, {underscored: true});
  Cart.associate = function(models) {
    // associations can be defined here
    Cart.belongsTo(models.Products, { foreignKey: 'product_id'});

  };
  return Cart;
};