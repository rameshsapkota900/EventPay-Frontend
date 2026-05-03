import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, type Event, type Volunteer } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { VolunteerDialog } from "@/components/org-admin/volunteer-dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export default function VolunteersPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; volunteer: Volunteer | null }>({
    open: false,
    volunteer: null,
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

  const fetchVolunteers = async () => {
    if (!selectedEvent) return
    try {
      const data = await api.get<Volunteer[]>(`/org-admin/volunteers/event/${selectedEvent}`)
      setVolunteers(data)
    } catch (error) {
      toast.error("Failed to load volunteers")
    }
  }

  useEffect(() => {
    fetchVolunteers()
  }, [selectedEvent])

  const handleDelete = async () => {
    if (!deleteDialog.volunteer) return
    try {
      await api.delete(`/org-admin/volunteers/${deleteDialog.volunteer.id}`)
      toast.success("Volunteer removed")
      setDeleteDialog({ open: false, volunteer: null })
      fetchVolunteers()
    } catch (error) {
      toast.error("Failed to remove volunteer")
    }
  }

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    { header: "Phone", accessorKey: "phone" as const },
    { header: "Students Registered", accessorKey: "studentsRegistered" as const },
    {
      header: "Joined",
      accessorKey: "createdAt" as const,
      cell: (row: Volunteer) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (row: Volunteer) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog({ open: true, volunteer: row })}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      ),
    },
  ]

  const selectedEventName = events.find((event) => String(event.id) === selectedEvent)?.name || "-"
  const totalStudentsRegistered = volunteers.reduce((sum, volunteer) => sum + volunteer.studentsRegistered, 0)

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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Volunteers</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage volunteer teams for active events</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={!selectedEvent} size="sm" className="h-10 w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Volunteer
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-slate-500">Select Event</Label>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Volunteers</p>
              <p className="text-xl font-semibold text-slate-900">{volunteers.length}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Students Registered</p>
              <p className="text-xl font-semibold text-indigo-700">{totalStudentsRegistered}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Avg per Volunteer</p>
              <p className="text-xl font-semibold text-emerald-700">
                {volunteers.length ? Math.round(totalStudentsRegistered / volunteers.length) : 0}
              </p>
            </div>
          </div>

          <div className="rounded-[10px] border border-slate-200 bg-white p-3 sm:p-4 overflow-x-auto">
            <DataTable columns={columns} data={volunteers} searchPlaceholder="Search volunteers..." searchKey="name" />
          </div>
        </>
      ) : (
        <div className="rounded-[10px] border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-muted-foreground sm:text-base">
          Please select an event to view volunteers
        </div>
      )}

      <VolunteerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={Number.parseInt(selectedEvent)}
        onSuccess={() => {
          setDialogOpen(false)
          fetchVolunteers()
        }}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Remove Volunteer"
        description={`Are you sure you want to remove "${deleteDialog.volunteer?.name}" from this event?`}
        confirmText="Remove"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
