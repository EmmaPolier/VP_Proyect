'use client';

/**
 * Dashboard principal del admin
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CATALOG_CONFIG } from '@/lib/api-constants';

export default function AdminDashboard() {
  const catalogCount = Object.keys(CATALOG_CONFIG).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">¡Bienvenido Admin!</h1>
        <p className="text-gray-600">
          Gestiona todos los catálogos y datos del sistema.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Catálogos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{catalogCount}</div>
            <p className="text-xs text-muted-foreground">
              Catálogos disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Activo</div>
            <p className="text-xs text-muted-foreground">Sistema operativo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">OK</div>
            <p className="text-xs text-muted-foreground">Backend conectado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              BD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Oracle XE</div>
            <p className="text-xs text-muted-foreground">Producción</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Acceso Rápido a Catálogos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CATALOG_CONFIG).map(([key, config]) => (
            <Link
              key={key}
              href={`/admin/catalogs/${key}`}
              className="no-underline"
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    {config.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Gestiona {config.label.toLowerCase()}
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Ver →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ Información</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p>
            <strong>Semana 2 - Frontend Admin Panel:</strong> Interfaz de
            administración para gestionar catálogos del sistema.
          </p>
          <p>
            <strong>Tablas disponibles:</strong> Perfiles, Marcas, Modelos,
            Colores, Estados, Métodos de Pago y Tipos de Transacción.
          </p>
          <p>
            <strong>Funcionalidades:</strong> CRUD completo con validación,
            paginación, búsqueda y confirmación de eliminar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
