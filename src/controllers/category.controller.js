// src/controllers/category.controller.js
const categoryService = require('../services/category.service');

const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await categoryService.getAllCategories({ page, limit, search });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCategory = async (req, res) => {
  try {
    const { identifier } = req.params;
    // Tenta buscar por ID numérico ou por slug
    const category = isNaN(parseInt(identifier))
      ? await categoryService.getCategoryBySlug(identifier)
      : await categoryService.getCategoryById(parseInt(identifier));
    res.status(200).json(category);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(200).json(category);
  } catch (error) {
    res.status(error.message.includes('não encontrada') ? 404 : 400).json({ message: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(req.params.id);
    res.status(200).json({ message: 'Categoria deletada com sucesso.' });
  } catch (error) {
    res.status(error.message.includes('não encontrada') ? 404 : 
                error.message.includes('em uso') ? 400 : 500)
       .json({ message: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};