import express from 'express';
import * as vehiculoController from '../../controllers/admin/vehiculo.controller.js';

const router = express.Router();

router.get('/', vehiculoController.getAllVehiculos);
router.get('/:id', vehiculoController.getVehiculoById);
router.post('/', vehiculoController.createVehiculo);
router.put('/:id', vehiculoController.updateVehiculo);
router.delete('/:id', vehiculoController.deleteVehiculo);

export default router;
