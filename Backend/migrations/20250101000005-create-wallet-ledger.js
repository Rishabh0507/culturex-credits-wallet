'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_ledger', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      currency_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'currencies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // 'purchase' | 'spend' (signed amount carries the direction)
      type: { type: Sequelize.STRING(30), allowNull: false },
      amount: { type: Sequelize.INTEGER, allowNull: false },
      reference_type: { type: Sequelize.STRING(50), allowNull: true },
      reference_id: { type: Sequelize.STRING(100), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('wallet_ledger', ['user_id', 'currency_id', 'created_at'], {
      name: 'wallet_ledger_user_currency_created_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('wallet_ledger');
  },
};
