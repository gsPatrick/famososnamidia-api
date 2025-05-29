// src/services/comment.service.js
const { Comment, User, Post } = require('../models'); // Certifique-se que User e Post estão importados

const createComment = async (commentData, postId, userId = null) => {
  try {
    const post = await Post.findByPk(postId);
    if (!post || post.status !== 'published') {
      // Considerar se admin/author podem comentar em posts não publicados
      throw new Error('Post não encontrado ou não publicado.');
    }

    const { content, guestName, guestEmail } = commentData;

    // Validação: Se não houver userId (usuário logado), guestName é obrigatório e não pode ser vazio.
    if (!userId && (typeof guestName !== 'string' || guestName.trim() === '')) {
        throw new Error('Nome do convidado é obrigatório e não pode estar vazio para comentários anônimos.');
    }

    const commentPayload = {
      content,
      postId: parseInt(postId, 10), // Garante que postId é um número
      userId: userId, // Será null se for guest
      guestName: userId ? null : guestName.trim(), // Salva guestName apenas se não for usuário logado
      guestEmail: userId ? null : (guestEmail && typeof guestEmail === 'string' ? guestEmail.trim().toLowerCase() : null), // Salva guestEmail (opcional) apenas se não for usuário logado
    };

    const comment = await Comment.create(commentPayload);

    // Após criar, busca o comentário com os detalhes do usuário (se houver) para retornar ao frontend
    // Isso garante que o nome do usuário logado seja incluído na resposta imediata.
    const createdCommentWithDetails = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          as: 'user', // 'as: "user"' deve corresponder à definição da associação no modelo Comment
          attributes: ['id', 'name'], // Apenas os atributos necessários do usuário
        },
        // Não precisamos incluir o Post aqui, a menos que o frontend precise dele imediatamente
        // {
        //   model: Post,
        //   as: 'post',
        //   attributes: ['id', 'title'] // Exemplo
        // }
      ],
    });

    if (!createdCommentWithDetails) {
        // Isso seria inesperado, mas é uma verificação de segurança
        console.error(`Falha ao buscar o comentário recém-criado com ID: ${comment.id}`);
        throw new Error("Ocorreu um erro ao processar o comentário. Tente novamente.");
    }
    
    return createdCommentWithDetails;

  } catch (error) {
    // Log do erro para depuração no servidor
    console.error("Erro em comment.service.js - createComment:", error.message);
    // Se for um erro de validação do Sequelize, pode ser útil formatá-lo
    if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message).join(', ');
        throw new Error(`Erro de validação: ${messages}`);
    }
    // Re-lança o erro para ser tratado pelo controller
    throw error;
  }
};

const getCommentsByPostId = async (postId, { page = 1, limit = 10 }) => {
  try {
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { count, rows } = await Comment.findAndCountAll({
      where: { postId: parseInt(postId, 10) },
      include: [
        { 
          model: User, 
          as: 'user', // 'as: "user"' deve corresponder à definição da associação no modelo Comment
          attributes: ['id', 'name'] // Inclui dados do usuário que comentou (se logado)
        } 
      ],
      limit: parseInt(limit, 10),
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true, // Importante para contagem correta com includes
    });
    return { 
      totalItems: count, 
      comments: rows, 
      totalPages: Math.ceil(count / parseInt(limit, 10)), 
      currentPage: parseInt(page, 10) 
    };
  } catch (error) {
    console.error("Erro em comment.service.js - getCommentsByPostId:", error.message);
    throw error;
  }
};

const deleteComment = async (commentId, requestingUserId, requestingUserRole) => {
  try {
    const comment = await Comment.findByPk(parseInt(commentId, 10), {
        include: [{model: Post, as: 'post'}] // Inclui o post para verificar o autor do post
    });

    if (!comment) {
      throw new Error('Comentário não encontrado.');
    }

    // Lógica de autorização para deletar:
    // 1. Admin pode deletar qualquer comentário.
    // 2. Autor do post pode deletar comentários em seus posts.
    // 3. Autor do comentário pode deletar seu próprio comentário (se logado).
    
    const isOwnComment = comment.userId && comment.userId === requestingUserId;
    const isAuthorOfPost = comment.post && comment.post.authorId === requestingUserId;

    if (requestingUserRole === 'admin' || isOwnComment || (requestingUserRole === 'author' && isAuthorOfPost) ) {
        await comment.destroy();
        return { message: 'Comentário deletado com sucesso.' };
    } else {
        throw new Error('Não autorizado a deletar este comentário.');
    }

  } catch (error) {
    console.error("Erro em comment.service.js - deleteComment:", error.message);
    throw error;
  }
};

// A função updateComment pode ser adicionada aqui se for necessário editar comentários.
// const updateComment = async (commentId, commentData, requestingUserId, requestingUserRole) => { ... }

module.exports = {
  createComment,
  getCommentsByPostId,
  deleteComment,
  // updateComment,
};