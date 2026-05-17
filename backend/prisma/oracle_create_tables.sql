-- ============================================================================
-- CATÁLOGOS / REFERENCE TABLES (11)
-- ============================================================================

CREATE TABLE ESTADO_USUARIO (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE,
  descripcion VARCHAR2(255)
);

CREATE TABLE ESTADO_VEHICULO (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE,
  descripcion VARCHAR2(255)
);

CREATE TABLE ESTADO_RUTA (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE,
  descripcion VARCHAR2(255)
);

CREATE TABLE ESTADO_SOLICITUD (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE,
  descripcion VARCHAR2(255)
);

CREATE TABLE ESTADO_CUR (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE,
  descripcion VARCHAR2(255)
);

CREATE TABLE TIPO_TRANSACCION (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE,
  descripcion VARCHAR2(255)
);

CREATE TABLE METODO_PAGO (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE
);

CREATE TABLE MARCA_VEHICULO (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE
);

CREATE TABLE MODELO_VEHICULO (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL,
  anio NUMBER(10) NOT NULL
);

CREATE TABLE COLOR_VEHICULO (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE
);

CREATE TABLE PERFIL (
  id NUMBER(10) PRIMARY KEY,
  nombre VARCHAR2(255) NOT NULL UNIQUE,
  descripcion VARCHAR2(255),
  fechaCreacion TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- ============================================================================
-- MENU & PERMISSIONS (2)
-- ============================================================================

CREATE TABLE MENU (
  id NUMBER(10) PRIMARY KEY,
  url VARCHAR2(255) NOT NULL,
  nombre VARCHAR2(255) NOT NULL,
  idPadre NUMBER(10),
  orden NUMBER(10) NOT NULL,
  FOREIGN KEY (idPadre) REFERENCES MENU(id)
);

CREATE TABLE MENU_PERFIL (
  idMenu NUMBER(10) NOT NULL,
  idPerfil NUMBER(10) NOT NULL,
  insertar VARCHAR2(1) NOT NULL,
  actualizar VARCHAR2(1) NOT NULL,
  eliminar VARCHAR2(1) NOT NULL,
  consultar VARCHAR2(1) NOT NULL,
  PRIMARY KEY (idMenu, idPerfil),
  FOREIGN KEY (idMenu) REFERENCES MENU(id),
  FOREIGN KEY (idPerfil) REFERENCES PERFIL(id)
);

-- ============================================================================
-- USUARIOS & AUTHENTICATION (3)
-- ============================================================================

CREATE TABLE USUARIO (
  documentoUsu VARCHAR2(255) PRIMARY KEY,
  nombresUsu VARCHAR2(255) NOT NULL,
  primerApellidoUsu VARCHAR2(255) NOT NULL,
  segundoApellidoUsu VARCHAR2(255),
  correoUsu VARCHAR2(255) NOT NULL UNIQUE,
  numeroTelefonoUsu VARCHAR2(255) NOT NULL UNIQUE,
  fechaNacimientoUsu TIMESTAMP NOT NULL,
  contrasenaUsu VARCHAR2(255) NOT NULL,
  fotoUrlUsu VARCHAR2(255) NOT NULL,
  saldoCarteraUsu NUMBER(19) DEFAULT 0,
  fechaCreacionUsu TIMESTAMP DEFAULT SYSTIMESTAMP,
  updatedAtUsu TIMESTAMP DEFAULT SYSTIMESTAMP,
  idEstUsu NUMBER(10) DEFAULT 1,
  FOREIGN KEY (idEstUsu) REFERENCES ESTADO_USUARIO(id)
);

CREATE TABLE VERIFICACION_CORREO (
  idVer NUMBER(10) PRIMARY KEY,
  documentoUsuVer VARCHAR2(255) NOT NULL,
  codigoVer VARCHAR2(255) NOT NULL UNIQUE,
  fechaExpiracionVer TIMESTAMP NOT NULL,
  usadoVer VARCHAR2(1) DEFAULT 'N',
  fechaCreacionVer TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (documentoUsuVer) REFERENCES USUARIO(documentoUsu) ON DELETE CASCADE
);

CREATE TABLE USUARIO_PERFIL (
  idUsp NUMBER(10) PRIMARY KEY,
  documentoUsuUsp VARCHAR2(255) NOT NULL,
  idPerUsp NUMBER(10) NOT NULL,
  calificacionUsu NUMBER(19) DEFAULT 500,
  fechaAsignacionUsp TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (documentoUsuUsp) REFERENCES USUARIO(documentoUsu) ON DELETE CASCADE,
  FOREIGN KEY (idPerUsp) REFERENCES PERFIL(id)
);

-- ============================================================================
-- VEHICLES (1)
-- ============================================================================

CREATE TABLE VEHICULO (
  idVeh NUMBER(10) PRIMARY KEY,
  placaVeh VARCHAR2(255) NOT NULL UNIQUE,
  documentoUsuVeh VARCHAR2(255) NOT NULL,
  idMarVeh NUMBER(10) NOT NULL,
  idModVeh NUMBER(10) NOT NULL,
  idColVeh NUMBER(10) NOT NULL,
  idEstVeh NUMBER(10) NOT NULL,
  licenciaUrlVeh VARCHAR2(255) NOT NULL,
  vehiculoUrlVeh VARCHAR2(255) NOT NULL,
  licTransitoUrlVeh VARCHAR2(255) NOT NULL,
  soatUrlVeh VARCHAR2(255) NOT NULL,
  fechaRegistroVeh TIMESTAMP DEFAULT SYSTIMESTAMP,
  updatedAtVeh TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (documentoUsuVeh) REFERENCES USUARIO(documentoUsu) ON DELETE CASCADE,
  FOREIGN KEY (idMarVeh) REFERENCES MARCA_VEHICULO(id),
  FOREIGN KEY (idModVeh) REFERENCES MODELO_VEHICULO(id),
  FOREIGN KEY (idColVeh) REFERENCES COLOR_VEHICULO(id),
  FOREIGN KEY (idEstVeh) REFERENCES ESTADO_VEHICULO(id)
);

-- ============================================================================
-- ROUTES (2)
-- ============================================================================

CREATE TABLE RUTA (
  idRut NUMBER(10) PRIMARY KEY,
  placaVehRut NUMBER(10) NOT NULL,
  idUspRut NUMBER(10) NOT NULL,
  latitudOrigenRut NUMBER(19) NOT NULL,
  longitudOrigenRut NUMBER(19) NOT NULL,
  latitudDestinoRut NUMBER(19) NOT NULL,
  longitudDestinoRut NUMBER(19) NOT NULL,
  horaSalidaRut TIMESTAMP NOT NULL,
  cuposTotalesRut NUMBER(10) NOT NULL,
  cuposDisponiblesRut NUMBER(10) NOT NULL,
  precioCupoRut NUMBER(19) NOT NULL,
  distanciaKmRut NUMBER(19) NOT NULL,
  idEstRut NUMBER(10) NOT NULL,
  fechaCreacionRut TIMESTAMP DEFAULT SYSTIMESTAMP,
  updatedAtRut TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (placaVehRut) REFERENCES VEHICULO(idVeh),
  FOREIGN KEY (idUspRut) REFERENCES USUARIO_PERFIL(idUsp),
  FOREIGN KEY (idEstRut) REFERENCES ESTADO_RUTA(id)
);

CREATE TABLE PUNTO_ENCUENTRO (
  idPun NUMBER(10) NOT NULL,
  idRutPun NUMBER(10) NOT NULL,
  latitudPun NUMBER(19) NOT NULL,
  longitudPun NUMBER(19) NOT NULL,
  ordenPun NUMBER(10) NOT NULL,
  PRIMARY KEY (idPun, idRutPun),
  FOREIGN KEY (idRutPun) REFERENCES RUTA(idRut) ON DELETE CASCADE
);

-- ============================================================================
-- SOLICITUDES & CUPONES (2)
-- ============================================================================

CREATE TABLE SOLICITUD_CUPO (
  idSol NUMBER(10) PRIMARY KEY,
  idRutSol NUMBER(10) NOT NULL,
  idUspSol NUMBER(10) NOT NULL,
  idEssSol NUMBER(10) NOT NULL,
  idMpaSol NUMBER(10) NOT NULL,
  montoSol NUMBER(19) NOT NULL,
  fechaCreacionSol TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (idRutSol) REFERENCES RUTA(idRut),
  FOREIGN KEY (idUspSol) REFERENCES USUARIO_PERFIL(idUsp),
  FOREIGN KEY (idEssSol) REFERENCES ESTADO_SOLICITUD(id),
  FOREIGN KEY (idMpaSol) REFERENCES METODO_PAGO(id)
);

CREATE TABLE CUPO_RUTA (
  idSolCrp NUMBER(10) NOT NULL,
  idRutCrp NUMBER(10) NOT NULL,
  idCurCrp NUMBER(10) NOT NULL,
  PRIMARY KEY (idSolCrp, idRutCrp),
  FOREIGN KEY (idSolCrp) REFERENCES SOLICITUD_CUPO(idSol) ON DELETE CASCADE,
  FOREIGN KEY (idRutCrp) REFERENCES RUTA(idRut) ON DELETE CASCADE,
  FOREIGN KEY (idCurCrp) REFERENCES ESTADO_CUR(id)
);

-- ============================================================================
-- TRANSACTIONS (1)
-- ============================================================================

CREATE TABLE TRANSACCIONES_CARTERA (
  idTra NUMBER(10) PRIMARY KEY,
  documentoUsuTra VARCHAR2(255) NOT NULL,
  idTitTra NUMBER(10) NOT NULL,
  montoTra NUMBER(19) NOT NULL,
  saldoResultanteTra NUMBER(19) NOT NULL,
  fechaRealizacionTra TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (documentoUsuTra) REFERENCES USUARIO(documentoUsu) ON DELETE CASCADE,
  FOREIGN KEY (idTitTra) REFERENCES TIPO_TRANSACCION(id)
);

-- ============================================================================
-- HISTORY & RATINGS (2)
-- ============================================================================

CREATE TABLE HISTORIAL_VIAJE (
  idHis NUMBER(10) PRIMARY KEY,
  documentoUsuHis VARCHAR2(255) NOT NULL,
  idSolHis NUMBER(10) NOT NULL,
  idRutHis NUMBER(10) NOT NULL,
  rolViajeHis VARCHAR2(255) NOT NULL,
  costoHis NUMBER(19) NOT NULL,
  fechaCreacionHis TIMESTAMP DEFAULT SYSTIMESTAMP,
  UNIQUE (idSolHis, idRutHis),
  FOREIGN KEY (documentoUsuHis) REFERENCES USUARIO(documentoUsu) ON DELETE CASCADE,
  FOREIGN KEY (idSolHis, idRutHis) REFERENCES CUPO_RUTA(idSolCrp, idRutCrp)
);

CREATE TABLE CALIFICACION (
  idCal NUMBER(10) PRIMARY KEY,
  idSolCal NUMBER(10) NOT NULL,
  documentoCalificadorCal VARCHAR2(255) NOT NULL,
  documentoCalificadoCal VARCHAR2(255) NOT NULL,
  rolCalificadorCal VARCHAR2(255) NOT NULL,
  puntajeCal NUMBER(19) NOT NULL,
  comentarioCal VARCHAR2(255),
  fechaCreacionCal TIMESTAMP DEFAULT SYSTIMESTAMP,
  idSolCrpCal NUMBER(10) NOT NULL,
  idRutCrpCal NUMBER(10) NOT NULL,
  idHisCal NUMBER(10) NOT NULL,
  FOREIGN KEY (idSolCal) REFERENCES SOLICITUD_CUPO(idSol),
  FOREIGN KEY (documentoCalificadorCal) REFERENCES USUARIO(documentoUsu),
  FOREIGN KEY (documentoCalificadoCal) REFERENCES USUARIO(documentoUsu),
  FOREIGN KEY (idSolCrpCal, idRutCrpCal) REFERENCES CUPO_RUTA(idSolCrp, idRutCrp),
  FOREIGN KEY (idHisCal) REFERENCES HISTORIAL_VIAJE(idHis)
);

-- ============================================================================
-- CREAR SECUENCIAS PARA AUTOINCREMENT
-- ============================================================================

CREATE SEQUENCE seq_estado_usuario START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_estado_vehiculo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_estado_ruta START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_estado_solicitud START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_estado_cur START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_tipo_transaccion START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_metodo_pago START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_marca_vehiculo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_modelo_vehiculo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_color_vehiculo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_perfil START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_menu START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_verificacion_correo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_usuario_perfil START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_vehiculo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_ruta START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_solicitud_cupo START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_transacciones_cartera START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_historial_viaje START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_calificacion START WITH 1 INCREMENT BY 1;

-- ============================================================================
-- CREAR TRIGGERS PARA AUTOINCREMENT
-- ============================================================================

CREATE OR REPLACE TRIGGER trg_estado_usuario
BEFORE INSERT ON ESTADO_USUARIO
FOR EACH ROW
BEGIN
  SELECT seq_estado_usuario.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_estado_vehiculo
BEFORE INSERT ON ESTADO_VEHICULO
FOR EACH ROW
BEGIN
  SELECT seq_estado_vehiculo.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_estado_ruta
BEFORE INSERT ON ESTADO_RUTA
FOR EACH ROW
BEGIN
  SELECT seq_estado_ruta.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_estado_solicitud
BEFORE INSERT ON ESTADO_SOLICITUD
FOR EACH ROW
BEGIN
  SELECT seq_estado_solicitud.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_estado_cur
BEFORE INSERT ON ESTADO_CUR
FOR EACH ROW
BEGIN
  SELECT seq_estado_cur.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_tipo_transaccion
BEFORE INSERT ON TIPO_TRANSACCION
FOR EACH ROW
BEGIN
  SELECT seq_tipo_transaccion.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_metodo_pago
BEFORE INSERT ON METODO_PAGO
FOR EACH ROW
BEGIN
  SELECT seq_metodo_pago.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_marca_vehiculo
BEFORE INSERT ON MARCA_VEHICULO
FOR EACH ROW
BEGIN
  SELECT seq_marca_vehiculo.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_modelo_vehiculo
BEFORE INSERT ON MODELO_VEHICULO
FOR EACH ROW
BEGIN
  SELECT seq_modelo_vehiculo.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_color_vehiculo
BEFORE INSERT ON COLOR_VEHICULO
FOR EACH ROW
BEGIN
  SELECT seq_color_vehiculo.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_perfil
BEFORE INSERT ON PERFIL
FOR EACH ROW
BEGIN
  SELECT seq_perfil.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_menu
BEFORE INSERT ON MENU
FOR EACH ROW
BEGIN
  SELECT seq_menu.NEXTVAL INTO :NEW.id FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_verificacion_correo
BEFORE INSERT ON VERIFICACION_CORREO
FOR EACH ROW
BEGIN
  SELECT seq_verificacion_correo.NEXTVAL INTO :NEW.idVer FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_usuario_perfil
BEFORE INSERT ON USUARIO_PERFIL
FOR EACH ROW
BEGIN
  SELECT seq_usuario_perfil.NEXTVAL INTO :NEW.idUsp FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_vehiculo
BEFORE INSERT ON VEHICULO
FOR EACH ROW
BEGIN
  SELECT seq_vehiculo.NEXTVAL INTO :NEW.idVeh FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_ruta
BEFORE INSERT ON RUTA
FOR EACH ROW
BEGIN
  SELECT seq_ruta.NEXTVAL INTO :NEW.idRut FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_solicitud_cupo
BEFORE INSERT ON SOLICITUD_CUPO
FOR EACH ROW
BEGIN
  SELECT seq_solicitud_cupo.NEXTVAL INTO :NEW.idSol FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_transacciones_cartera
BEFORE INSERT ON TRANSACCIONES_CARTERA
FOR EACH ROW
BEGIN
  SELECT seq_transacciones_cartera.NEXTVAL INTO :NEW.idTra FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_historial_viaje
BEFORE INSERT ON HISTORIAL_VIAJE
FOR EACH ROW
BEGIN
  SELECT seq_historial_viaje.NEXTVAL INTO :NEW.idHis FROM dual;
END;
/

CREATE OR REPLACE TRIGGER trg_calificacion
BEFORE INSERT ON CALIFICACION
FOR EACH ROW
BEGIN
  SELECT seq_calificacion.NEXTVAL INTO :NEW.idCal FROM dual;
END;
/

-- ============================================================================
-- CARGAR DATOS INICIALES (CATÁLOGOS)
-- ============================================================================

INSERT INTO ESTADO_USUARIO (nombre, descripcion) VALUES ('ACTIVO', 'Usuario activo');
INSERT INTO ESTADO_USUARIO (nombre, descripcion) VALUES ('INACTIVO', 'Usuario inactivo');
INSERT INTO ESTADO_USUARIO (nombre, descripcion) VALUES ('SUSPENDIDO', 'Usuario suspendido');

INSERT INTO ESTADO_VEHICULO (nombre, descripcion) VALUES ('ACTIVO', 'Vehículo activo');
INSERT INTO ESTADO_VEHICULO (nombre, descripcion) VALUES ('INACTIVO', 'Vehículo inactivo');
INSERT INTO ESTADO_VEHICULO (nombre, descripcion) VALUES ('MANTENIMIENTO', 'En mantenimiento');

INSERT INTO ESTADO_RUTA (nombre, descripcion) VALUES ('PROGRAMADA', 'Ruta programada');
INSERT INTO ESTADO_RUTA (nombre, descripcion) VALUES ('EN_CURSO', 'Ruta en curso');
INSERT INTO ESTADO_RUTA (nombre, descripcion) VALUES ('COMPLETADA', 'Ruta completada');
INSERT INTO ESTADO_RUTA (nombre, descripcion) VALUES ('CANCELADA', 'Ruta cancelada');

INSERT INTO ESTADO_SOLICITUD (nombre, descripcion) VALUES ('PENDIENTE', 'Solicitud pendiente');
INSERT INTO ESTADO_SOLICITUD (nombre, descripcion) VALUES ('ACEPTADA', 'Solicitud aceptada');
INSERT INTO ESTADO_SOLICITUD (nombre, descripcion) VALUES ('RECHAZADA', 'Solicitud rechazada');
INSERT INTO ESTADO_SOLICITUD (nombre, descripcion) VALUES ('CANCELADA', 'Solicitud cancelada');

INSERT INTO ESTADO_CUR (nombre, descripcion) VALUES ('DISPONIBLE', 'Cupo disponible');
INSERT INTO ESTADO_CUR (nombre, descripcion) VALUES ('OCUPADO', 'Cupo ocupado');
INSERT INTO ESTADO_CUR (nombre, descripcion) VALUES ('CANCELADO', 'Cupo cancelado');

INSERT INTO TIPO_TRANSACCION (nombre, descripcion) VALUES ('DEPOSITO', 'Depósito a cartera');
INSERT INTO TIPO_TRANSACCION (nombre, descripcion) VALUES ('PAGO_VIAJE', 'Pago de viaje');
INSERT INTO TIPO_TRANSACCION (nombre, descripcion) VALUES ('REEMBOLSO', 'Reembolso');

INSERT INTO METODO_PAGO (nombre) VALUES ('CARTERA');
INSERT INTO METODO_PAGO (nombre) VALUES ('TARJETA_CREDITO');
INSERT INTO METODO_PAGO (nombre) VALUES ('TRANSFERENCIA');

INSERT INTO MARCA_VEHICULO (nombre) VALUES ('CHEVROLET');
INSERT INTO MARCA_VEHICULO (nombre) VALUES ('TOYOTA');
INSERT INTO MARCA_VEHICULO (nombre) VALUES ('FORD');
INSERT INTO MARCA_VEHICULO (nombre) VALUES ('RENAULT');
INSERT INTO MARCA_VEHICULO (nombre) VALUES ('KIA');

INSERT INTO MODELO_VEHICULO (nombre, anio) VALUES ('SPARK', 2023);
INSERT INTO MODELO_VEHICULO (nombre, anio) VALUES ('COROLLA', 2023);
INSERT INTO MODELO_VEHICULO (nombre, anio) VALUES ('FIESTA', 2023);
INSERT INTO MODELO_VEHICULO (nombre, anio) VALUES ('DUSTER', 2023);
INSERT INTO MODELO_VEHICULO (nombre, anio) VALUES ('PICANTO', 2023);

INSERT INTO COLOR_VEHICULO (nombre) VALUES ('BLANCO');
INSERT INTO COLOR_VEHICULO (nombre) VALUES ('NEGRO');
INSERT INTO COLOR_VEHICULO (nombre) VALUES ('ROJO');
INSERT INTO COLOR_VEHICULO (nombre) VALUES ('AZUL');
INSERT INTO COLOR_VEHICULO (nombre) VALUES ('PLATA');

INSERT INTO PERFIL (nombre, descripcion) VALUES ('PASAJERO', 'Perfil de pasajero');
INSERT INTO PERFIL (nombre, descripcion) VALUES ('CONDUCTOR', 'Perfil de conductor');
INSERT INTO PERFIL (nombre, descripcion) VALUES ('ADMIN', 'Perfil de administrador');

COMMIT;
