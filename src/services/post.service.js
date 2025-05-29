// src/services/post.service.js
const { Post, User, Category, Comment, sequelize } = require('../models');
const { Op } = require('sequelize');

const createPost = async (postData, authorId) => {
  try {
    // O slug será gerado pelo hook
    // A data de publicação será definida se status for 'published'
    const post = await Post.create({ ...postData, authorId });
    return post;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Um post com este título (ou slug gerado) já existe.');
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new Error('ID de autor ou categoria inválido.');
    }
    throw error;
  }
};

const getAllPosts = async ({ page = 1, limit = 10, search = '', categorySlug = null, status = 'published', sortBy = 'publishedAt', sortOrder = 'DESC' }) => {
  try {
    const offset = (page - 1) * limit;
    let whereClause = { status }; // Por padrão, busca apenas posts publicados
    
    if (status === 'all') { // Permitir buscar todos os status (para dashboard)
        delete whereClause.status;
    }


    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
      ];
    }

    let includeOptions = [
      { model: User, as: 'author', attributes: ['id', 'name'] }, // Inclui autor, exclui senha
      { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
    ];

    if (categorySlug) {
      // Busca a categoria pelo slug para obter o ID
      const category = await Category.findOne({ where: { slug: categorySlug } });
      if (category) {
        whereClause.categoryId = category.id;
      } else {
        // Se a categoria não existir, retorna array vazio ou lança erro
        return { totalItems: 0, posts: [], totalPages: 0, currentPage: parseInt(page,10) };
      }
    }
    
    const validSortOrders = ['ASC', 'DESC'];
    const orderDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';
    
    let orderClause = [[sortBy, orderDirection]];
    if (sortBy === 'createdAt' && !['publishedAt', 'updatedAt'].includes(sortBy)) { // Evita duplicidade se sortBy for createdAt
        orderClause.push(['id', orderDirection]); // Ordenação secundária para consistência
    }


    const { count, rows } = await Post.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: orderClause,
      distinct: true, // Importante para count correto com includes
    });
    return { totalItems: count, posts: rows, totalPages: Math.ceil(count / limit), currentPage: parseInt(page, 10) };
  } catch (error) {
    throw error;
  }
};

const getPostById = async (id) => {
  try {
    const post = await Post.findByPk(id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }], // Inclui usuário do comentário
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    if (!post || (post.status !== 'published' && /* lógica para permitir ver drafts para admin */ false )) {
        // A condição de ver drafts precisará de lógica de autenticação/autorização
        // Por enquanto, só mostra publicados
        // if (!post) throw new Error('Post não encontrado.'); // Se quiser mostrar drafts para admin, remova a checagem de status aqui.
    }
    if (!post) throw new Error('Post não encontrado.');
    return post;
  } catch (error) {
    throw error;
  }
};

const getPostBySlug = async (slug) => {
  try {
    const post = await Post.findOne({
      where: { slug, status: 'published' }, // Apenas posts publicados por slug
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        {
          model: Comment,
          as: 'comments',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    if (!post) throw new Error('Post não encontrado.');
    return post;
  } catch (error) {
    throw error;
  }
};

const updatePost = async (id, updateData, userId, userRole) => {
  try {
    const post = await Post.findByPk(id);
    if (!post) throw new Error('Post não encontrado.');

    // Opcional: Verificar se o usuário é o autor ou admin para permitir edição
    // if (userRole !== 'admin' && post.authorId !== userId) {
    //   throw new Error('Não autorizado a editar este post.');
    // }

    await post.update(updateData);
    return post;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Um post com este título (ou slug gerado) já existe.');
    }
    throw error;
  }
};

const deletePost = async (id, userId, userRole) => {
  try {
    const post = await Post.findByPk(id);
    if (!post) throw new Error('Post não encontrado.');

    // Opcional: Verificar se o usuário é o autor ou admin
    // if (userRole !== 'admin' && post.authorId !== userId) {
    //   throw new Error('Não autorizado a deletar este post.');
    // }
    
    await post.destroy();
    return { message: 'Post deletado com sucesso.' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  getPostBySlug,
  updatePost,
  deletePost,
};