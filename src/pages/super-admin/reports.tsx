import { useEffect, useMemo, useState } from "react"
import { api, type Organization, type Event } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, Download, Building2, CalendarDays, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ReportsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [eventReportOrgId, setEventReportOrgId] = useState<string>("")
  const [orgReportOrgId, setOrgReportOrgId] = useState<string>("")
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [isEventsLoading, setIsEventsLoading] = useState(false)
  const [isDownloadingKey, setIsDownloadingKey] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await api.get<Organization[]>("/super-admin/organizations")
        setOrganizations(data)
      } catch (error) {
        toast.error("Failed to load organizations")
      }
    }
    fetchOrganizations()
  }, [])

  useEffect(() => {
    if (eventReportOrgId) {
      const fetchEvents = async () => {
        setIsEventsLoading(true)
        try {
          const data = await api.get<Event[]>(`/super-admin/events/organization/${eventReportOrgId}`)
          setEvents(data || [])
        } catch {
          console.error("Failed to load events")
          setEvents([])
        } finally {
          setIsEventsLoading(false)
        }
      }
      fetchEvents()
    } else {
      setEvents([])
      setIsEventsLoading(false)
    }
    setSelectedEvent("")
  }, [eventReportOrgId])

  const selectedEventOrgName = useMemo(
    () => organizations.find((org) => String(org.id) === eventReportOrgId)?.name || "-",
    [organizations, eventReportOrgId],
  )

  const selectedOrgReportName = useMemo(
    () => organizations.find((org) => String(org.id) === orgReportOrgId)?.name || "-",
    [organizations, orgReportOrgId],
  )

  const selectedEventName = useMemo(
    () => events.find((event) => String(event.id) === selectedEvent)?.name || "-",
    [events, selectedEvent],
  )

  const downloadReport = async (type: "event" | "organization", format: "csv" | "pdf") => {
    if (type === "event" && !selectedEvent) {
      toast.error("Please select organization and event")
      return
    }
    if (type === "organization" && !orgReportOrgId) {
      toast.error("Please select organization")
      return
    }

    const key = `${type}-${format}`
    setIsDownloadingKey(key)
    try {
      const endpoint =
        type === "event"
          ? `/super-admin/reports/students/event/${selectedEvent}/${format}`
          : `/super-admin/reports/students/organization/${orgReportOrgId}/${format}`

      const filename =
        type === "event"
          ? `students_event_${selectedEvent}.${format}`
          : `students_org_${orgReportOrgId}.${format}`

      await api.downloadFile(endpoint, filename)
      toast.success("Report downloaded successfully")
    } catch {
      toast.error("Failed to download report")
    } finally {
      setIsDownloadingKey(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[10px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">Export student visitor data in CSV or PDF format.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
              <Building2 className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Organizations</p>
            <p className="text-xl font-semibold text-slate-900">{organizations.length}</p>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <CalendarDays className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Events In Selected Org</p>
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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Event Report
            </CardTitle>
            <CardDescription>Export students for a specific event inside an organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Select Organization</Label>
              <Select value={eventReportOrgId} onValueChange={setEventReportOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Event</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent} disabled={!eventReportOrgId || isEventsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={isEventsLoading ? "Loading events..." : "Choose event"} />
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
              <p>
                <span className="font-semibold text-slate-900">Organization:</span> {selectedEventOrgName}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Event:</span> {selectedEventName}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => downloadReport("event", "csv")}
                disabled={!selectedEvent || !!isDownloadingKey}
                variant="outline"
                className="flex-1 border-slate-300 bg-slate-100 font-semibold text-slate-900 hover:bg-slate-200 hover:text-slate-900"
              >
                {isDownloadingKey === "event-csv" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                CSV
              </Button>
              <Button
                onClick={() => downloadReport("event", "pdf")}
                disabled={!selectedEvent || !!isDownloadingKey}
                className="flex-1"
              >
                {isDownloadingKey === "event-pdf" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Organization Report
            </CardTitle>
            <CardDescription>Export all students data for one organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Select Organization</Label>
              <Select value={orgReportOrgId} onValueChange={setOrgReportOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-900">Organization:</span> {selectedOrgReportName}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => downloadReport("organization", "csv")}
                disabled={!orgReportOrgId || !!isDownloadingKey}
                variant="outline"
                className="flex-1 border-slate-300 bg-slate-100 font-semibold text-slate-900 hover:bg-slate-200 hover:text-slate-900"
              >
                {isDownloadingKey === "organization-csv" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                CSV
              </Button>
              <Button
                onClick={() => downloadReport("organization", "pdf")}
                disabled={!orgReportOrgId || !!isDownloadingKey}
                className="flex-1"
              >
                {isDownloadingKey === "organization-pdf" ? (
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
    </div>
  )
}
