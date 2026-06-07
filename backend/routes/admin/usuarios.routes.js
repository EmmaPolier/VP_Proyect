import express from 'express';
import * as usuarioController from '../../controllers/admin/usuario.controller.js';

const router = express.Router();

router.get('/', usuarioController.getAllUsuarios);
// Rutas específicas ANTES que rutas genéricas con parámetro
router.post('/:documento/perfiles', usuarioController.addPerfilToUsuario);
router.get('/:documento', usuarioController.getUsuarioById);
router.post('/', usuarioController.createUsuario);
router.put('/:documento', usuarioController.updateUsuario);
// DELETE con idPerfil específico: DELETE /documento?idPerfil=2 (elimina solo ese perfil)
// DELETE sin idPerfil: DELETE /documento (elimina todo el usuario)
router.delete('/:documento', usuarioController.deleteUsuario);

export default router;
