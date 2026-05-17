import express from 'express';
import { register, verify, login } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/verify', verify);
router.post('/login', login);

export default router;
