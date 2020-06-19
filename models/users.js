'use strict';
module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    fullname: DataTypes.STRING(666),
    phone: DataTypes.STRING(13),
    email: DataTypes.STRING(666),
    user_psid: {
      type: DataTypes.DOUBLE,
      unique: true
    }
  }, {freezeTableName: true, tableName: 'users'});
  Users.associate = function(models) {
    // associations can be defined here
  };
  return Users;
};