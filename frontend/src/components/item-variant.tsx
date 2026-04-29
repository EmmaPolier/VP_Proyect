"use client"
import { useRouter } from "next/navigation"
import { Users, Truck } from "lucide-react"

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

export function ItemVariant() {
  const router = useRouter()

  const handlePassengerClick = () => {
    router.push("/signup/passenger") // Navega al formulario de pasajero
  }

  const handleDriverClick = () => {
    router.push("/signup/driver") // Navega al formulario de conductor
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      {/* Opción 1: Pasajero */}
      <Item 
        onClick={handlePassengerClick}
        className="cursor-pointer hover:ring-2 hover:ring-offset-2 transition-all"
      >
        <ItemMedia variant="icon">
          <Users />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Iniciar sesión como pasajero</ItemTitle>
          <ItemDescription>
            Viaja con facilidad y comodidad
          </ItemDescription>
        </ItemContent>
      </Item>

      {/* Opción 2: Conductor */}
      <Item
        onClick={handleDriverClick}
        className="cursor-pointer hover:ring-2 hover:ring-offset-2 transition-all        git branch -M main"
      >
        <ItemMedia variant="icon">
          <Truck />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Iniciar sesión como conductor</ItemTitle>
          <ItemDescription>
            Comienza a ganar dinero conduciendo
          </ItemDescription>
        </ItemContent>
      </Item>
    </div>
  )
}