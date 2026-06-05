/**
 * Rutas para gestión de MENÚ y PERMISOS (MENU_PERFIL)
 * Agrupa las rutas para administrar el sistema de menús y permisos
 */

import express from 'express';

// Importar controllers
import * as menuController from '../../controllers/admin/menu.controller.js';
import * as menuPerfilController from '../../controllers/admin/menu-perfil.controller.js';

const router = express.Router();

// ============================================================================
// RUTAS PARA MENÚ
// ============================================================================
router.get('/menus', menuController.getAllMenus);
router.get('/menus/:id', menuController.getMenuById);
router.post('/menus', menuController.createMenu);
router.put('/menus/:id', menuController.updateMenu);
router.delete('/menus/:id', menuController.deleteMenu);

// ============================================================================
// RUTAS PARA PERMISOS DE MENÚ (MENU_PERFIL)
// ============================================================================
router.get('/permisos', menuPerfilController.getAllPermisos);
router.get('/permisos/perfil/:perfilId', menuPerfilController.getPermisosByPerfil);
router.get('/permisos/:id', menuPerfilController.getPermisoById);
router.post('/permisos', menuPerfilController.createPermiso);
router.put('/permisos/:idMenu/:idPerfil', menuPerfilController.updatePermiso);
router.delete('/permisos/:idMenu/:idPerfil', menuPerfilController.deletePermiso);

export default router;
