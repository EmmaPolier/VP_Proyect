import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// UTILITIES
// ============================================================================

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email transporter (configure with your Gmail credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      database: 'Oracle connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// ============================================================================
// AUTHENTICATION - REGISTER (CONDUCTOR/PASAJERO)
// ============================================================================

app.post('/register', async (req, res) => {
  const { 
    documento, 
    nombres, 
    primerApellido,
    segundoApellido,
    email, 
    telefono, 
    fechaNacimiento,
    contrasena,
    fotoUrl,
    perfil // 'PASAJERO' o 'CONDUCTOR'
  } = req.body;

  try {
    // Validaciones básicas
    if (!documento || !nombres || !email || !telefono || !contrasena) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    // Verificar si usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { documentoUsu: documento }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Obtener perfil
    const perfilDb = await prisma.perfil.findUnique({
      where: { nombre: perfil || 'PASAJERO' }
    });

    if (!perfilDb) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        documentoUsu: documento,
        nombresUsu: nombres,
        primerApellidoUsu: primerApellido,
        segundoApellidoUsu: segundoApellido || null,
        correoUsu: email,
        numeroTelefonoUsu: telefono,
        fechaNacimientoUsu: new Date(fechaNacimiento),
        contrasenaUsu: hashPassword(contrasena),
        fotoUrlUsu: fotoUrl || 'https://via.placeholder.com/150',
      }
    });

    // Asignar perfil
    await prisma.usuarioPerfil.create({
      data: {
        documentoUsuUsp: documento,
        idPerUsp: perfilDb.id
      }
    });

    // Generar código de verificación
    const codigo = generateVerificationCode();
    const expiracion = new Date(Date.now() + 15 * 60000); // 15 minutos

    await prisma.verificacionCorreo.create({
      data: {
        documentoUsuVer: documento,
        codigoVer: codigo,
        fechaExpiracionVer: expiracion
      }
    });

    // Enviar email (comentado por ahora - configurar credenciales)
    console.log(`Código de verificación para ${email}: ${codigo}`);

    res.status(201).json({ 
      message: 'Usuario registrado. Verifica tu email.',
      usuario: {
        documento: nuevoUsuario.documentoUsu,
        email: nuevoUsuario.correoUsu
      }
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AUTHENTICATION - VERIFY EMAIL
// ============================================================================

app.post('/verify', async (req, res) => {
  const { documento, codigo } = req.body;

  try {
    if (!documento || !codigo) {
      return res.status(400).json({ error: 'Documento y código requeridos' });
    }

    const verificacion = await prisma.verificacionCorreo.findUnique({
      where: { codigoVer: codigo }
    });

    if (!verificacion || verificacion.documentoUsuVer !== documento) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    if (verificacion.usadoVer === 'S') {
      return res.status(400).json({ error: 'Código ya utilizado' });
    }

    if (new Date() > verificacion.fechaExpiracionVer) {
      return res.status(400).json({ error: 'Código expirado' });
    }

    // Marcar como usado
    await prisma.verificacionCorreo.update({
      where: { idVer: verificacion.idVer },
      data: { usadoVer: 'S' }
    });

    res.json({ message: 'Email verificado correctamente' });
  } catch (error) {
    console.error('Error en verify:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AUTHENTICATION - LOGIN
// ============================================================================

app.post('/login', async (req, res) => {
  const { documento, contrasena } = req.body;

  try {
    if (!documento || !contrasena) {
      return res.status(400).json({ error: 'Documento y contraseña requeridos' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { documentoUsu: documento },
      include: { 
        perfiles: {
          include: { perfil: true }
        }
      }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (hashPassword(contrasena) !== usuario.contrasenaUsu) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Aquí iría la generación del JWT
    // const token = jwt.sign({ documento }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ 
      message: 'Inicio de sesión exitoso',
      usuario: {
        documento: usuario.documentoUsu,
        nombres: usuario.nombresUsu,
        email: usuario.correoUsu,
        telefono: usuario.numeroTelefonoUsu,
        foto: usuario.fotoUrlUsu
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// VEHICLES
// ============================================================================

app.post('/vehicles', async (req, res) => {
  const { 
    documento,
    placa, 
    marca, 
    modelo, 
    anio,
    color, 
    licenciaUrl,
    vehiculoUrl,
    licTransitoUrl,
    soatUrl
  } = req.body;

  try {
    // Obtener IDs de catálogos
    const marcaObj = await prisma.marcaVehiculo.findUnique({ where: { nombre: marca } });
    const modeloObj = await prisma.modeloVehiculo.findFirst({ where: { nombre: modelo, anio } });
    const colorObj = await prisma.colorVehiculo.findUnique({ where: { nombre: color } });

    if (!marcaObj || !modeloObj || !colorObj) {
      return res.status(400).json({ error: 'Marca, modelo o color inválido' });
    }

    const nuevoVehiculo = await prisma.device.create({
      data: {
        placaVeh: placa,
        documentoUsuVeh: documento,
        idMarVeh: marcaObj.id,
        idModVeh: modeloObj.id,
        idColVeh: colorObj.id,
        idEstVeh: 1, // ACTIVO
        licenciaUrlVeh: licenciaUrl,
        vehiculoUrlVeh: vehiculoUrl,
        licTransitoUrlVeh: licTransitoUrl,
        soatUrlVeh: soatUrl
      }
    });

    res.status(201).json({ 
      message: 'Vehículo registrado',
      vehiculo: nuevoVehiculo 
    });
  } catch (error) {
    console.error('Error en vehicles:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/vehicles/:documento', async (req, res) => {
  try {
    const vehiculos = await prisma.device.findMany({
      where: { documentoUsuVeh: req.params.documento },
      include: {
        marca: true,
        modelo: true,
        color: true,
        estado: true
      }
    });

    res.json(vehiculos);
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ROUTES
// ============================================================================

app.post('/routes', async (req, res) => {
  const { 
    documento,
    placaVehiculo,
    latitudOrigen,
    longitudOrigen,
    latitudDestino,
    longitudDestino,
    horaSalida,
    cuposTotales,
    precioCupo,
    distanciaKm
  } = req.body;

  try {
    // Obtener USUARIO_PERFIL del conductor
    const usuarioPerfil = await prisma.usuarioPerfil.findFirst({
      where: {
        documentoUsuUsp: documento,
        perfil: { nombre: 'CONDUCTOR' }
      }
    });

    if (!usuarioPerfil) {
      return res.status(400).json({ error: 'Usuario no es conductor' });
    }

    // Obtener vehículo
    const vehiculo = await prisma.device.findUnique({
      where: { placaVeh: placaVehiculo }
    });

    if (!vehiculo) {
      return res.status(400).json({ error: 'Vehículo no encontrado' });
    }

    const nuevaRuta = await prisma.ruta.create({
      data: {
        placaVehRut: vehiculo.idVeh,
        idUspRut: usuarioPerfil.idUsp,
        latitudOrigenRut: BigInt(latitudOrigen),
        longitudOrigenRut: BigInt(longitudOrigen),
        latitudDestinoRut: BigInt(latitudDestino),
        longitudDestinoRut: BigInt(longitudDestino),
        horaSalidaRut: new Date(horaSalida),
        cuposTotalesRut: cuposTotales,
        cuposDisponiblesRut: cuposTotales,
        precioCupoRut: BigInt(precioCupo * 100), // Convertir a centavos
        distanciaKmRut: BigInt(distanciaKm * 1000), // Convertir a metros
        idEstRut: 1 // PROGRAMADA
      }
    });

    res.status(201).json({ 
      message: 'Ruta creada',
      ruta: nuevaRuta 
    });
  } catch (error) {
    console.error('Error en routes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/routes', async (req, res) => {
  try {
    const rutas = await prisma.ruta.findMany({
      where: {
        estado: { nombre: 'PROGRAMADA' }
      },
      include: {
        vehiculo: {
          include: {
            marca: true,
            modelo: true,
            color: true
          }
        },
        conductor: {
          include: {
            usuario: true,
            perfil: true
          }
        },
        estado: true
      },
      orderBy: { horaSalidaRut: 'asc' }
    });

    res.json(rutas);
  } catch (error) {
    console.error('Error al obtener rutas:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// USERS
// ============================================================================

app.get('/users/:documento', async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { documentoUsu: req.params.documento },
      include: {
        perfiles: {
          include: { perfil: true }
        },
        vehiculos: true
      }
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = process.env.PORT || 4000;

const main = async () => {
  try {
    // Verificar conexión a la BD
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conectado a Oracle');

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(`📊 BD: Oracle`);
      console.log(`📁 Health Check: GET http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error conectando a BD:', error.message);
    process.exit(1);
  }
};

main();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⛔ Apagando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
