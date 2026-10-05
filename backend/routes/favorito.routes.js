import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import * as favoritoController from '../controllers/favorito.controller.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', favoritoController.getFavoritos);
router.get('/candidatos', favoritoController.getCandidatos);
router.post('/', favoritoController.addFavoritos);
router.delete('/:idUpe', favoritoController.removeFavorito);

export default router;