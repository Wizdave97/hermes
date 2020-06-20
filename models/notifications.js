'use strict';
module.exports = (sequelize, DataTypes) => {
  const Notifications = sequelize.define('Notifications', {
    token: DataTypes.TEXT,
    expires_in: DataTypes.DATE
  }, {underscored: true, freezeTableName: true, tableName: 'notifications'});
  Notifications.associate = function(models) {
    // associations can be defined here
    Notifications.belongsTo(models.Products, {foreignKey: 'product_id'});
  };
  return Notifications;
};