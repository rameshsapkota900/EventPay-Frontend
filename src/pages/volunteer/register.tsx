import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { QrCodeDisplay } from "@/components/ui/qr-code-display"
import { Loader2, UserPlus, GraduationCap } from "lucide-react"

interface Event {
  id: number
  name: string
  dateTime: string
  location: string
  status: string
}

interface VolunteerAssignment {
  id: number
  eventId: number
  eventName: string
  userId: number
}

interface StudentResponse {
  id: number
  name: string
  phone: string
  qrCode: string
  walletBalance: number
}

export default function VolunteerRegisterPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [registeredStudent, setRegisteredStudent] = useState<StudentResponse | null>(null)
  const [phoneError, setPhoneError] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    school: "",
    visitedBefore: false,
  })

  // Fetch events assigned to this volunteer
  useEffect(() => {
    const fetchAssignedEvents = async () => {
      if (!user?.userId) return
      try {
        const assignments = await api.get<VolunteerAssignment[]>(`/volunteer/events/${user.userId}`)
        // Convert assignments to events for selection
        const eventList: Event[] = assignments.map(a => ({
          id: a.eventId,
          name: a.eventName,
          dateTime: "",
          location: "",
          status: "ACTIVE"
        }))
        setEvents(eventList)
        if (eventList.length === 1) {
          setSelectedEventId(eventList[0].id.toString())
        }
      } catch (error) {
        toast.error("Failed to load assigned events")
      }
    }
    fetchAssignedEvents()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === "phone") {
      const cleanPhone = value.replace(/\D/g, "").slice(0, 10)
      setFormData(prev => ({ ...prev, phone: cleanPhone }))
      if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
        setPhoneError("Phone number must be exactly 10 digits")
      } else {
        setPhoneError("")
      }
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEventId) {
      toast.error("Please select an event")
      return
    }

    if (!user?.userId) {
      toast.error("User not authenticated")
      return
    }

    if (formData.phone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits")
      toast.error("Please enter a valid 10-digit phone number")
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post<StudentResponse>(
        `/volunteer/students/${selectedEventId}`,
        {
          ...formData,
          eventId: parseInt(selectedEventId),
        }
      )
      
      setRegisteredStudent(response)
      toast.success("Student registered successfully!")
      
      // Reset form
      setFormData({
        name: "",
        phone: "",
        address: "",
        school: "",
        visitedBefore: false,
      })
      setPhoneError("")
    } catch (error: any) {
      toast.error(error?.message || "Failed to register student")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterAnother = () => {
    setRegisteredStudent(null)
  }

  // Show success card after registration
  if (registeredStudent) {
    return (
      <div className="container mx-auto py-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Student Registered Successfully!</CardTitle>
            <CardDescription>The student has been registered and their wallet is ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{registeredStudent.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{registeredStudent.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet Balance:</span>
                <span className="font-medium text-green-600">Rs. {registeredStudent.walletBalance?.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {registeredStudent.qrCode && (
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-muted-foreground">Student QR Code</p>
                <QrCodeDisplay 
                  value={registeredStudent.qrCode} 
                  size={192}
                />
              </div>
            )}

            <Button onClick={handleRegisterAnother} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Register Another Student
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            Register New Student
          </CardTitle>
          <CardDescription>
            Register a student for an event. They will receive a wallet with the default balance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Event Selection */}
            <div className="space-y-2">
              <Label htmlFor="event">Event *</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
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
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No events assigned. Please contact your administrator.
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter student's full name"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter 10-digit phone number"
                maxLength={10}
                className={phoneError ? "border-red-500" : ""}
                required
              />
              {phoneError && (
                <p className="text-xs text-red-500">{phoneError}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter address (optional)"
                rows={2}
              />
            </div>

            {/* School */}
            <div className="space-y-2">
              <Label htmlFor="school">School/Institution</Label>
              <Input
                id="school"
                name="school"
                value={formData.school}
                onChange={handleInputChange}
                placeholder="Enter school name (optional)"
              />
            </div>

            {/* Visited Before */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="visitedBefore"
                checked={formData.visitedBefore}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, visitedBefore: checked === true }))
                }
              />
              <Label htmlFor="visitedBefore" className="font-normal">
                Has visited before
              </Label>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading || events.length === 0}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Register Student
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
