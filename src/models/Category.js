// src/models/Category.js
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database'); // Ajuste o caminho

const generateSlug = (name) => {
  if (!name) return '';
  return name.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Substitui espaços por -
    .replace(/[^\w-]+/g, '')       // Remove caracteres especiais exceto - e alfanuméricos
    .replace(/--+/g, '-')         // Substitui múltiplos - por um único -
    .replace(/^-+/, '')             // Remove - do início
    .replace(/-+$/, '');            // Remove - do fim
};

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: { // Corresponde ao 'label' no frontend
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'O nome da categoria não pode estar vazio.' },
      len: { args: [2, 100], msg: 'O nome da categoria deve ter entre 2 e 100 caracteres.' }
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: 'categories',
  timestamps: true,
  comment: 'Representa as categorias dos posts do blog',
  hooks: {
    beforeValidate: (category) => {
      if (category.name && !category.slug) { // Gera slug se não existir ou se o nome mudou e o slug não foi setado manualmente
        category.slug = generateSlug(category.name);
      } else if (category.slug) { // Garante que o slug fornecido também seja padronizado
        category.slug = generateSlug(category.slug);
      }
    },
    // Se o nome for atualizado, o slug também deve ser (a menos que o slug seja editado manualmente)
    beforeUpdate: (category) => {
        if (category.changed('name') && !category.changed('slug')) {
             category.slug = generateSlug(category.name);
        } else if (category.changed('slug') && category.slug) {
            category.slug = generateSlug(category.slug);
        }
    }
  },
  indexes: [
    { unique: true, fields: ['name'] },
    { unique: true, fields: ['slug'] }
  ]
});

// Associações
Category.associate = (models) => {
  Category.hasMany(models.Post, {
    foreignKey: 'categoryId', // Chave estrangeira em Post
    as: 'posts',
    // onDelete: 'RESTRICT', // Impede deletar categoria se tiver posts (ou SET NULL)
    onUpdate: 'CASCADE',
  });
};

module.exports = Category;