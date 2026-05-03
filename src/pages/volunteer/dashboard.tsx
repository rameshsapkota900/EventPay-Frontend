import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type DashboardMetrics } from "@/lib/api"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Users, UserPlus, Calendar, FileText } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface VolunteerAssignment {
  id: number
  userId: number
  name: string
  email: string
  phone: string
  eventId: number
  eventName: string
  studentsRegistered: number
  createdAt: string
}

export default function VolunteerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null)
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.userId) {
        console.error("Missing user ID")
        setLoading(false)
        return
      }

      try {
        // Get volunteer's event assignments
        const data = await api.get<VolunteerAssignment[]>(`/volunteer/events/${user.userId}`)
        setAssignments(data)
        
        // If only one assignment, select it automatically
        if (data.length === 1) {
          setSelectedEventId(data[0].eventId)
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAssignments()
  }, [user])

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user?.userId || !selectedEventId) {
        return
      }

      try {
        const data = await api.get<DashboardMetrics>(`/volunteer/dashboard/${user.userId}/${selectedEventId}`)
        setDashboard(data)
      } catch (error) {
        console.error("Failed to fetch dashboard:", error)
      }
    }
    fetchDashboard()
  }, [user, selectedEventId])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Event Assigned</h2>
          <p className="text-muted-foreground">
            You haven't been assigned to any event yet. Please contact your organization admin.
          </p>
        </div>
      </div>
    )
  }

  const selectedAssignment = assignments.find(a => a.eventId === selectedEventId)

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Volunteer Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {user?.organizationName}
        </p>
      </div>

      {assignments.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Select Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEventId?.toString()} onValueChange={(value) => setSelectedEventId(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event to manage" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.eventId} value={assignment.eventId.toString()}>
                    {assignment.eventName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedEventId && (
        <>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Students Registered by Me</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{selectedAssignment?.studentsRegistered || 0}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students in Event</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{dashboard?.totalStudentsInEvent || 0}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Contribution</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {dashboard?.totalStudentsInEvent ? 
                    Math.round((selectedAssignment?.studentsRegistered || 0) / dashboard.totalStudentsInEvent * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <Button 
                  onClick={() => navigate('/volunteer/register')} 
                  className="w-full" 
                  size="lg"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register New Student
                </Button>
                <Button 
                  onClick={() => navigate('/volunteer/transactions')} 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View My Students
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div>
                  <h3 className="font-medium text-sm sm:text-base">{selectedAssignment?.eventName}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Current Event</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Students</p>
                    <p className="font-medium">{dashboard?.totalStudentsInEvent || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">My Registrations</p>
                    <p className="font-medium">{selectedAssignment?.studentsRegistered || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
