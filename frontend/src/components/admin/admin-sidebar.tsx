'use client';

/**
 * Sidebar de navegación para admin
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATALOG_CONFIG } from '@/lib/api-constants';
import { Separator } from '@/components/ui/separator';

interface AdminSidebarProps {
  onClose?: () => void;
}

export function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.includes(href);

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col overflow-hidden">
      {/* Logo/Header */}
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-bold">VamonosPues</h2>
        <p className="text-xs text-slate-400">Admin Panel</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Main Dashboard */}
        <Link
          href="/admin"
          className={`block px-4 py-2 rounded-md transition ${
            pathname === '/admin'
              ? 'bg-primary text-white'
              : 'hover:bg-slate-800'
          }`}
          onClick={() => onClose?.()}
        >
          📊 Dashboard
        </Link>

        <Separator className="my-4 bg-slate-700" />

        {/* Catálogos Section */}
        <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Catálogos
        </p>

        {Object.entries(CATALOG_CONFIG).map(([key, config]) => (
          <Link
            key={key}
            href={`/admin/catalogs/${key}`}
            className={`block px-4 py-2 rounded-md transition text-sm ${
              isActive(`/admin/catalogs/${key}`)
                ? 'bg-primary text-white'
                : 'hover:bg-slate-800'
            }`}
            onClick={() => onClose?.()}
          >
            <span className="mr-2">{config.icon}</span>
            {config.label}
          </Link>
        ))}

        <Separator className="my-4 bg-slate-700" />

        {/* Future Sections */}
        <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Próximamente
        </p>

        <div className="px-4 py-2 text-sm text-slate-500">👥 Usuarios</div>
        <div className="px-4 py-2 text-sm text-slate-500">🚗 Vehículos</div>
        <div className="px-4 py-2 text-sm text-slate-500">🗺️ Rutas</div>
        <div className="px-4 py-2 text-sm text-slate-500">📋 Solicitudes</div>
        <div className="px-4 py-2 text-sm text-slate-500">📊 Estadísticas</div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button className="w-full px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 transition text-sm">
          🚪 Salir
        </button>
      </div>
    </div>
  );
}
