"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: number, comment: string) => void
  targetName: string
  role: "PASAJERO" | "CONDUCTOR"
  loading: boolean
}

const STAR_LABELS = ["", "Muy malo", "Regular", "Bien", "Muy bien", "Excelente"]

export default function RatingModal({
  isOpen,
  onClose,
  onSubmit,
  targetName,
  role,
  loading,
}: RatingModalProps) {
  const [rating, setRating] = React.useState(0)
  const [hovered, setHovered] = React.useState(0)
  const [comment, setComment] = React.useState("")

  React.useEffect(() => {
    if (!isOpen) {
      setRating(0)
      setHovered(0)
      setComment("")
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating <= 0) return
    onSubmit(rating, comment.trim())
  }

  const active = hovered || rating

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0 max-w-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden gap-0">

        {/* Header */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold leading-tight text-slate-900">
                  Calificar {role === "PASAJERO" ? "pasajero" : "conductor"}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-0.5">
                  Viaje con{" "}
                  <span className="font-medium text-slate-700">{targetName}</span>
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5">
              <X className="w-4 h-4 text-slate-600" />
            </DialogClose>
          </div>
        </div>

        <div className="h-px bg-slate-100 mx-6" />

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 flex flex-col gap-5">

            {/* Star rating */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Valoración
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const isActive = value <= active
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      onMouseEnter={() => setHovered(value)}
                      onMouseLeave={() => setHovered(0)}
                      aria-label={`Seleccionar ${value} estrellas`}
                      className={cn(
                        "flex-1 h-13 rounded-2xl border text-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
                        isActive
                          ? "bg-amber-50 border-amber-300 text-amber-500"
                          : "bg-slate-50 border-slate-200 text-slate-300 hover:border-slate-300 hover:bg-slate-100"
                      )}
                    >
                      ★
                    </button>
                  )
                })}
              </div>
              <p className="mt-2.5 text-sm text-slate-400 min-h-[20px]">
                {active > 0
                  ? <><span className="text-slate-600 font-medium">{STAR_LABELS[active]}</span> — {active} de 5 estrellas</>
                  : "Selecciona una cantidad de estrellas"}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="rating-comment"
                className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 block mb-2"
              >
                Comentario{" "}
                <span className="normal-case tracking-normal font-normal text-slate-300">
                  (opcional)
                </span>
              </label>
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="¿Cómo fue tu experiencia?"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-none outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="h-px bg-slate-100 mx-6" />
          <div className="px-6 py-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || rating <= 0}
              className="flex-[2] rounded-xl bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40"
            >
              {loading ? "Enviando..." : "Enviar calificación"}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  )
}