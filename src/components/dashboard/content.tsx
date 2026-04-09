"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Star, DollarSign, Plus, MessageSquare, Settings } from "lucide-react"

const recentRoutes = [
  {
    id: 1,
    from: "San Cristóbal",
    to: "Politécnico",
    time: "7:15 am",
    rating: "4.9",
    distance: "2 cuadras",
    price: "$6.500",
    status: "Completado",
  },
  {
    id: 2,
    from: "Belén",
    to: "Politécnico",
    time: "7:15 am",
    rating: "4.8",
    distance: "2 cuadras",
    price: "$6.500",
    status: "Completado",
  },
  {
    id: 3,
    from: "Caldas",
    to: "Politécnico",
    time: "7:15 am",
    rating: "4.9",
    distance: "2 cuadras",
    price: "$6.500",
    status: "En progreso",
  },
]

interface DashboardContentProps {
  userType?: "passenger" | "driver"
}

export function DashboardContent({ userType = "passenger" }: DashboardContentProps) {
  const isDriver = userType === "driver"

  if (isDriver) {
    return (
      <div className="p-6 space-y-6">
        {/* Header with profile and button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Davison J.</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Conductor{" "}
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                4.9
              </p>
            </div>
          </div>
          <Button className="bg-black text-white hover:bg-black/90">
            <Plus className="w-4 h-4 mr-2" />
            Publicar nueva ruta
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Rutas activas</p>
              <p className="text-3xl font-bold">2</p>
              <p className="text-xs text-muted-foreground">1 en curso ahora</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Viajes completados</p>
              <p className="text-3xl font-bold">50</p>
              <p className="text-xs text-muted-foreground">5 esta semana</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Calificación</p>
              <p className="text-3xl font-bold flex items-center gap-1">
                4.9 <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </p>
              <p className="text-xs text-muted-foreground">De 124 calificaciones</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Ganancia del mes</p>
              <p className="text-3xl font-bold text-green-600">$312k</p>
              <p className="text-xs text-muted-foreground">Ganancias mes</p>
            </CardContent>
          </Card>
        </div>

        {/* New Request Section */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="font-medium mb-2">Nueva solicitud de cupo</p>
            <p className="text-sm text-muted-foreground">
              Laura M. quiere unirse a tu ruta San Cristóbal → Politécnico
            </p>
            <Button size="sm" variant="ghost" className="mt-4">
              Ver solicitud →
            </Button>
          </CardContent>
        </Card>

        {/* Routes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">San Cristóbal → Politécnico</CardTitle>
              <CardDescription>7:15 am · 4.9 · 2 cupos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Cupos - 4</p>
              <Button className="w-full bg-black text-white hover:bg-black/90">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Gestionar viaje
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Solicitud pendiente</CardTitle>
              <CardDescription>Laura M. quiere unirse a tu ruta San Cristóbal → Politécnico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">Aceptar</Button>
              <Button variant="outline" className="w-full">Rechazar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Solicitud pendiente</CardTitle>
              <CardDescription>Laura M. quiere unirse a tu ruta San Cristóbal → Politécnico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">Aceptar</Button>
              <Button variant="outline" className="w-full">Rechazar</Button>
            </CardContent>
          </Card>
        </div>

        {/* Active Routes */}
        <Card>
          <CardHeader>
            <CardTitle>Rutas activas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
              <div className="flex-1">
                <p className="font-medium">Belén → Politécnico</p>
                <p className="text-sm text-muted-foreground">7:15 am · 4.9 · 2 cupos</p>
              </div>
              <Button variant="ghost" size="sm">Ver →</Button>
            </div>
            <div className="flex items-center justify-between p-4 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex-1">
                <p className="font-medium">Caldas → Politécnico</p>
                <p className="text-sm text-muted-foreground">7:15 am · 4.9 · 2 cupos</p>
              </div>
              <Button variant="ghost" size="sm">Ver →</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Passenger Dashboard
  return (
    <div className="p-6 space-y-6">
      {/* Tabs */}
      <Tabs defaultValue="buscar" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="buscar">Buscar ruta</TabsTrigger>
          <TabsTrigger value="viajes">Mis viajes</TabsTrigger>
          <TabsTrigger value="carrera">Carrera</TabsTrigger>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
        </TabsList>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Viajes realizados</p>
              <p className="text-3xl font-bold">12</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Mi calificación</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                4.9
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Saldo cartera</p>
              <p className="text-3xl font-bold text-green-600">$20k</p>
            </CardContent>
          </Card>
        </div>

        {/* Buscar Tab */}
        <TabsContent value="buscar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buscar ruta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Origen</label>
                  <Input placeholder="De dónde?" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destino</label>
                  <Input placeholder="A dónde?" />
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="font-medium">Hora: 7:00 am</p>
                <p className="text-sm text-muted-foreground">Precio máx: $8.000</p>
              </div>

              <Button className="w-full bg-black text-white hover:bg-black/90">Buscar rutas</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mis Viajes Tab */}
        <TabsContent value="viajes">
          <Card>
            <CardHeader>
              <CardTitle>Mis viajes</CardTitle>
              <CardDescription>Historial de viajes recientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ruta</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Distancia</TableHead>
                    <TableHead>Calificación</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRoutes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{route.from}</span>
                          <span className="text-xs text-muted-foreground">
                            → {route.to}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{route.time}</TableCell>
                      <TableCell>{route.distance}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {route.rating}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{route.price}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{route.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Carrera Tab */}
        <TabsContent value="carrera">
          <Card>
            <CardHeader>
              <CardTitle>Mi Carrera</CardTitle>
              <CardDescription>Estadísticas de desempeño</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Viajes totales</p>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Ingresos</p>
                    <p className="text-2xl font-bold">$45.000</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Promedio</p>
                    <p className="text-2xl font-bold">4.9★</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Aceptación</p>
                    <p className="text-2xl font-bold">98%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Perfil Tab */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <Input placeholder="Tu nombre" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input placeholder="tu@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input placeholder="+57 XXX XXX XXX" />
                </div>
                <Button className="w-full bg-black text-white hover:bg-black/90">Guardar cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Routes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Rutas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentRoutes.map((route) => (
              <div
                key={route.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                  route.id === 1 ? "border-2 border-blue-500 bg-blue-50 dark:bg-blue-950/20" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {route.from} → {route.to}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {route.time} · {route.distance}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{route.rating}</span>
                  </div>
                  <p className="font-medium min-w-fit">{route.price}</p>
                  <Button variant="outline" size="sm">
                    {route.id === 1 ? "Solicitar" : "Ver"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
