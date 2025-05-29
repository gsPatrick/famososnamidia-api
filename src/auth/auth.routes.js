// src/auth/auth.routes.js
const express = require('express');
const authController = require('./auth.controller');
const { authenticateToken } = require('./auth.middleware'); // Middleware de autenticação

const router = express.Router();

router.post('/register', authController.register); // Registro público
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.getMe); // Rota para obter informações do usuário logado

module.exports = router;