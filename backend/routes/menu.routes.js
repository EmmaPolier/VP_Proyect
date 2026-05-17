import express from 'express';
import { getMenuByPerfil } from '../controllers/menu.controller.js';

const router = express.Router();

// GET /menu/:idPerfil - Obtener menú por perfil
router.get('/:idPerfil', getMenuByPerfil);

export default router;
