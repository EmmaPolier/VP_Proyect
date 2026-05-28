import express from 'express';
import { register, verify, login, forgotPassword, resetPassword } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify', verify);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
