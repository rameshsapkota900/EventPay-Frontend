import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, type Event } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EventDialog } from "@/components/org-admin/event-dialog"
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    event: Event | null
    action: "delete" | "cancel" | "complete"
  }>({ open: false, event: null, action: "delete" })

  const fetchEvents = async () => {
    if (!user?.organizationId) return
    try {
      const data = await api.get<Event[]>(`/org-admin/events/organization/${user.organizationId}`)
      setEvents(data)
    } catch (error) {
      toast.error("Failed to load events")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [user?.organizationId])

  const handleAction = async () => {
    if (!confirmDialog.event) return
    try {
      switch (confirmDialog.action) {
        case "delete":
          await api.delete(`/org-admin/events/${confirmDialog.event.id}`)
          toast.success("Event deleted")
          break
        case "cancel":
          await api.post(`/org-admin/events/${confirmDialog.event.id}/cancel`)
          toast.success("Event cancelled")
          break
        case "complete":
          await api.post(`/org-admin/events/${confirmDialog.event.id}/complete`)
          toast.success("Event completed")
          break
      }
      setConfirmDialog({ open: false, event: null, action: "delete" })
      fetchEvents()
    } catch (error) {
      toast.error(`Failed to ${confirmDialog.action} event`)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Active</Badge>
      case "COMPLETED":
        return <Badge className="bg-blue-500">Completed</Badge>
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    {
      header: "Date",
      accessorKey: "dateTime" as const,
      cell: (row: Event) => new Date(row.dateTime).toLocaleString(),
    },
    { header: "Location", accessorKey: "location" as const },
    { header: "Students", accessorKey: "studentCount" as const },
    { header: "Stalls", accessorKey: "stallCount" as const },
    {
      header: "Revenue",
      accessorKey: "totalRevenue" as const,
      cell: (row: Event) => formatCurrency(row.totalRevenue),
    },
    {
      header: "Status",
      accessorKey: "status" as const,
      cell: (row: Event) => getStatusBadge(row.status),
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (row: Event) => (
        <div className="flex items-center gap-1">
          {row.status === "ACTIVE" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditingEvent(row)
                  setDialogOpen(true)
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setConfirmDialog({ open: true, event: row, action: "complete" })}
              >
                <CheckCircle className="h-3 w-3 text-blue-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setConfirmDialog({ open: true, event: row, action: "cancel" })}
              >
                <XCircle className="h-3 w-3 text-orange-500" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setConfirmDialog({ open: true, event: row, action: "delete" })}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const totalEvents = events.length
  const activeEvents = events.filter((event) => event.status === "ACTIVE").length
  const completedEvents = events.filter((event) => event.status === "COMPLETED").length
  const cancelledEvents = events.filter((event) => event.status === "CANCELLED").length

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[10px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Events</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage all events for your organization</p>
          </div>
          <Button
            onClick={() => {
              setEditingEvent(null)
              setDialogOpen(true)
            }}
            size="sm"
            className="h-10 w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total Events</p>
            <p className="text-xl font-semibold text-slate-900">{totalEvents}</p>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Active</p>
            <p className="text-xl font-semibold text-emerald-700">{activeEvents}</p>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Completed</p>
            <p className="text-xl font-semibold text-teal-700">{completedEvents}</p>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Cancelled</p>
            <p className="text-xl font-semibold text-rose-700">{cancelledEvents}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-slate-200 bg-white p-3 sm:p-4 overflow-x-auto">
        <DataTable columns={columns} data={events} searchPlaceholder="Search events..." searchKey="name" />
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        organizationId={user?.organizationId || 0}
        onSuccess={() => {
          setDialogOpen(false)
          setEditingEvent(null)
          fetchEvents()
        }}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={`${confirmDialog.action.charAt(0).toUpperCase() + confirmDialog.action.slice(1)} Event`}
        description={
          confirmDialog.action === "delete"
            ? `Are you sure you want to delete "${confirmDialog.event?.name}"? This will remove all students, stalls, and transactions.`
            : confirmDialog.action === "cancel"
              ? `Are you sure you want to cancel "${confirmDialog.event?.name}"? Students and stalls will no longer be able to interact.`
              : `Are you sure you want to mark "${confirmDialog.event?.name}" as completed? All wallets will be frozen.`
        }
        confirmText={confirmDialog.action.charAt(0).toUpperCase() + confirmDialog.action.slice(1)}
        onConfirm={handleAction}
        variant={confirmDialog.action === "delete" ? "destructive" : "default"}
      />
    </div>
  )
}
