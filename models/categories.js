'use strict';
module.exports = (sequelize, DataTypes) => {
  const Categories = sequelize.define('Categories', {
    category: DataTypes.STRING
  }, {
    underscored: true,
  });
  Categories.associate = function(models) {
    // associations can be defined here
  };
  return Categories;
};