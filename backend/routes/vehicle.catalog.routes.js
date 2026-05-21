import express from 'express';
import { getBrands, getModelsByBrand, createModel, getColors } from '../controllers/brand-model.controller.js';

const router = express.Router();

// GET todas las marcas
router.get('/brands', getBrands);

// GET modelos por marca
router.get('/models', getModelsByBrand);

// POST crear un nuevo modelo (requiere marca)
router.post('/models', createModel);

// GET colores
router.get('/colors', getColors);

export default router;
