import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { Users, Calendar } from "lucide-react"
import { formatCurrency } from "@/lib/currency"

interface StudentRegistration {
  id: number
  userId: number
  name: string
  phone: string
  address: string | null
  school: string | null
  visitedBefore: boolean
  eventId: number
  eventName: string
  eventStatus: string
  walletId: number
  walletBalance: number
  walletFrozen: boolean
  registeredByName: string | null
  createdAt: string
}

export default function VolunteerTransactionsPage() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState<StudentRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user?.userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await api.get<StudentRegistration[]>(`/volunteer/students/registered/${user.userId}`)
        setRegistrations(data)
      } catch (error) {
        console.error("Failed to fetch registrations:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchRegistrations()
  }, [user])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Student Registrations</h1>
        <p className="text-muted-foreground">View all students you have registered</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {registrations.filter(r => r.eventStatus === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Wallet Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(registrations.reduce((sum, r) => sum + r.walletBalance, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-12 w-12 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No student registrations found</p>
                        <p className="text-sm text-muted-foreground">Students you register will appear here</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">{registration.name}</TableCell>
                      <TableCell>{registration.phone}</TableCell>
                      <TableCell>{registration.school || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{registration.eventName}</span>
                          <Badge 
                            variant={registration.eventStatus === 'ACTIVE' ? 'default' : 'secondary'}
                            className="w-fit text-xs"
                          >
                            {registration.eventStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                      <Badge 
                        variant={registration.walletFrozen ? 'destructive' : 'default'}
                        className="bg-green-100 text-green-800"
                      >
                        {formatCurrency(registration.walletBalance)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(registration.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
