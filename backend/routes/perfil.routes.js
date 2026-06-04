import express from 'express';
import { getProfileInfo, updateProfileInfo, changePassword } from '../controllers/perfil.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /perfil - Obtener información del perfil del usuario autenticado
router.get('/', authMiddleware, getProfileInfo);

// PUT /perfil - Actualizar información del perfil
router.put('/', authMiddleware, updateProfileInfo);

// POST /perfil/cambiar-contrasena - Cambiar contraseña
router.post('/cambiar-contrasena', authMiddleware, changePassword);

export default router;
