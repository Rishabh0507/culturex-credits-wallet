'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
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
      credits: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      amount_paise: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      // Null until the Stripe Checkout Session has been created.
      stripe_session_id: { type: Sequelize.STRING(255), allowNull: true, unique: true },
      // 'pending' | 'completed'
      status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'pending' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('payments', ['user_id', 'status'], { name: 'payments_user_status_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('payments');
  },
};
