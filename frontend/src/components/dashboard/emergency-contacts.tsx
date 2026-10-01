"use client"

import { useEffect, useState, type FormEvent } from 'react'
import { LoaderCircle, Pencil, Plus, Power, Save, Trash2, X } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/lib/api-constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EmergencyContact {
  id: number
  nombre: string
  relacion: string
  correo: string
  activo: boolean
}

interface ContactForm {
  nombre: string
  relacion: string
  correo: string
}

const MAX_ACTIVE_CONTACTS = 5
const EMPTY_FORM: ContactForm = { nombre: '', relacion: '', correo: '' }

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'
}

export function EmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [reloadAttempt, setReloadAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadContacts() {
      try {
        setLoading(true)
        const response = await apiClient.get<EmergencyContact[]>(API_ENDPOINTS.EMERGENCY_CONTACTS)
        if (!cancelled) {
          setContacts(response.data ?? [])
          setLoadError('')
        }
      } catch (error) {
        if (!cancelled) setLoadError(getErrorMessage(error))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadContacts()
    return () => { cancelled = true }
  }, [reloadAttempt])

  const activeCount = contacts.filter((contact) => contact.activo).length

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setFormMode('create')
    setEditingId(null)
    setActionError('')
    setSuccessMessage('')
  }

  function openEditForm(contact: EmergencyContact) {
    setForm({ nombre: contact.nombre, relacion: contact.relacion, correo: contact.correo })
    setFormMode('edit')
    setEditingId(contact.id)
    setActionError('')
    setSuccessMessage('')
  }

  function closeForm() {
    setFormMode(null)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setActionError('')
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedForm = {
      nombre: form.nombre.trim(),
      relacion: form.relacion.trim(),
      correo: form.correo.trim().toLowerCase()
    }

    if (!normalizedForm.nombre || normalizedForm.nombre.length > 100) {
      setActionError('El nombre es obligatorio y debe tener máximo 100 caracteres.')
      return
    }
    if (!normalizedForm.relacion || normalizedForm.relacion.length > 50) {
      setActionError('La relación es obligatoria y debe tener máximo 50 caracteres.')
      return
    }
    if (normalizedForm.correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedForm.correo)) {
      setActionError('Ingresa un correo electrónico válido de máximo 150 caracteres.')
      return
    }

    setSaving(true)
    setActionError('')
    setSuccessMessage('')

    try {
      if (formMode === 'edit' && editingId !== null) {
        const response = await apiClient.patch<EmergencyContact>(
          `${API_ENDPOINTS.EMERGENCY_CONTACTS}/${editingId}`,
          normalizedForm
        )
        setContacts((current) => current.map((contact) =>
          contact.id === editingId ? { ...contact, ...normalizedForm } : contact
        ))
        setSuccessMessage(response.message || 'Contacto actualizado.')
      } else {
        const response = await apiClient.post<EmergencyContact>(API_ENDPOINTS.EMERGENCY_CONTACTS, normalizedForm)
        if (response.data) setContacts((current) => [response.data as EmergencyContact, ...current])
        setSuccessMessage(response.message || 'Contacto agregado.')
      }
      setFormMode(null)
      setEditingId(null)
      setForm(EMPTY_FORM)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function toggleContact(contact: EmergencyContact) {
    setUpdatingId(contact.id)
    setActionError('')
    setSuccessMessage('')
    try {
      const response = await apiClient.patch<EmergencyContact>(
        `${API_ENDPOINTS.EMERGENCY_CONTACTS}/${contact.id}`,
        { activo: !contact.activo }
      )
      setContacts((current) => current.map((item) =>
        item.id === contact.id ? { ...item, activo: !contact.activo } : item
      ))
      setSuccessMessage(response.message || `Contacto ${contact.activo ? 'desactivado' : 'activado'}.`)
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setUpdatingId(null)
    }
  }

  async function deleteContact(contact: EmergencyContact) {
    if (!window.confirm(`¿Eliminar permanentemente a ${contact.nombre}? El correo quedará disponible para reutilizar.`)) {
      return
    }

    setUpdatingId(contact.id)
    setActionError('')
    setSuccessMessage('')
    try {
      const response = await apiClient.delete(`${API_ENDPOINTS.EMERGENCY_CONTACTS}/${contact.id}`)
      setContacts((current) => current.filter((item) => item.id !== contact.id))
      setSuccessMessage(response.message || 'Contacto eliminado.')
      if (editingId === contact.id) closeForm()
    } catch (error) {
      setActionError(getErrorMessage(error))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Contactos de emergencia</CardTitle>
          <CardDescription className="mt-1">
            Los contactos activos reciben las alertas. Máximo {MAX_ACTIVE_CONTACTS} activos.
          </CardDescription>
        </div>
        <Button type="button" onClick={openCreateForm} disabled={saving || formMode === 'create'}>
          <Plus aria-hidden="true" />
          Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3 text-sm">
          <span className="text-muted-foreground">Contactos activos</span>
          <Badge variant={activeCount >= MAX_ACTIVE_CONTACTS ? 'destructive' : 'secondary'}>
            {activeCount} / {MAX_ACTIVE_CONTACTS}
          </Badge>
        </div>
        {activeCount >= MAX_ACTIVE_CONTACTS && (
          <p className="text-sm text-muted-foreground">Desactiva un contacto antes de agregar o activar otro.</p>
        )}

        {loadError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <span>No se pudieron cargar los contactos: {loadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setReloadAttempt((attempt) => attempt + 1)}>
              Reintentar
            </Button>
          </div>
        )}
        {actionError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
        {successMessage && <p role="status" className="rounded-md border border-emerald-700/20 bg-emerald-700/5 p-3 text-sm text-emerald-800">{successMessage}</p>}

        {formMode === 'create' && renderForm()}

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            Cargando contactos...
          </div>
        ) : !loadError && contacts.length === 0 ? (
          <div className="border-y py-8 text-center">
            <p className="font-medium">Aún no tienes contactos de emergencia</p>
            <p className="mt-1 text-sm text-muted-foreground">Agrega una persona para que pueda recibir alertas de tus viajes.</p>
            {!formMode && <Button className="mt-4" variant="outline" onClick={openCreateForm}><Plus aria-hidden="true" />Agregar primer contacto</Button>}
          </div>
        ) : (
          <ul className="divide-y">
            {contacts.map((contact) => (
              <li key={contact.id} className="py-4">
                {formMode === 'edit' && editingId === contact.id ? renderForm() : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{contact.nombre}</p>
                        <Badge variant={contact.activo ? 'default' : 'outline'}>{contact.activo ? 'Activo' : 'Inactivo'}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{contact.relacion}</p>
                      <p className="break-all text-sm">{contact.correo}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void toggleContact(contact)}
                        disabled={updatingId !== null || saving || (!contact.activo && activeCount >= MAX_ACTIVE_CONTACTS)}
                        aria-pressed={contact.activo}
                      >
                        {updatingId === contact.id ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Power aria-hidden="true" />}
                        {contact.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEditForm(contact)} disabled={updatingId !== null || saving} aria-label={`Editar ${contact.nombre}`} title="Editar">
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => void deleteContact(contact)} disabled={updatingId !== null || saving} aria-label={`Eliminar ${contact.nombre}`} title="Eliminar">
                        {updatingId === contact.id ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )

  function renderForm() {
    return (
      <form onSubmit={submitForm} className="space-y-4 rounded-md border p-4" noValidate>
        <h3 className="font-semibold">{formMode === 'edit' ? 'Editar contacto' : 'Nuevo contacto'}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergency-contact-name">Nombre</Label>
            <Input id="emergency-contact-name" name="nombre" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} required maxLength={100} autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergency-contact-relation">Relación</Label>
            <Input id="emergency-contact-relation" name="relacion" value={form.relacion} onChange={(event) => setForm({ ...form, relacion: event.target.value })} required maxLength={50} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="emergency-contact-email">Correo electrónico</Label>
            <Input id="emergency-contact-email" name="correo" type="email" value={form.correo} onChange={(event) => setForm({ ...form, correo: event.target.value })} required maxLength={150} autoComplete="email" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
          <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
            <X aria-hidden="true" />Cancelar
          </Button>
        </div>
      </form>
    )
  }
}