import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, type Event, type Student } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"

export default function StudentsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.organizationId) return
    const fetchEvents = async () => {
      try {
        const data = await api.get<Event[]>(`/org-admin/events/organization/${user.organizationId}`)
        setEvents(data)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load events")
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [user?.organizationId])

  useEffect(() => {
    if (!selectedEvent) return
    const fetchStudents = async () => {
      try {
        const data = await api.get<Student[]>(`/org-admin/students/event/${selectedEvent}`)
        setStudents(data)
      } catch (error) {
        toast.error("Failed to load students")
      }
    }
    fetchStudents()
  }, [selectedEvent])

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    { header: "Phone", accessorKey: "phone" as const },
    { header: "School", accessorKey: "school" as const, cell: (row: Student) => row.school || "-" },
    { header: "Address", accessorKey: "address" as const, cell: (row: Student) => row.address || "-" },
    {
      header: "Wallet Balance",
      accessorKey: "walletBalance" as const,
      cell: (row: Student) => formatCurrency(row.walletBalance),
    },
    {
      header: "Wallet Status",
      accessorKey: "walletFrozen" as const,
      cell: (row: Student) => (
        <Badge variant={row.walletFrozen ? "destructive" : "default"}>{row.walletFrozen ? "Frozen" : "Active"}</Badge>
      ),
    },
    {
      header: "Visited Before",
      accessorKey: "visitedBefore" as const,
      cell: (row: Student) => (row.visitedBefore ? "Yes" : "No"),
    },
    {
      header: "Registered By",
      accessorKey: "registeredByName" as const,
      cell: (row: Student) => row.registeredByName || "-",
    },
  ]

  const selectedEventName = events.find((event) => String(event.id) === selectedEvent)?.name || "-"
  const activeWallets = students.filter((student) => !student.walletFrozen).length
  const frozenWallets = students.filter((student) => student.walletFrozen).length
  const walletTotal = students.reduce((sum, student) => sum + student.walletBalance, 0)

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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Students</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">View and track registered students</p>

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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Total Students</p>
              <p className="text-xl font-semibold text-slate-900">{students.length}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Active Wallets</p>
              <p className="text-xl font-semibold text-emerald-700">{activeWallets}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Frozen Wallets</p>
              <p className="text-xl font-semibold text-rose-700">{frozenWallets}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Wallet Total</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(walletTotal)}</p>
            </div>
          </div>

          <div className="rounded-[10px] border border-slate-200 bg-white p-3 sm:p-4 overflow-x-auto">
            <DataTable columns={columns} data={students} searchPlaceholder="Search students..." searchKey="name" />
          </div>
        </>
      ) : (
        <div className="rounded-[10px] border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-muted-foreground sm:text-base">
          Please select an event to view students
        </div>
      )}
    </div>
  )
}
