"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface Perfil {
  id: number
  nombre: string
  calificacion: number
}

interface AuthContextType {
  perfiles: Perfil[]
  rolActual: number
  usuario: {
    documento: string
    email: string
    nombres: string
  } | null
  token: string | null
  setPerfiles: (perfiles: Perfil[]) => void
  setRolActual: (rol: number) => void
  setUsuario: (usuario: any) => void
  setToken: (token: string | null) => void
  cargarDatos: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [rolActual, setRolActual] = useState<number>(1)
  const [usuario, setUsuario] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)

  const cargarDatos = () => {
    // Cargar desde localStorage
    const savedToken = localStorage.getItem("authToken")
    const savedRol = localStorage.getItem("rolActivo")
    const savedPerfiles = localStorage.getItem("perfiles")
    const savedUsuario = localStorage.getItem("usuario")

    setToken(savedToken)
    if (savedRol) setRolActual(parseInt(savedRol))
    if (savedPerfiles) {
      try {
        setPerfiles(JSON.parse(savedPerfiles))
      } catch (e) {
        console.error("Error cargando perfiles:", e)
      }
    }
    if (savedUsuario) {
      try {
        setUsuario(JSON.parse(savedUsuario))
      } catch (e) {
        console.error("Error cargando usuario:", e)
      }
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const value = {
    perfiles,
    rolActual,
    usuario,
    token,
    setPerfiles,
    setRolActual,
    setUsuario,
    setToken,
    cargarDatos,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return context
}
