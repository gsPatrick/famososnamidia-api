// src/services/user.service.js
const { User } = require('../models');
const { Op } = require('sequelize');

const createUser = async (userData) => {
  // Reutiliza a lógica de registro se for similar, ou cria uma específica para admin
  // Aqui, vamos assumir que é uma criação direta (senha já hasheada ou o hook fará)
  try {
    const existingUser = await User.findOne({ where: { email: userData.email.toLowerCase() } });
    if (existingUser) {
      throw new Error('Email já cadastrado.');
    }
    const user = await User.create(userData);
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;
    return userResponse;
  } catch (error) {
    throw error;
  }
};

const getAllUsers = async ({ page = 1, limit = 10, search = '' }) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
      // defaultScope já exclui passwordHash
    });
    return { totalItems: count, users: rows, totalPages: Math.ceil(count / limit), currentPage: parseInt(page, 10) };
  } catch (error) {
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Usuário não encontrado.');
    return user;
  } catch (error) {
    throw error;
  }
};

const updateUser = async (id, updateData) => {
  try {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Usuário não encontrado.');

    // Se a senha está sendo atualizada, o hook beforeUpdate fará o hash
    // Se o email está sendo atualizado, o hook fará o toLowerCase
    await user.update(updateData);

    const updatedUserResponse = user.toJSON();
    delete updatedUserResponse.passwordHash;
    return updatedUserResponse;
  } catch (error) {
    throw error;
  }
};

const deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) throw new Error('Usuário não encontrado.');
    await user.destroy();
    return { message: 'Usuário deletado com sucesso.' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createUser, // Pode ser redundante se usar auth.service.registerUser
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};