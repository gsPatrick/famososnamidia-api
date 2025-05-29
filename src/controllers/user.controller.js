// src/controllers/user.controller.js
const userService = require('../services/user.service');

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await userService.getAllUsers({ page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    // Adicionar verificação se o usuário logado pode atualizar este usuário
    // Ex: if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') { ... }
    const user = await userService.updateUser(req.params.id, req.body);
    res.status(200).json(user);
  } catch (error) {
    res.status(error.message === 'Usuário não encontrado.' ? 404 : 400).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Adicionar verificação se o usuário logado pode deletar este usuário
    await userService.deleteUser(req.params.id);
    res.status(200).json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    res.status(error.message === 'Usuário não encontrado.' ? 404 : 500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};