const knexLib = require('knex');

const client = process.env.DB_CLIENT || 'pg';

const config = {
  client,
  connection:
    client === 'pg'
      ? process.env.DATABASE_URL || {
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME || 'invoices',
        }
      : {
          filename: process.env.DB_FILE || './data/db.sqlite',
        },
  pool: { min: 0, max: 10 },
  useNullAsDefault: true,
};

const knex = knexLib(config);

module.exports = knex;
