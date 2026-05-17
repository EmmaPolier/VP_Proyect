import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inicializando BD...');

  try {
    // Crear catálogos de estados
    const estadosUsuario = [
      { nombre: 'ACTIVO', descripcion: 'Usuario activo' },
      { nombre: 'INACTIVO', descripcion: 'Usuario inactivo' },
      { nombre: 'SUSPENDIDO', descripcion: 'Usuario suspendido' },
      { nombre: 'BANEADO', descripcion: 'Usuario baneado' },
    ];

    for (const estado of estadosUsuario) {
      await prisma.estadoUsuario.upsert({
        where: { nombre: estado.nombre },
        update: {},
        create: estado,
      });
    }

    const estadosVehiculo = [
      { nombre: 'ACTIVO', descripcion: 'Vehículo activo' },
      { nombre: 'INACTIVO', descripcion: 'Vehículo inactivo' },
      { nombre: 'EN_REVISION', descripcion: 'Vehículo en revisión' },
    ];

    for (const estado of estadosVehiculo) {
      await prisma.estadoVehiculo.upsert({
        where: { nombre: estado.nombre },
        update: {},
        create: estado,
      });
    }

    const estadosRuta = [
      { nombre: 'PROGRAMADA', descripcion: 'Ruta programada' },
      { nombre: 'EN_CURSO', descripcion: 'Ruta en curso' },
      { nombre: 'COMPLETADA', descripcion: 'Ruta completada' },
      { nombre: 'CANCELADA', descripcion: 'Ruta cancelada' },
    ];

    for (const estado of estadosRuta) {
      await prisma.estadoRuta.upsert({
        where: { nombre: estado.nombre },
        update: {},
        create: estado,
      });
    }

    const estadosSolicitud = [
      { nombre: 'PENDIENTE', descripcion: 'Solicitud pendiente' },
      { nombre: 'APROBADA', descripcion: 'Solicitud aprobada' },
      { nombre: 'RECHAZADA', descripcion: 'Solicitud rechazada' },
      { nombre: 'CANCELADA', descripcion: 'Solicitud cancelada' },
    ];

    for (const estado of estadosSolicitud) {
      await prisma.estadoSolicitud.upsert({
        where: { nombre: estado.nombre },
        update: {},
        create: estado,
      });
    }

    const estadosCur = [
      { nombre: 'ACTIVO', descripcion: 'Cupo activo' },
      { nombre: 'COMPLETADO', descripcion: 'Cupo completado' },
      { nombre: 'CANCELADO', descripcion: 'Cupo cancelado' },
    ];

    for (const estado of estadosCur) {
      await prisma.estadoCur.upsert({
        where: { nombre: estado.nombre },
        update: {},
        create: estado,
      });
    }

    const tiposTransaccion = [
      { nombre: 'DEPOSITO', descripcion: 'Depósito de dinero' },
      { nombre: 'RETIRO', descripcion: 'Retiro de dinero' },
      { nombre: 'PAGO', descripcion: 'Pago por viaje' },
      { nombre: 'REEMBOLSO', descripcion: 'Reembolso' },
    ];

    for (const tipo of tiposTransaccion) {
      await prisma.tipoTransaccion.upsert({
        where: { nombre: tipo.nombre },
        update: {},
        create: tipo,
      });
    }

    const metodosPago = [
      { nombre: 'CARTERA_VIRTUAL' },
      { nombre: 'EFECTIVO' },
      { nombre: 'TARJETA_CREDITO' },
      { nombre: 'TARJETA_DEBITO' },
    ];

    for (const metodo of metodosPago) {
      await prisma.metodoPago.upsert({
        where: { nombre: metodo.nombre },
        update: {},
        create: metodo,
      });
    }

    const marcas = [
      { nombre: 'CHEVROLET' },
      { nombre: 'RENAULT' },
      { nombre: 'TOYOTA' },
      { nombre: 'MAZDA' },
      { nombre: 'KIA' },
      { nombre: 'NISSAN' },
      { nombre: 'VOLKSWAGEN' },
    ];

    for (const marca of marcas) {
      await prisma.marcaVehiculo.upsert({
        where: { nombre: marca.nombre },
        update: {},
        create: marca,
      });
    }

    const modelos = [
      { nombre: 'SPARK', anio: 2023 },
      { nombre: 'SPARK', anio: 2022 },
      { nombre: 'CORSA', anio: 2023 },
      { nombre: 'CORSA', anio: 2022 },
      { nombre: 'SEDAN', anio: 2023 },
    ];

    for (const modelo of modelos) {
      await prisma.modeloVehiculo.create({
        data: modelo,
      }).catch(() => {}); // Ignorar si ya existe
    }

    const colores = [
      { nombre: 'BLANCO' },
      { nombre: 'NEGRO' },
      { nombre: 'GRIS' },
      { nombre: 'ROJO' },
      { nombre: 'AZUL' },
      { nombre: 'VERDE' },
      { nombre: 'PLATEADO' },
    ];

    for (const color of colores) {
      await prisma.colorVehiculo.upsert({
        where: { nombre: color.nombre },
        update: {},
        create: color,
      });
    }

    const perfiles = [
      { nombre: 'PASAJERO', descripcion: 'Perfil de pasajero' },
      { nombre: 'CONDUCTOR', descripcion: 'Perfil de conductor' },
      { nombre: 'ADMIN', descripcion: 'Perfil de administrador' },
    ];

    for (const perfil of perfiles) {
      await prisma.perfil.upsert({
        where: { nombre: perfil.nombre },
        update: {},
        create: perfil,
      });
    }

    console.log('✅ BD inicializada correctamente con catálogos');
  } catch (error) {
    console.error('❌ Error inicializando BD:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
