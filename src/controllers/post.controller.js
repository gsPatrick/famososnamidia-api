// src/controllers/post.controller.js
const postService = require('../services/post.service');

const createPost = async (req, res) => {
  try {
    const authorId = req.user.id; // Assumindo que o ID do autor vem do usuário autenticado
    const post = await postService.createPost(req.body, authorId);
    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const { page, limit, search, categorySlug, status, sortBy, sortOrder } = req.query;
    let effectiveStatus = status; // Começa com o status da query string

    // Verifica se a rota atual é a rota pública de posts (não a do dashboard)
    // A rota pública é /api/v1/posts (ou similar, dependendo do prefixo em index.routes.js)
    // A rota do dashboard é /api/v1/posts/dashboard/all
    // Se req.originalUrl for usado, ele contém o caminho completo.
    // req.path é relativo à montagem do router.
    // Para ser mais seguro, podemos verificar se NÃO é a rota específica do dashboard.
    // Vamos assumir que `index.routes.js` monta `postRoutes` em `/posts`.
    // Então, para `GET /posts/dashboard/all`, `req.path` dentro de `postRoutes` será `/dashboard/all`.
    // Para `GET /posts`, `req.path` dentro de `postRoutes` será `/`.

    if (req.path !== '/dashboard/all') {
      // Se não for a rota específica do dashboard, força para 'published'
      // independentemente do que 'status' na query possa dizer.
      effectiveStatus = 'published';
    }
    // Se for a rota '/dashboard/all', `effectiveStatus` manterá o valor de `status`
    // da query (que o frontend envia como 'all').
    // O serviço precisará interpretar 'all' ou undefined/null status como "sem filtro de status".

    // console.log(`[PostController] Path: ${req.path}, Original Query Status: ${status}, Effective Status: ${effectiveStatus}`);

    const result = await postService.getAllPosts({
      page,
      limit,
      search,
      categorySlug,
      status: effectiveStatus, // Passa o status determinado para o serviço
      sortBy,
      sortOrder,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar posts no controller:", error);
    res.status(500).json({ message: "Erro ao buscar posts." });
  }
};


const getPost = async (req, res) => {
  try {
    const { identifier } = req.params;
    // Tenta buscar por ID numérico ou por slug
    // O serviço já trata de mostrar apenas publicados para getPostBySlug
    const post = isNaN(parseInt(identifier))
      ? await postService.getPostBySlug(identifier)
      : await postService.getPostById(parseInt(identifier));
    
    // Se for getPostById, e o post não for publicado, apenas admin/autor pode ver
    if (post.status !== 'published' && (!req.user || (req.user.role !== 'admin' && req.user.id !== post.authorId))) {
        return res.status(404).json({message: "Post não encontrado ou não publicado."});
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    // Adicionar lógica de autorização (req.user.id, req.user.role) no serviço
    const post = await postService.updatePost(req.params.id, req.body, req.user.id, req.user.role);
    res.status(200).json(post);
  } catch (error) {
    res.status(error.message.includes('não encontrado') ? 404 : 400).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    // Adicionar lógica de autorização no serviço
    await postService.deletePost(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ message: 'Post deletado com sucesso.' });
  } catch (error) {
    res.status(error.message.includes('não encontrado') ? 404 : 500).json({ message: error.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
};