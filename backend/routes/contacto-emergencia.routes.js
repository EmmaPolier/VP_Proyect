import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  crearContactoEmergencia,
  editarContactoEmergencia,
  eliminarContactoEmergencia,
  listarContactosEmergencia
} from '../controllers/contacto-emergencia.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', listarContactosEmergencia);
router.post('/', crearContactoEmergencia);
router.patch('/:id', editarContactoEmergencia);
router.delete('/:id', eliminarContactoEmergencia);

export default router;