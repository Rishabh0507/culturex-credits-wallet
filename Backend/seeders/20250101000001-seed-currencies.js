'use strict';

const CURRENCIES = [
  { code: 'CAMPAIGN_CREDITS', name: 'Campaign Credits', module_key: 'campaigns', price_per_credit_paise: 300 },
  { code: 'REPORT_CREDITS', name: 'Report Credits', module_key: 'reports', price_per_credit_paise: 1000 },
  { code: 'DISCOVERY_CREDITS', name: 'Discovery Credits', module_key: 'discovery', price_per_credit_paise: 500 },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'currencies',
      CURRENCIES.map((c) => ({ ...c, created_at: now, updated_at: now }))
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('currencies', {
      code: { [Sequelize.Op.in]: CURRENCIES.map((c) => c.code) },
    });
  },
};
