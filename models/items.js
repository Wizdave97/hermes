'use strict';
module.exports = (sequelize, DataTypes) => {
  const Items = sequelize.define('Items', {
    quantity: DataTypes.INTEGER
  }, {underscored: true});
  Items.associate = function(models) {
    // associations can be defined here
    Items.belongsTo(models.Products, { foreignKey: 'product_id'});
    Items.belongsTo(models.Orders, { foreignKey: 'order_id'});
  };
  return Items;
};