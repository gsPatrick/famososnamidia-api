// src/controllers/comment.controller.js
const commentService = require('../services/comment.service');

const createComment = async (req, res) => {
  try {
    const { postId } = req.params;
    // req.user é populado pelo middleware softAuthenticateToken se o token for válido
    const userId = req.user ? req.user.id : null; 
    const commentData = req.body;

    // O terceiro argumento 'userId' é o ID do usuário que está criando o comentário (se logado)
    const comment = await commentService.createComment(commentData, parseInt(postId), userId);
    res.status(201).json(comment);
  } catch (error) {
    // O serviço já pode estar lançando erros com mensagens específicas
    res.status(error.message.includes('obrigatório') || error.message.includes('não encontrado') ? 400 : 500)
       .json({ message: error.message || 'Erro ao criar comentário.' });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page, limit } = req.query;
    const result = await commentService.getCommentsByPostId(parseInt(postId), { page, limit });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Erro ao buscar comentários.' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    // req.user é populado pelo middleware authenticateToken (que é obrigatório para esta rota)
    if (!req.user) {
        // Isso não deveria acontecer se authenticateToken estiver funcionando
        return res.status(401).json({ message: "Usuário não autenticado." });
    }
    const requestingUserId = req.user.id;
    const requestingUserRole = req.user.role;

    const result = await commentService.deleteComment(parseInt(commentId), requestingUserId, requestingUserRole);
    res.status(200).json(result); // O serviço retorna { message: '...' }
  } catch (error) {
    // Determinar o status code com base na mensagem de erro do serviço
    if (error.message.includes('não encontrado')) {
        res.status(404).json({ message: error.message });
    } else if (error.message.includes('Não autorizado')) {
        res.status(403).json({ message: error.message });
    } else {
        res.status(500).json({ message: error.message || 'Erro ao deletar comentário.' });
    }
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  deleteComment,
};