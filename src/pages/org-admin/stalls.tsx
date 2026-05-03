import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, type Event, type Stall } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { StallDialog } from "@/components/org-admin/stall-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Pencil, Trash2, Power, PowerOff, QrCode } from "lucide-react"
import { toast } from "sonner"
import { QrCodeDisplay } from "@/components/ui/qr-code-display"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/currency"

export default function StallsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [stalls, setStalls] = useState<Stall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStall, setEditingStall] = useState<Stall | null>(null)
  const [qrDialog, setQrDialog] = useState<{ open: boolean; stall: Stall | null }>({
    open: false,
    stall: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; stall: Stall | null }>({
    open: false,
    stall: null,
  })

  useEffect(() => {
    if (!user?.organizationId) return
    const fetchEvents = async () => {
      try {
        const data = await api.get<Event[]>(`/org-admin/events/organization/${user.organizationId}`)
        setEvents(data.filter((e) => e.status === "ACTIVE"))
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load events")
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [user?.organizationId])

  const fetchStalls = async () => {
    if (!selectedEvent) return
    try {
      const data = await api.get<Stall[]>(`/org-admin/stalls/event/${selectedEvent}`)
      setStalls(data)
    } catch (error) {
      toast.error("Failed to load stalls")
    }
  }

  useEffect(() => {
    fetchStalls()
  }, [selectedEvent])

  const handleToggleStatus = async (stall: Stall) => {
    try {
      if (stall.status === "ACTIVE") {
        await api.post(`/org-admin/stalls/${stall.id}/deactivate`)
        toast.success("Stall deactivated")
      } else {
        await api.post(`/org-admin/stalls/${stall.id}/activate`)
        toast.success("Stall activated")
      }
      fetchStalls()
    } catch (error) {
      toast.error("Failed to update stall status")
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.stall) return
    try {
      await api.delete(`/org-admin/stalls/${deleteDialog.stall.id}`)
      toast.success("Stall deleted")
      setDeleteDialog({ open: false, stall: null })
      fetchStalls()
    } catch (error) {
      toast.error("Failed to delete stall")
    }
  }

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    { header: "Phone", accessorKey: "phone" as const },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: Stall) => <Badge variant={row.status === "ACTIVE" ? "default" : "secondary"}>{row.status}</Badge>,
    },
    {
      header: "Revenue",
      accessorKey: "totalRevenue" as const,
      cell: (row: Stall) => formatCurrency(row.totalRevenue),
    },
    { header: "Transactions", accessorKey: "transactionCount" as const },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (row: Stall) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQrDialog({ open: true, stall: row })}>
            <QrCode className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setEditingStall(row)
              setDialogOpen(true)
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(row)}>
            {row.status === "ACTIVE" ? (
              <PowerOff className="h-3 w-3 text-orange-500" />
            ) : (
              <Power className="h-3 w-3 text-green-500" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog({ open: true, stall: row })}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  const selectedEventName = events.find((event) => String(event.id) === selectedEvent)?.name || "-"
  const activeStalls = stalls.filter((stall) => stall.status === "ACTIVE").length
  const inactiveStalls = stalls.filter((stall) => stall.status === "INACTIVE").length
  const totalRevenue = stalls.reduce((sum, stall) => sum + stall.totalRevenue, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[10px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Stalls</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage stall accounts and payment points</p>
          </div>
          <Button
            onClick={() => {
              setEditingStall(null)
              setDialogOpen(true)
            }}
            disabled={!selectedEvent}
            size="sm"
            className="h-10 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Stall
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-slate-500">Active Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-10 bg-white">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id.toString()}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Selected Event</p>
            <p className="text-base font-semibold text-slate-900">{selectedEventName}</p>
          </div>
        </div>
      </div>

      {selectedEvent ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Total Stalls</p>
              <p className="text-xl font-semibold text-slate-900">{stalls.length}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Active</p>
              <p className="text-xl font-semibold text-emerald-700">{activeStalls}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Inactive</p>
              <p className="text-xl font-semibold text-orange-700">{inactiveStalls}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Total Revenue</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>

          <div className="rounded-[10px] border border-slate-200 bg-white p-3 sm:p-4 overflow-x-auto">
            <DataTable columns={columns} data={stalls} searchPlaceholder="Search stalls..." searchKey="name" />
          </div>
        </>
      ) : (
        <div className="rounded-[10px] border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-muted-foreground sm:text-base">
          Please select an event to view stalls
        </div>
      )}

      <StallDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        stall={editingStall}
        eventId={Number.parseInt(selectedEvent)}
        onSuccess={() => {
          setDialogOpen(false)
          setEditingStall(null)
          fetchStalls()
        }}
      />

      <Dialog open={qrDialog.open} onOpenChange={(open) => setQrDialog({ ...qrDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stall QR Code - {qrDialog.stall?.name}</DialogTitle>
          </DialogHeader>
          {qrDialog.stall && <QrCodeDisplay value={qrDialog.stall.qrCode} title={`Phone: ${qrDialog.stall.phone}`} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Stall"
        description={`Are you sure you want to delete "${deleteDialog.stall?.name}"? This will remove all transaction records for this stall.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
