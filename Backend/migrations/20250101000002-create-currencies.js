'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('currencies', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      module_key: { type: Sequelize.STRING(50), allowNull: false },
      price_per_credit_paise: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('currencies');
  },
};
