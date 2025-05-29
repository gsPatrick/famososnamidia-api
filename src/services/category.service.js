// src/services/category.service.js
const { Category, Post } = require('../models');
const { Op } = require('sequelize');

const createCategory = async (categoryData) => {
  try {
    const { name, description } = categoryData;
    // O slug será gerado pelo hook do modelo
    const category = await Category.create({ name, description });
    return category;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Uma categoria com este nome ou slug já existe.');
    }
    throw error;
  }
};

const getAllCategories = async ({ page = 1, limit = 100, search = '' }) => { // Limite alto para listar todas geralmente
  try {
    const offset = (page - 1) * limit;
    const whereClause = {};
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await Category.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['name', 'ASC']],
    });
    return { totalItems: count, categories: rows, totalPages: Math.ceil(count / limit), currentPage: parseInt(page, 10) };
  } catch (error) {
    throw error;
  }
};

const getCategoryById = async (id) => {
  try {
    const category = await Category.findByPk(id);
    if (!category) throw new Error('Categoria não encontrada.');
    return category;
  } catch (error) {
    throw error;
  }
};

const getCategoryBySlug = async (slug) => {
  try {
    const category = await Category.findOne({ where: { slug } });
    if (!category) throw new Error('Categoria não encontrada.');
    return category;
  } catch (error) {
    throw error;
  }
};


const updateCategory = async (id, updateData) => {
  try {
    const category = await Category.findByPk(id);
    if (!category) throw new Error('Categoria não encontrada.');

    // Se 'name' mudar, o hook deve atualizar 'slug'
    await category.update(updateData);
    return category;
  } catch (error)
{
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Uma categoria com este nome ou slug já existe.');
    }
    throw error;
  }
};

const deleteCategory = async (id) => {
  try {
    const category = await Category.findByPk(id);
    if (!category) throw new Error('Categoria não encontrada.');

    // Verificar se a categoria está em uso
    const postsInCategory = await Post.count({ where: { categoryId: id } });
    if (postsInCategory > 0) {
      throw new Error('Não é possível excluir a categoria, pois ela contém posts. Remova ou reatribua os posts primeiro.');
    }

    await category.destroy();
    return { message: 'Categoria deletada com sucesso.' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  updateCategory,
  deleteCategory,
};