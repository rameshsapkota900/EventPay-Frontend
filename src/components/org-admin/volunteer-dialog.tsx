"use client"

import type React from "react"

import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface VolunteerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: number
  onSuccess: () => void
}

export function VolunteerDialog({ open, onOpenChange, eventId, onSuccess }: VolunteerDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  })
  const [phoneError, setPhoneError] = useState("")

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

    if (!formData.name || !formData.phone || !formData.password) {
      toast.error("Please fill in required fields")
      return
    }

    // Validate phone number if provided
    if (formData.phone && !validatePhone(formData.phone)) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }

    if (formData.phone && formData.phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits")
      return
    }

    setIsLoading(true)
    try {
      await api.post(`/org-admin/volunteers/${eventId}`, {
        ...formData,
        eventId,
      })
      toast.success("Volunteer added successfully")
      setFormData({ name: "", phone: "", password: "" })
      setPhoneError("")
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add volunteer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[560px] rounded-[5px] border border-border/80 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 p-0 shadow-premium-xl sm:max-w-[600px] md:max-w-[640px]">
        <div className="gradient-premium relative overflow-hidden rounded-t-[5px] p-6 text-center sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
          <div className="relative z-10">
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
              Add Volunteer
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm font-medium text-white/80 sm:text-base">
              Create volunteer credentials and assign them to the selected event
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-foreground sm:text-sm">
                  Volunteer Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter volunteer name"
                  className="h-11 rounded-[5px] sm:h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide text-foreground sm:text-sm">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="10-digit phone"
                  maxLength={10}
                  className={`h-11 rounded-[5px] sm:h-12 ${phoneError ? "ring-2 ring-red-500" : ""}`}
                />
                {phoneError && <p className="text-xs font-medium text-red-500">{phoneError}</p>}
                {!phoneError && formData.phone && (
                  <p className="text-xs font-medium text-muted-foreground">Used for volunteer login (10 digits)</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-foreground sm:text-sm">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  className="h-11 rounded-[5px] sm:h-12"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                className="h-11 rounded-[5px] font-bold sm:h-12 sm:px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="h-11 rounded-[5px] font-bold sm:h-12 sm:px-6"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Volunteer
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
