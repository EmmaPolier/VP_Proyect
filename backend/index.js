require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const {PrismaClient} = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

//json
app.use(express.json());

//cors
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

let cachedTransporter = null;

async function getMailTransporter() {
  if (cachedTransporter) return cachedTransporter;

  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('Using Ethereal test account for email sending.');
    console.log('Preview emails at: https://ethereal.email/messages');
  }

  return cachedTransporter;
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendVerificationEmail(email, code) {
  const transporter = await getMailTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'no-reply@elpoli.edu.co',
    to: email,
    subject: 'Código de verificación VP Project',
    text: `Tu código de verificación es: ${code}`,
    html: `<p>Tu código de verificación es: <strong>${code}</strong></p><p>Este código expira en 15 minutos.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  if (nodemailer.getTestMessageUrl(info)) {
    console.log('Verification email preview URL:', nodemailer.getTestMessageUrl(info));
  }
}

// root route
app.get('/', (req, res) => {
  try {
    res.status(200).json({
      message: 'VP Project API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        test: '/test',
        users: '/users',
        signup: 'POST /signup',
        login: 'POST /login',
        verify: 'POST /verify'
      }
    });
  } catch (error) {
    res.status(500).json({error: 'Internal Server Error'});
  }
});

//test api
app.get('/test', (req, res) => {
  try {
    res.status(200).json({message: 'API is working!'});
  } catch (error) {
    res.status(500).json({error: 'Internal Server Error'});
  }
});

// get all users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({message: 'Internal Server Error'});
  }
});

// get user by id
app.get('/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {id: Number(req.params.id)},
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({message: 'Internal Server Error'});
  }
});

app.post('/register', async (req, res) => {
  try {
    const {name, lastname, email, password, role, document, birthDate} = req.body;

    // Validaciones básicas
    if (!name?.trim() || !lastname?.trim() || !email?.trim() || !password?.trim() || !role) {
      return res.status(400).json({message: 'Todos los campos son obligatorios.'});
    }

    // Validar documento
    if (!document?.trim()) {
      return res.status(400).json({message: 'El documento es obligatorio.'});
    }

    // Validar email de dominio
    if (!email.endsWith('@elpoli.edu.co')) {
      return res.status(400).json({message: 'El email debe ser del dominio @elpoli.edu.co.'});
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      return res.status(400).json({message: 'La contraseña debe tener al menos 8 caracteres.'});
    }

    // Validar rol
    const normalizedRole = role.toUpperCase();
    if (!['PASSENGER', 'DRIVER'].includes(normalizedRole)) {
      return res.status(400).json({message: 'El tipo de usuario debe ser PASSENGER o DRIVER.'});
    }

    // Verificar email único
    const existingEmail = await prisma.user.findUnique({where: {email}});
    if (existingEmail) {
      return res.status(409).json({message: 'Este email ya está registrado.'});
    }

    // Verificar documento único
    const existingDocument = await prisma.user.findUnique({where: {document}});
    if (existingDocument) {
      return res.status(409).json({message: 'Este documento ya está registrado.'});
    }

    // Generar código de verificación
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        lastname,
        email,
        password,
        document,
        role: normalizedRole,
        birthDate: birthDate ? new Date(birthDate) : null,
        isVerified: false,
        verificationCode,
        verificationExpiresAt: expiresAt,
        statusId: 2, // ACTIVE por defecto (ID 2 en la tabla status)
      },
    });

    // Enviar email de verificación
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      document: user.document,
      message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({message: 'Error interno al registrar el usuario: ' + error.message});
  }
});

app.post('/verify', async (req, res) => {
  try {
    const {email, code} = req.body;
    if (!email || !code) {
      return res.status(400).json({message: 'Email y código son requeridos.'});
    }

    const user = await prisma.user.findUnique({where: {email}});
    if (!user) {
      return res.status(404).json({message: 'Usuario no encontrado.'});
    }

    if (user.isVerified) {
      return res.status(200).json({message: 'El correo ya está verificado.'});
    }

    if (!user.verificationCode || user.verificationCode !== String(code)) {
      return res.status(400).json({message: 'Código de verificación incorrecto.'});
    }

    if (!user.verificationExpiresAt || new Date(user.verificationExpiresAt) < new Date()) {
      return res.status(400).json({message: 'El código ha expirado. Solicita uno nuevo.'});
    }

    const updatedUser = await prisma.user.update({
      where: {email},
      data: {
        isVerified: true,
        verificationCode: null,
        verificationExpiresAt: null,
      },
    });

    res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      message: 'Correo verificado correctamente.',
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({message: 'Error interno al verificar el código.'});
  }
});

app.post('/login', async (req, res) => {
  try {
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({message: 'Email y contraseña son necesarios.'});
    }

    const user = await prisma.user.findUnique({where: {email}});
    if (!user) {
      return res.status(404).json({message: 'Usuario no encontrado.'});
    }

    if (!user.isVerified) {
      return res.status(403).json({message: 'Debes verificar tu correo antes de iniciar sesión.'});
    }

    if (user.password !== password) {
      return res.status(401).json({message: 'Email o contraseña incorrectos.'});
    }

    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message: 'Inicio de sesión correcto.',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({message: 'Error interno al iniciar sesión.'});
  }
});

app.post('/vehicles', async (req, res) => {
  try {
    const {driverId, brand, model, plate, color} = req.body;

    if (!driverId || !brand?.trim() || !model?.trim() || !plate?.trim() || !color?.trim()) {
      return res.status(400).json({message: 'Todos los campos de vehículo son obligatorios.'});
    }

    const driver = await prisma.user.findUnique({where: {id: Number(driverId)}});
    if (!driver || driver.role !== 'DRIVER') {
      return res.status(400).json({message: 'El conductor no existe o no tiene un rol de conductor.'});
    }

    const existingPlate = await prisma.vehicle.findUnique({where: {plate}});
    if (existingPlate) {
      return res.status(409).json({message: 'Ya existe un vehículo con esa placa.'});
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        brand,
        model,
        plate,
        color,
        driverId: Number(driverId),
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Vehicle error:', error);
    res.status(500).json({message: 'Error interno al registrar el vehículo.'});
  }
});

// start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));