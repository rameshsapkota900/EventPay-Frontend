import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, type Event } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Download, CalendarDays, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [isDownloadingFormat, setIsDownloadingFormat] = useState<"csv" | "pdf" | null>(null)

  useEffect(() => {
    if (!user?.organizationId) return
    const fetchEvents = async () => {
      try {
        const data = await api.get<Event[]>(`/org-admin/events/organization/${user.organizationId}`)
        setEvents(data)
      } catch {
        toast.error("Failed to load events")
      }
    }
    fetchEvents()
  }, [user?.organizationId])

  const selectedEventName = useMemo(
    () => events.find((event) => String(event.id) === selectedEvent)?.name || "-",
    [events, selectedEvent],
  )

  const downloadReport = async (format: "csv" | "pdf") => {
    if (!selectedEvent) {
      toast.error("Please select an event")
      return
    }
    setIsDownloadingFormat(format)
    try {
      await api.downloadFile(
        `/org-admin/reports/students/event/${selectedEvent}/${format}`,
        `students_event_${selectedEvent}.${format}`,
      )
      toast.success("Report downloaded successfully")
    } catch {
      toast.error("Failed to download report")
    } finally {
      setIsDownloadingFormat(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[10px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Export event-wise student data for your organization.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
              <CalendarDays className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Available Events</p>
            <p className="text-xl font-semibold text-slate-900">{events.length}</p>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white">
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Formats</p>
            <p className="text-xl font-semibold text-slate-900">CSV / PDF</p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Student Report by Event
          </CardTitle>
          <CardDescription>Select an event and export student report instantly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose event" />
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
          <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Selected Event:</span> {selectedEventName}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => downloadReport("csv")}
              disabled={!selectedEvent || isDownloadingFormat !== null}
              variant="outline"
              className="flex-1 border-slate-300 bg-slate-100 font-semibold text-slate-900 hover:bg-slate-200 hover:text-slate-900"
            >
              {isDownloadingFormat === "csv" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              CSV
            </Button>
            <Button
              onClick={() => downloadReport("pdf")}
              disabled={!selectedEvent || isDownloadingFormat !== null}
              className="flex-1"
            >
              {isDownloadingFormat === "pdf" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
