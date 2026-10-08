"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface Perfil {
  id: number
  nombre: string
  calificacion: number
}

interface Usuario {
  documento: string
  email: string
  nombres: string
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
  setUsuario: (usuario: Usuario | null) => void
  setToken: (token: string | null) => void
  cargarDatos: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [rolActual, setRolActual] = useState<number>(1)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
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
        const parsedPerfiles: unknown = JSON.parse(savedPerfiles)
        if (Array.isArray(parsedPerfiles)) setPerfiles(parsedPerfiles as Perfil[])
      } catch (e) {
        console.error("Error cargando perfiles:", e)
      }
    }
    if (savedUsuario) {
      try {
        setUsuario(JSON.parse(savedUsuario) as Usuario)
      } catch (e) {
        console.error("Error cargando usuario:", e)
      }
    }
  }

  useEffect(() => {
    // Hydrate the context from browser storage after client mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
