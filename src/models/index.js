'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
// const config = require(__dirname + '/../config/config.json')[env]; // Se usar config.json
const sequelize = require('../config/database'); // Usando nossa configuração de DB
const db = {};

// Carrega todos os arquivos de modelo do diretório atual
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    // const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes); // Padrão do CLI
    const modelDefiner = require(path.join(__dirname, file));
    const model = modelDefiner; // Se o seu modelo já exporta o define()
    db[model.name] = model;
  });

// Configura as associações entre os modelos
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;