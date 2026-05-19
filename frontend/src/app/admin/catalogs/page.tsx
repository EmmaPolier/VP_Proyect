'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CATALOG_CONFIG } from '@/lib/api-constants';
import { ArrowRight } from 'lucide-react';

export default function CatalogsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">📚 System Catalogs</h1>
        <p className="text-gray-600">
          Manage all system catalogs and master data for VamonosPues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(CATALOG_CONFIG).map(([key, config]) => (
          <Link
            key={key}
            href={`/admin/catalogs/${key}`}
            className="no-underline"
          >
            <Card className="hover:shadow-lg hover:border-primary transition-all cursor-pointer h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <span className="text-3xl">{config.icon}</span>
                  <span>{config.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage {config.label.toLowerCase()} in the system
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Open
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ Information</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 text-sm space-y-2">
          <p>
            <strong>7 Available Catalogs:</strong> Each one can be fully managed with CRUD operations (Create, Read, Update, Delete).
          </p>
          <p>
            <strong>Validation:</strong> All data is validated on the client and server to ensure integrity.
          </p>
          <p>
            <strong>Pagination:</strong> Lists are paginated for optimal performance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
