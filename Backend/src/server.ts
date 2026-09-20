import app from './app';
import { env } from './config/env';
import { sequelize } from './config/database';

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');

    app.listen(env.port, () => console.log(`Server listening on port ${env.port}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
