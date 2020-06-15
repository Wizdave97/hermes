'use strict';
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    product_name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    stock: DataTypes.INTEGER,
    img_url: DataTypes.TEXT
  }, {underscored: true});
  Product.associate = function(models) {
    // associations can be defined here
    Product.hasMany(models.Cart, { foreignKey: 'product_id'});
    Product.hasMany(models.Items, { foreignKey: 'product_id'});
    Product.belongsTo(models.Categories, { foreignKey: 'category_id'});
  };
  return Product;
};