// src/config/database.js
const { Sequelize } = require('sequelize');
// Garante que dotenv foi carregado ANTES que este arquivo seja 'required'
// Adicionar a chamada dotenv.config() aqui TAMBÉM, embora app.js já faça,
// garante que este módulo tenha acesso às variáveis caso seja required
// antes de app.js em algum cenário futuro. No seu caso, app.js carrega dotenv primeiro.
require('dotenv').config(); 

// Importa as configurações específicas para o ambiente atual
const env = process.env.NODE_ENV || 'development';
const currentConfig = require('./config')[env];

// Verifica se as configurações de DB foram carregadas corretamente
if (!currentConfig || !currentConfig.dbName || !currentConfig.dbUser || !currentConfig.dbHost) {
  console.error("ERRO FATAL: Configurações de banco de dados incompletas para o ambiente", env);
  // Em um sistema robusto, você provavelmente encerraria o processo aqui
  // process.exit(1); 
}

const sequelize = new Sequelize(
  currentConfig.dbName,
  currentConfig.dbUser,
  currentConfig.dbPassword,
  {
    host: currentConfig.dbHost,
    dialect: currentConfig.dbDialect, 
    port: currentConfig.dbPort,
    // Logging apenas em desenvolvimento
    logging: currentConfig.nodeEnv === 'development' ? console.log : false, 
    // Configuração SSL (ajuste conforme sua necessidade de produção)
    dialectOptions: {
      ssl: currentConfig.dbSsl ? { require: true, rejectUnauthorized: false } : false, // Exemplo para cert. auto-assinados
    },
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

// Testar a conexão (opcional, pode ser útil no server.js antes de sync)
// async function testConnection() {
//   try {
//     await sequelize.authenticate();
//     console.log('Connection has been established successfully.');
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// }
// testConnection(); // Comentar ou remover em produção se não for necessário a cada startup

module.exports = sequelize;