'use strict';
module.exports = (sequelize, DataTypes) => {
  const Products = sequelize.define('Products', {
    product_name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    stock: DataTypes.INTEGER,
    img_url: DataTypes.TEXT
  }, {underscored: true});
  Products.associate = function(models) {
    // associations can be defined here
    Products.hasMany(models.Cart, { foreignKey: 'product_id'});
    Products.hasMany(models.Items, { foreignKey: 'product_id'});
    Products.hasMany(models.Notifications, {foreignKey: 'product_id'});
    Products.belongsTo(models.Categories, { foreignKey: 'category_id'});
  };
  return Products;
};