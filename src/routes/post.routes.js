// src/routes/post.routes.js
const express = require('express');
const postController = require('../controllers/post.controller');
const { authenticateToken, authorizeRole } = require('../auth/auth.middleware');

const router = express.Router();

// Rotas públicas para visualização de posts
router.get('/', postController.getAllPosts); // Lista posts publicados
router.get('/:identifier', postController.getPost); // Busca post por ID ou Slug

// Rotas protegidas para admin/author para gerenciar posts
router.post('/', authenticateToken, authorizeRole(['admin', 'author']), postController.createPost);
router.put('/:id', authenticateToken, authorizeRole(['admin', 'author']), postController.updatePost);
router.delete('/:id', authenticateToken, authorizeRole(['admin', 'author']), postController.deletePost);

// Rota específica para o dashboard buscar todos os posts (incluindo drafts)
router.get('/dashboard/all', authenticateToken, authorizeRole(['admin', 'author']), postController.getAllPosts);


module.exports = router;