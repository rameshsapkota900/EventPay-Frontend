"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { api, type Event } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: Event | null
  organizationId: number
  onSuccess: () => void
}

export function EventDialog({ open, onOpenChange, event, organizationId, onSuccess }: EventDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    dateTime: "",
    location: "",
    defaultWalletAmount: "",
    defaultPassword: "",
  })

  const toDateTimeLocalValue = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
  }

  const minDateTime = toDateTimeLocalValue(new Date())

  useEffect(() => {
    if (!open) return

    if (event) {
      setFormData({
        name: event.name,
        dateTime: event.dateTime.slice(0, 16),
        location: event.location || "",
        defaultWalletAmount: event.defaultWalletAmount.toString(),
        defaultPassword: "",
      })
      return
    }

    setFormData({
      name: "",
      dateTime: "",
      location: "",
      defaultWalletAmount: "100",
      defaultPassword: "",
    })
  }, [event, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.dateTime) {
      toast.error("Please fill in required fields")
      return
    }

    if (!event && !formData.defaultPassword) {
      toast.error("Default password is required for new events")
      return
    }

    const selectedDateTime = new Date(formData.dateTime)
    const minAllowed = new Date()
    minAllowed.setSeconds(0, 0)
    if (selectedDateTime < minAllowed) {
      toast.error("Event date/time cannot be in the past")
      return
    }

    setIsLoading(true)
    try {
      const payload = {
        name: formData.name,
        dateTime: formData.dateTime,
        location: formData.location,
        defaultWalletAmount: Number.parseFloat(formData.defaultWalletAmount) || 0,
        defaultPassword: formData.defaultPassword || undefined,
      }

      if (event) {
        await api.put(`/org-admin/events/${event.id}`, payload)
        toast.success("Event updated successfully")
      } else {
        await api.post(`/org-admin/events/${organizationId}`, payload)
        toast.success("Event created successfully")
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
              {event ? "Edit Event" : "Create Event"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm sm:text-base font-medium text-white/90">
              Configure event details and default student account settings.
            </DialogDescription>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>

        <div className="p-5 sm:p-6 md:p-8 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Event Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter event name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTime" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Date & Time *
                </Label>
                <div className="relative">
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={formData.dateTime}
                    min={minDateTime}
                    onClick={(e) => {
                      try {
                        if ("showPicker" in e.target) {
                          (e.target as HTMLInputElement).showPicker();
                        }
                      } catch (err) {
                        // Ignore for browsers that don't support showPicker
                      }
                    }}
                    onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                    className="w-full cursor-pointer text-left justify-start"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultWalletAmount" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Default Wallet Amount
                </Label>
                <Input
                  id="defaultWalletAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.defaultWalletAmount}
                  onChange={(e) => setFormData({ ...formData, defaultWalletAmount: e.target.value })}
                  placeholder="Enter default amount"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="defaultPassword" className="text-xs sm:text-sm font-bold uppercase tracking-wide">
                  Default Student Password {event ? "(leave blank to keep)" : "*"}
                </Label>
                <Input
                  id="defaultPassword"
                  type="password"
                  value={formData.defaultPassword}
                  onChange={(e) => setFormData({ ...formData, defaultPassword: e.target.value })}
                  placeholder="Enter default password for students"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />}
                {event ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
