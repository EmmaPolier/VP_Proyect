import express from 'express';
import { registerVehicle } from '../controllers/vehicle.controller.js';

const router = express.Router();

// POST /vehicles - Registrar nuevo vehículo
router.post('/', registerVehicle);

export default router;
