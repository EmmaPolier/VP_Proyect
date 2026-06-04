"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api-client"
import { API_ENDPOINTS } from "@/lib/api-constants"
import { Loader2, AlertCircle, DollarSign, ArrowUpRight, ArrowDownLeft, RotateCcw } from "lucide-react"

interface Saldo {
  saldo: number
}

interface Transaccion {
  id: number
  tipoId: number
  tipoNombre: string
  monto: number
  saldoResultante: number
  fecha: string
}

interface HistorialResponse {
  historial: Transaccion[]
}

export function DriverWallet() {
  const [saldo, setSaldo] = useState<number>(0)
  const [historial, setHistorial] = useState<Transaccion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showRechargeForm, setShowRechargeForm] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Obtener saldo e historial al montar
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")

      const [saldoRes, historialRes] = await Promise.all([
        apiClient.get<Saldo>(API_ENDPOINTS.WALLET_SALDO),
        apiClient.get<HistorialResponse>(API_ENDPOINTS.WALLET_HISTORIAL),
      ])

      setSaldo(saldoRes.data?.saldo || 0)
      setHistorial(historialRes.data?.historial || [])
    } catch (err: any) {
      console.error("Error fetching wallet data:", err)
      setError(err?.message || "Error al cargar cartera")
    } finally {
      setLoading(false)
    }
  }

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccessMessage("")

    try {
      const monto = parseFloat(rechargeAmount)
      if (!monto || monto < 1000) {
        setError("Por favor ingresa un monto válido. Mínimo: $1000")
        setSubmitting(false)
        return
      }

      const response = await apiClient.post(API_ENDPOINTS.WALLET_RECARGA, {
        monto,
        tipoTransaccionId: 1, // 1 = RECARGA
      })

      setSuccessMessage(`¡Recarga exitosa! Nuevo saldo: $${response.data?.saldo?.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
      setRechargeAmount("")
      setShowRechargeForm(false)

      // Recargar datos
      await fetchData()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err: any) {
      console.error("Error processing recharge:", err)
      setError(err?.message || "Error al procesar la recarga")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mi Cartera</CardTitle>
          <CardDescription>Saldo y historial de transacciones</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Saldo Card */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saldo Actual</CardTitle>
              <CardDescription>Tu crédito disponible en la cartera virtual</CardDescription>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-4xl font-bold text-green-600">
              ${saldo.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {error && (
              <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {successMessage && (
              <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <RotateCcw className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-600">{successMessage}</p>
              </div>
            )}

            {!showRechargeForm ? (
              <Button
                onClick={() => setShowRechargeForm(true)}
                className="w-full gap-2"
              >
                <ArrowUpRight className="h-4 w-4" />
                Recargar Cartera
              </Button>
            ) : (
              <form onSubmit={handleRecharge} className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Monto a recargar ($) *</label>
                  <Input
                    type="number"
                    placeholder="Ingresa el monto"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    min="1000"
                    step="1000"
                    className="mt-1"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo: $1000</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowRechargeForm(false)
                      setRechargeAmount("")
                    }}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={submitting}
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirmar Recarga
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Historial de Transacciones */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Registro de todas tus transacciones de cartera</CardDescription>
        </CardHeader>
        <CardContent>
          {historial.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay transacciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-full ${
                      tx.tipoNombre === "RECARGA"
                        ? "bg-green-100"
                        : tx.tipoNombre === "PAGO_VIAJE"
                        ? "bg-blue-100"
                        : "bg-yellow-100"
                    }`}>
                      {tx.tipoNombre === "RECARGA" ? (
                        <ArrowUpRight className={`h-4 w-4 ${
                          tx.tipoNombre === "RECARGA"
                            ? "text-green-600"
                            : tx.tipoNombre === "PAGO_VIAJE"
                            ? "text-blue-600"
                            : "text-yellow-600"
                        }`} />
                      ) : (
                        <ArrowDownLeft className={`h-4 w-4 ${
                          tx.tipoNombre === "RECARGA"
                            ? "text-green-600"
                            : tx.tipoNombre === "PAGO_VIAJE"
                            ? "text-blue-600"
                            : "text-yellow-600"
                        }`} />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {tx.tipoNombre === "RECARGA"
                          ? "Recarga de Cartera"
                          : tx.tipoNombre === "PAGO_VIAJE"
                          ? "Pago de Viaje"
                          : "Reembolso"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.fecha).toLocaleDateString('es-CO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.tipoNombre === "RECARGA"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}>
                      {tx.tipoNombre === "RECARGA" ? "+" : "-"}
                      ${tx.monto.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Saldo: ${tx.saldoResultante.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
