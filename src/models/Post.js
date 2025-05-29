// src/models/Post.js
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database'); // Ajuste o caminho
const validator = require('validator');

const generateSlug = (title) => { // Mesma função de slug
  if (!title) return '';
  return title.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O título do post não pode estar vazio.' },
      len: { args: [5, 255], msg: 'O título deve ter entre 5 e 255 caracteres.'}
    }
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  excerpt: {
    type: DataTypes.TEXT, // Pode ser longo
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O excerto (resumo) não pode estar vazio.' }
    }
  },
  content: { // Conteúdo HTML completo
    type: DataTypes.TEXT('long'), // TEXT mais longo para conteúdo de post
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O conteúdo do post não pode estar vazio.' }
    }
  },
  imageUrl: {
    type: DataTypes.STRING, // URL da imagem
    allowNull: true, // Pode ser opcional
    validate: {
      isUrlOrNull(value) {
        if (value !== null && value !== '' && !validator.isURL(value)) {
          throw new Error('Forneça uma URL de imagem válida ou deixe o campo vazio.');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('published', 'draft', 'archived'),
    defaultValue: 'draft',
    allowNull: false,
  },
  publishedAt: { // Data de publicação efetiva, pode ser agendada
    type: DataTypes.DATE,
    allowNull: true, // Se for draft, pode ser nulo
  },
  // authorId e categoryId serão definidos pelas associações
}, {
  tableName: 'posts',
  timestamps: true, // createdAt, updatedAt
  comment: 'Representa os artigos do blog',
  hooks: {
    beforeValidate: (post) => {
      if (post.title && !post.slug) {
        post.slug = generateSlug(post.title);
      } else if (post.slug) {
        post.slug = generateSlug(post.slug);
      }
      // Se o status for 'published' e não houver publishedAt, define agora
      if (post.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    },
    beforeUpdate: (post) => {
        if (post.changed('title') && !post.changed('slug')) {
             post.slug = generateSlug(post.title);
        } else if (post.changed('slug') && post.slug) {
            post.slug = generateSlug(post.slug);
        }
        if (post.changed('status') && post.status === 'published' && !post.publishedAt) {
            post.publishedAt = new Date();
        }
    }
  },
  indexes: [
    { unique: true, fields: ['slug'] },
    { fields: ['status'] },
    { fields: ['publishedAt'] }
  ]
});

// Associações
Post.associate = (models) => {
  Post.belongsTo(models.User, {
    foreignKey: {
      name: 'authorId',
      allowNull: true, // Pode permitir posts sem autor ou um autor "sistema"
    },
    as: 'author',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
  Post.belongsTo(models.Category, {
    foreignKey: {
      name: 'categoryId',
      allowNull: false, // Um post deve pertencer a uma categoria
    },
    as: 'category',
    onDelete: 'RESTRICT', // Não deletar categoria se tiver posts
    onUpdate: 'CASCADE',
  });
  Post.hasMany(models.Comment, {
    foreignKey: 'postId',
    as: 'comments',
    onDelete: 'CASCADE', // Deletar comentários se o post for deletado
    onUpdate: 'CASCADE',
  });
};

module.exports = Post;