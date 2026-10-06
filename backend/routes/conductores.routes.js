import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getDriverPublicProfile,
  getDriverTrips,
} from '../controllers/conductores.controller.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/:idUpe/viajes', getDriverTrips);
router.get('/:idUpe', getDriverPublicProfile);

export default router;
