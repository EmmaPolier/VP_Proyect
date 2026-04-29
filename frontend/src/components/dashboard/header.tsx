"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
  userType?: "passenger" | "driver"
}

export function DashboardHeader({ userType = "passenger" }: DashboardHeaderProps) {
  return null
}
