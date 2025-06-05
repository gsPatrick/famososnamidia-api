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

const getAllPosts = async (options = {}) => {
  const page = parseInt(options.page, 10) || 1;
  const limit = parseInt(options.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const whereClause = {};
  const includeClause = [
    { model: User, as: 'author', attributes: ['id', 'name'] }, // Inclui autor
    { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }, // Inclui categoria
  ];

  // Filtro por termo de busca (título ou excerto)
  if (options.search) {
    whereClause[Op.or] = [
      { title: { [Op.iLike]: `%${options.search}%` } },
      { excerpt: { [Op.iLike]: `%${options.search}%` } },
    ];
  }

  // Filtro por slug da categoria
  if (options.categorySlug) {
    // Precisamos buscar o ID da categoria pelo slug
    const category = await Category.findOne({ where: { slug: options.categorySlug } });
    if (category) {
      whereClause.categoryId = category.id;
    } else {
      // Se a categoria não existe, retorna zero posts para essa categoria
      return { posts: [], totalItems: 0, totalPages: 0, currentPage: page };
    }
  }

  // Filtro por status
  // Se options.status for 'all', undefined, ou uma string vazia, não aplicamos filtro de status.
  // Caso contrário, filtramos pelo status fornecido.
  if (options.status && options.status !== 'all' && options.status !== '') {
    whereClause.status = options.status;
  }
  // console.log(`[PostService] Fetching posts with whereClause:`, whereClause);


  // Ordenação
  const order = [];
  if (options.sortBy && options.sortOrder) {
    // Validar sortBy para evitar injeção (opcional, mas bom)
    const allowedSortBy = ['title', 'createdAt', 'publishedAt', 'status'];
    if (allowedSortBy.includes(options.sortBy)) {
      order.push([options.sortBy, options.sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']);
    } else {
      order.push(['createdAt', 'DESC']); // Padrão se sortBy for inválido
    }
  } else {
    order.push(['createdAt', 'DESC']); // Ordenação padrão
  }

  try {
    const { count, rows } = await Post.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit,
      offset,
      order,
      distinct: true, // Necessário para count correto com includes N:M, mas aqui é 1:N então pode não ser crucial.
    });

    return {
      posts: rows,
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Erro ao buscar posts no serviço:", error);
    throw new Error(error.message || 'Não foi possível buscar os posts.');
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