// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Para carregar variáveis de .env

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres', // Ou o dialeto do seu banco
    port: process.env.DB_PORT || 5432,
    logging: process.env.NODE_ENV === 'development' ? console.log : false, // Log SQL em dev
    // dialectOptions: {
    //   ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
    // },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      //underscored: true, // Se quiser que as colunas geradas (createdAt, etc.) sejam snake_case
      timestamps: true // Habilita createdAt e updatedAt por padrão
    }
  }
);

// Testar a conexão
// async function testConnection() {
//   try {
//     await sequelize.authenticate();
//     console.log('Connection has been established successfully.');
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// }
// testConnection();

module.exports = sequelize;