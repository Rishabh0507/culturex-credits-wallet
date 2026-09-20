/**
 * Single source of truth for DB connection settings.
 * Used by sequelize-cli (migrations/seeders) and by the app at runtime.
 */
require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  // Track applied seeders so 'db:seed' is safe to re-run.
  seederStorage: 'sequelize',
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
};

module.exports = {
  development: {
    ...base,
    database: process.env.DB_NAME || 'culturex_assignment',
    logging: false,
  },
  test: {
    ...base,
    database: process.env.DB_NAME_TEST || 'culturex_assignment_test',
    logging: false,
  },
  production: {
    ...base,
    database: process.env.DB_NAME,
    logging: false,
  },
};
