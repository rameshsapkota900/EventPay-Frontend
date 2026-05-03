"use client"

import type React from "react"

import { useState } from "react"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Copy } from "lucide-react"

interface OrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface InviteResponse {
  email: string
  inviteLink: string
  expiresAt: string
}

export function OrganizationDialog({ open, onOpenChange }: OrganizationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")
  const [invite, setInvite] = useState<InviteResponse | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminEmail.trim()) {
      toast.error("Admin email is required")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post<InviteResponse>("/super-admin/organizations/invite", {
        email: adminEmail.trim(),
      })
      setInvite(response)
      toast.success("Organization invite link generated")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate invite")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!invite?.inviteLink) return
    try {
      await navigator.clipboard.writeText(invite.inviteLink)
      toast.success("Invite link copied")
    } catch {
      toast.error("Unable to copy invite link")
    }
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAdminEmail("")
      setInvite(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[500px] rounded-[5px] border border-border/80 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 p-0 shadow-premium-xl sm:max-w-[560px] md:max-w-[600px]">
        <div className="gradient-premium relative overflow-hidden rounded-t-[5px] p-6 text-center sm:p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
          <div className="relative z-10">
            <DialogTitle className="text-xl font-bold uppercase tracking-wide text-white sm:text-2xl">
              Invite Organization Admin
            </DialogTitle>
            <DialogDescription className="mt-2 text-sm font-medium text-white/80 sm:text-base">
              Enter admin email to generate secure setup link
            </DialogDescription>
          </div>
        </div>

        <div className="p-5 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-xs font-bold uppercase tracking-wide text-foreground sm:text-sm">
                Admin Email *
              </Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@organization.com"
                className="h-11 rounded-[5px] sm:h-12"
              />
            </div>
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleClose(false)} 
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
                Send Invite
              </Button>
            </div>
          </form>

          {invite && (
            <div className="mt-6 space-y-3 rounded-[5px] border-0 bg-gray-50/80 p-4 shadow-premium sm:p-5">
              <p className="break-words text-sm font-bold text-foreground sm:text-base">
                Invite generated for {invite.email}
              </p>
              <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                Expires: {new Date(invite.expiresAt).toLocaleString()}
              </p>
              <Input 
                value={invite.inviteLink} 
                readOnly 
                className="h-10 rounded-[5px] text-xs sm:h-11 sm:text-sm" 
              />
              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                className="h-10 w-full rounded-[5px] font-bold sm:h-11" 
                onClick={handleCopyLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Invite Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
