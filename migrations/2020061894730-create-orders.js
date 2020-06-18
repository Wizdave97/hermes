'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sender_psid: {
        type: Sequelize.DOUBLE
      },
      order_number: {
        type: Sequelize.DOUBLE
      },
      fullname:{
        type: Sequelize.STRING(666)
      },
      phone: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.TEXT
      },
      paid: {
        type: Sequelize.BOOLEAN
      },
      transaction_ref: {
        type: Sequelize.TEXT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('orders');
  }
};