import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
// import { roleMiddleware } from '../middlewares/role.middleware.js';
// Importar controladores cuando estén listos
// import { getProfile, updateProfile } from '../controllers/usuario.controller.js';

const router = express.Router();

// Rutas protegidas por autenticación
// router.get('/perfil', authMiddleware, getProfile);
// router.put('/perfil', authMiddleware, updateProfile);

export default router;
