'use strict';

const PLANS = {
  CAMPAIGN_CREDITS: [
    { name: '100 Campaign Credits', credits: 100, price_paise: 30000 },
    { name: '1000 Campaign Credits', credits: 1000, price_paise: 270000 },
  ],
  REPORT_CREDITS: [
    { name: '10 Report Credits', credits: 10, price_paise: 10000 },
    { name: '100 Report Credits', credits: 100, price_paise: 90000 },
  ],
  DISCOVERY_CREDITS: [
    { name: '100 Discovery Credits', credits: 100, price_paise: 50000 },
    { name: '1000 Discovery Credits', credits: 1000, price_paise: 450000 },
  ],
};

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const [currencies] = await queryInterface.sequelize.query('SELECT id, code FROM currencies');

    const rows = [];
    for (const currency of currencies) {
      for (const plan of PLANS[currency.code] || []) {
        rows.push({ currency_id: currency.id, ...plan, created_at: now, updated_at: now });
      }
    }

    if (rows.length) {
      await queryInterface.bulkInsert('currency_plans', rows);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('currency_plans', null, {});
  },
};
