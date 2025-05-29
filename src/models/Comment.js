// src/models/Comment.js
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/database'); // Ajuste o caminho
const validator = require('validator');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O conteúdo do comentário não pode estar vazio.' },
      len: { args: [1, 2000], msg: 'O comentário deve ter entre 1 e 2000 caracteres.'}
    }
  },
  // Para comentários de usuários não logados (visitantes)
  guestName: {
    type: DataTypes.STRING,
    allowNull: true, // Obrigatório se userId for nulo e o sistema permitir comentários anônimos
  },
  guestEmail: { // Opcional para visitantes
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmailOrNull(value) {
        if (value !== null && value !== '' && !validator.isEmail(value)) {
          throw new Error('Forneça um email válido ou deixe o campo vazio.');
        }
      }
    }
  },
  // userId e postId serão definidos pelas associações
  // Poderia adicionar um campo 'parentId' para comentários aninhados (respostas)
  // parentId: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'comments', key: 'id' } }
}, {
  tableName: 'comments',
  timestamps: true,
  comment: 'Representa os comentários nos posts do blog',
  hooks: {
    beforeCreate: (comment) => {
      if (comment.guestEmail) {
        comment.guestEmail = comment.guestEmail.toLowerCase();
      }
    },
    beforeUpdate: (comment) => {
      if (comment.changed('guestEmail') && comment.guestEmail) {
        comment.guestEmail = comment.guestEmail.toLowerCase();
      }
    }
  },
  indexes: [
    // Index para buscar comentários por post rapidamente
    { fields: ['postId'] },
    // Index para buscar comentários por usuário rapidamente (se aplicável)
    { fields: ['userId'], where: { userId: { [Op.ne]: null } } }
  ]
});

// Associações
Comment.associate = (models) => {
  Comment.belongsTo(models.Post, {
    foreignKey: {
      name: 'postId',
      allowNull: false,
    },
    as: 'post',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  });
  Comment.belongsTo(models.User, { // Comentário pode ser de um usuário logado
    foreignKey: {
      name: 'userId',
      allowNull: true, // Permite comentários de guests (guestName/guestEmail seriam usados)
    },
    as: 'user',
    onDelete: 'SET NULL', // Se o usuário for deletado, o comentário pode ficar como "anônimo" ou guest
    onUpdate: 'CASCADE',
  });
  // Para comentários aninhados:
  // Comment.hasMany(models.Comment, { as: 'replies', foreignKey: 'parentId', useJunctionTable: false });
  // Comment.belongsTo(models.Comment, { as: 'parent', foreignKey: 'parentId' });
};

module.exports = Comment;