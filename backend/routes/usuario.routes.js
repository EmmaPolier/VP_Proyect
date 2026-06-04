import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { deleteAccount } from '../controllers/auth.controller.js';
import { getUserVehicles, getUserTravelHistory, createUserVehicle, deleteUserVehicle } from '../controllers/usuario.controller.js';

const router = express.Router();

// Obtener vehículos del usuario
router.get('/vehiculos', authMiddleware, getUserVehicles);

// Crear nuevo vehículo
router.post('/vehiculos', authMiddleware, createUserVehicle);

// Eliminar vehículo
router.delete('/vehiculos/:id', authMiddleware, deleteUserVehicle);

// Obtener historial de viajes del usuario
router.get('/historial-viajes', authMiddleware, getUserTravelHistory);

// Eliminar cuenta de usuario
router.post('/delete-account', authMiddleware, deleteAccount);

export default router;
