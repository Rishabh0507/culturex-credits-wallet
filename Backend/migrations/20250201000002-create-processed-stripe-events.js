'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('processed_stripe_events', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      // UNIQUE is what makes webhook handling idempotent.
      stripe_event_id: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      type: { type: Sequelize.STRING(100), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('processed_stripe_events');
  },
};
