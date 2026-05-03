"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { api, type Stall } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface StallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stall: Stall | null
  eventId: number
  onSuccess: () => void
}

export function StallDialog({ open, onOpenChange, stall, eventId, onSuccess }: StallDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    defaultPassword: "",
  })
  const [phoneError, setPhoneError] = useState("")

  useEffect(() => {
    if (!open) return

    if (stall) {
      setFormData({
        name: stall.name,
        phone: stall.phone,
        defaultPassword: "",
      })
      setPhoneError("")
      return
    }

    setFormData({
      name: "",
      phone: "",
      defaultPassword: "",
    })
    setPhoneError("")
  }, [stall, open])

  const validatePhone = (phone: string) => {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, "")
    
    if (cleanPhone.length === 0) {
      setPhoneError("")
      return true
    }
    
    if (cleanPhone.length < 10) {
      setPhoneError("Phone number must be exactly 10 digits")
      return false
    }
    
    if (cleanPhone.length > 10) {
      setPhoneError("Phone number must be exactly 10 digits")
      return false
    }
    
    setPhoneError("")
    return true
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow digits
    const cleanValue = value.replace(/\D/g, "")
    
    // Limit to 10 digits
    if (cleanValue.length <= 10) {
      setFormData({ ...formData, phone: cleanValue })
      validatePhone(cleanValue)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone) {
      toast.error("Please fill in required fields")
      return
    }

    // Validate phone number
    if (!validatePhone(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }

    if (formData.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits")
      return
    }

    if (!stall && !formData.defaultPassword) {
      toast.error("Password is required for new stalls")
      return
    }

    setIsLoading(true)
    try {
      if (stall) {
        await api.put(`/org-admin/stalls/${stall.id}`, {
          ...formData,
          eventId: stall.eventId ?? eventId,
        })
        toast.success("Stall updated successfully")
      } else {
        await api.post(`/org-admin/stalls/${eventId}`, {
          ...formData,
          eventId,
        })
        toast.success("Stall created successfully")
      }
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Operation failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[95vw] sm:max-w-[560px] rounded-[5px] border border-border/80 bg-white p-0 shadow-premium-xl overflow-hidden">
        <div className="relative gradient-premium p-6 sm:p-8 pb-8 sm:pb-10 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
          
          <div className="relative z-10">
            <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {stall ? "Edit Stall" : "Create Stall"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm sm:text-base font-medium text-white/90">
              Configure stall owner details for the selected event.
            </DialogDescription>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>

        <div className="p-5 sm:p-6 md:p-8 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Stall Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter stall name"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit phone number"
                  disabled={!!stall}
                  maxLength={10}
                  className={phoneError ? "ring-2 ring-red-500" : ""}
                />
                {phoneError && <p className="text-xs font-semibold text-red-600">{phoneError}</p>}
                {!stall && !phoneError && (
                  <p className="text-xs font-medium text-muted-foreground">
                    This phone number will be used for login and payments (10 digits only).
                  </p>
                )}
              </div>

              {!stall && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="defaultPassword" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                    Password *
                  </Label>
                  <Input
                    id="defaultPassword"
                    type="password"
                    value={formData.defaultPassword}
                    onChange={(e) => setFormData({ ...formData, defaultPassword: e.target.value })}
                    placeholder="Enter password for stall owner"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
                {stall ? "Update Stall" : "Create Stall"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
