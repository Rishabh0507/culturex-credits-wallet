'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('currency_plans', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      currency_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'currencies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(100), allowNull: false },
      credits: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      price_paise: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('currency_plans');
  },
};
