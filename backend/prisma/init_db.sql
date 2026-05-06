-- VP Project Database Setup Script
-- Ejecutar en PostgreSQL como superuser (postgres)

-- Crear usuario
CREATE USER vp_user WITH PASSWORD 'vp_password';

-- Crear base de datos
CREATE DATABASE vp_db OWNER vp_user;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE vp_db TO vp_user;

-- Conectar a la BD y dar permisos adicionales
\c vp_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO vp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO vp_user;

-- Verificar que la BD fue creada
SELECT datname FROM pg_database WHERE datname = 'vp_db';

-- Verificar usuario
SELECT usename FROM pg_user WHERE usename = 'vp_user';
