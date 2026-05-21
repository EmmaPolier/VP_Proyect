import express from 'express';
import * as usuarioController from '../../controllers/admin/usuario.controller.js';

const router = express.Router();

router.get('/', usuarioController.getAllUsuarios);
router.get('/:documento', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:documento', usuarioController.updateUsuario);
router.delete('/:documento', usuarioController.deleteUsuario);

export default router;
