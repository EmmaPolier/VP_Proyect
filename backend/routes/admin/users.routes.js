/**
 * Rutas para gestión de USUARIOS (Tabla Fuerte)
 */

import express from 'express';
import * as usuarioController from '../../controllers/admin/usuario.controller.js';

const router = express.Router();

// ============================================================================
// RUTAS PARA USUARIOS
// ============================================================================
router.get('/', usuarioController.getAllUsuarios);
router.get('/:id', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:id', usuarioController.updateUsuario);
router.delete('/:id', usuarioController.deleteUsuario);
router.post('/:id/change-password', usuarioController.changePassword);

export default router;
