/**
 * Rutas para gestión de CATÁLOGOS (Tablas Tipo)
 * Agrupa todas las rutas de administración de datos maestros
 */

import express from 'express';

// Importar controllers
import * as perfilController from '../../controllers/admin/perfil.controller.js';
import * as marcaVehiculoController from '../../controllers/admin/marca-vehiculo.controller.js';
import * as modeloVehiculoController from '../../controllers/admin/modelo-vehiculo.controller.js';
import * as colorVehiculoController from '../../controllers/admin/color-vehiculo.controller.js';
import * as estadoController from '../../controllers/admin/estado.controller.js';
import * as metodoPagoController from '../../controllers/admin/metodo-pago.controller.js';
import * as tipoTransaccionController from '../../controllers/admin/tipo-transaccion.controller.js';

const router = express.Router();

// ============================================================================
// RUTAS PARA PERFILES
// ============================================================================
router.get('/perfiles', perfilController.getAllPerfiles);
router.get('/perfiles/:id', perfilController.getPerfilById);
router.post('/perfiles', perfilController.createPerfil);
router.put('/perfiles/:id', perfilController.updatePerfil);
router.delete('/perfiles/:id', perfilController.deletePerfil);

// ============================================================================
// RUTAS PARA MARCAS DE VEHÍCULO
// ============================================================================
router.get('/marcas', marcaVehiculoController.getAllMarcas);
router.get('/marcas/:id', marcaVehiculoController.getMarcaById);
router.post('/marcas', marcaVehiculoController.createMarca);
router.put('/marcas/:id', marcaVehiculoController.updateMarca);
router.delete('/marcas/:id', marcaVehiculoController.deleteMarca);

// ============================================================================
// RUTAS PARA MODELOS DE VEHÍCULO
// ============================================================================
router.get('/modelos', modeloVehiculoController.getAllModelos);
router.get('/modelos/:id', modeloVehiculoController.getModeloById);
router.post('/modelos', modeloVehiculoController.createModelo);
router.put('/modelos/:id', modeloVehiculoController.updateModelo);
router.delete('/modelos/:id', modeloVehiculoController.deleteModelo);

// ============================================================================
// RUTAS PARA COLORES DE VEHÍCULO
// ============================================================================
router.get('/colores', colorVehiculoController.getAllColores);
router.get('/colores/:id', colorVehiculoController.getColorById);
router.post('/colores', colorVehiculoController.createColor);
router.put('/colores/:id', colorVehiculoController.updateColor);
router.delete('/colores/:id', colorVehiculoController.deleteColor);

// ============================================================================
// RUTAS PARA ESTADOS (Genéricas para todos los tipos)
// ============================================================================
router.get('/estados/:tipo', estadoController.getAllEstados);
router.get('/estados/:tipo/:id', estadoController.getEstadoById);
router.post('/estados/:tipo', estadoController.createEstado);
router.put('/estados/:tipo/:id', estadoController.updateEstado);
router.delete('/estados/:tipo/:id', estadoController.deleteEstado);

// ============================================================================
// RUTAS PARA MÉTODOS DE PAGO
// ============================================================================
router.get('/metodos-pago', metodoPagoController.getAllMetodosPago);
router.get('/metodos-pago/:id', metodoPagoController.getMetodoPagoById);
router.post('/metodos-pago', metodoPagoController.createMetodoPago);
router.put('/metodos-pago/:id', metodoPagoController.updateMetodoPago);
router.delete('/metodos-pago/:id', metodoPagoController.deleteMetodoPago);

// ============================================================================
// RUTAS PARA TIPOS DE TRANSACCIÓN
// ============================================================================
router.get('/tipos-transaccion', tipoTransaccionController.getAllTiposTransaccion);
router.get('/tipos-transaccion/:id', tipoTransaccionController.getTipoTransaccionById);
router.post('/tipos-transaccion', tipoTransaccionController.createTipoTransaccion);
router.put('/tipos-transaccion/:id', tipoTransaccionController.updateTipoTransaccion);
router.delete('/tipos-transaccion/:id', tipoTransaccionController.deleteTipoTransaccion);

export default router;
