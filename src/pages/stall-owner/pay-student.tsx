import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/currency"
import { AlertCircle, Camera, CheckCircle, Loader2, Phone, Send, Store, User, Wallet, X } from "lucide-react"
import { toast } from "sonner"
import jsQR from "jsqr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccountUpdateListener } from "@/lib/realtime"

interface StallInfo {
  id: number
  name: string
  phone: string
  eventId: number
  status: string
  eventName: string
  totalRevenue: number
}

interface StudentLookupResult {
  found: boolean
  type?: "STUDENT"
  id?: number
  name?: string
  phone?: string
}

interface ScannedStudent {
  id: number
  name: string
  phone: string
}

export default function StallOwnerPayStudentPage() {
  const { user } = useAuth()
  const [stall, setStall] = useState<StallInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "phone">("qr")
  const [studentPhone, setStudentPhone] = useState("")
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false)
  const [phoneLookupResult, setPhoneLookupResult] = useState<StudentLookupResult | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [scannedStudent, setScannedStudent] = useState<ScannedStudent | null>(null)
  const [amount, setAmount] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [lastPayment, setLastPayment] = useState<{
    amount: number
    studentName: string
    studentPhone: string
    remainingRevenue: number
  } | null>(null)

  const fetchStall = useCallback(async () => {
    if (!user?.userId) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get<StallInfo>(`/stall-owner/profile/${user.userId}`)
      setStall(response)
    } catch (error) {
      console.error("Failed to fetch stall information:", error)
      toast.error("Failed to load stall information")
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => {
    void fetchStall()
  }, [fetchStall])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  useAccountUpdateListener(() => {
    void fetchStall()
  })

  const amountValue = useMemo(() => Number.parseFloat(amount || "0") || 0, [amount])
  const remainingRevenue = useMemo(() => (stall?.totalRevenue || 0) - amountValue, [amountValue, stall?.totalRevenue])

  const selectedStudent = useMemo(() => {
    if (paymentMethod === "qr") {
      return scannedStudent
    }

    if (phoneLookupResult?.found && phoneLookupResult.id && phoneLookupResult.name && phoneLookupResult.phone) {
      return {
        id: phoneLookupResult.id,
        name: phoneLookupResult.name,
        phone: phoneLookupResult.phone,
      } satisfies ScannedStudent
    }

    return null
  }, [paymentMethod, phoneLookupResult, scannedStudent])

  const handlePreparePayment = () => {
    if (!stall?.id) {
      toast.error("Stall information is not ready yet")
      return
    }
    if (!amountValue || amountValue <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (amountValue > (stall.totalRevenue || 0)) {
      toast.error("Insufficient stall balance")
      return
    }
    if (!selectedStudent) {
      toast.error("Please look up a valid student first")
      return
    }

    setConfirmDialogOpen(true)
  }

  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported on this device")
      }
      if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
        throw new Error("Camera access requires HTTPS connection. Please use HTTPS or localhost.")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            void videoRef.current.play().then(() => {
              setTimeout(() => {
                startScanning()
              }, 500)
            })
          }
        }
      }

      setScannerOpen(true)
    } catch (error: any) {
      const errorMessage =
        error?.message || "Failed to access camera. Please use phone lookup if scanning is unavailable."
      setCameraError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setScannerOpen(false)
  }

  const startScanning = () => {
    if (scanIntervalRef.current) {
      return
    }
    scanIntervalRef.current = setInterval(() => {
      void scanQRCode()
    }, 200)
  }

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA || !video.videoWidth || !video.videoHeight) {
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code?.data) {
      await handleQRCodeScanned(code.data)
    }
  }

  const handleQRCodeScanned = async (qrData: string) => {
    if (!stall?.id || !stall.eventId) {
      stopCamera()
      toast.error("Stall information is not ready yet")
      return
    }

    stopCamera()

    try {
      const result = await api.post<StudentLookupResult>(`/stall-owner/lookup-qr/${stall.id}`, {
        qrCode: qrData,
        eventId: stall.eventId,
      })

      if (result?.found && result.id && result.name && result.phone) {
        setScannedStudent({
          id: result.id,
          name: result.name,
          phone: result.phone,
        })
        toast.success(`Found: ${result.name}`)
      } else {
        toast.error("QR code not recognized for a student in this event")
      }
    } catch (error: any) {
      toast.error(error.message || "Could not identify QR code")
    }
  }

  const handlePhoneLookup = async () => {
    if (!stall?.id) {
      toast.error("Stall information is not ready yet")
      return
    }
    if (!studentPhone || studentPhone.trim().length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }

    setPhoneLookupLoading(true)
    setPhoneLookupResult(null)
    try {
      const result = await api.post<StudentLookupResult>(`/stall-owner/lookup-student/${stall.id}`, {
        phone: studentPhone.trim(),
      })
      setPhoneLookupResult(result)

      if (!result?.found) {
        toast.error("Student not found in this event")
      } else {
        toast.success(`Found: ${result.name}`)
      }
    } catch (error: any) {
      setPhoneLookupResult({ found: false })
      toast.error(error.message || "Student not found in this event")
    } finally {
      setPhoneLookupLoading(false)
    }
  }

  const clearRecipient = () => {
    setScannedStudent(null)
    setPhoneLookupResult(null)
    setStudentPhone("")
  }

  const handleConfirmPayment = async () => {
    if (!stall?.id || !selectedStudent) {
      return
    }

    setProcessing(true)
    setConfirmDialogOpen(false)

    try {
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`

      await api.post(
        `/stall-owner/pay-to-student/${stall.id}`,
        {
          amount: amountValue,
          paymentMethod: paymentMethod === "qr" ? "QR" : "PHONE",
          recipientType: "STUDENT",
          recipientPhone: paymentMethod === "phone" ? selectedStudent.phone : undefined,
          recipientStudentId: paymentMethod === "qr" ? selectedStudent.id : undefined,
        },
        { "Idempotency-Key": idempotencyKey },
      )

      const updatedRevenue = Math.max(0, (stall.totalRevenue || 0) - amountValue)
      setLastPayment({
        amount: amountValue,
        studentName: selectedStudent.name,
        studentPhone: selectedStudent.phone,
        remainingRevenue: updatedRevenue,
      })
      setStall((currentStall) =>
        currentStall
          ? {
              ...currentStall,
              totalRevenue: updatedRevenue,
            }
          : currentStall,
      )
      setAmount("")
      clearRecipient()
      setSuccessDialogOpen(true)
      toast.success("Payment to student successful")
    } catch (error: any) {
      toast.error(error.message || "Payment failed")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Pay Student</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Scan a student's QR code or look up their phone number, then confirm the payment.
        </p>
      </div>

      <Card className="bg-gradient-to-r from-slate-900 to-slate-700 text-white">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-200">Available Stall Balance</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(stall?.totalRevenue || 0)}</p>
              <p className="mt-2 text-sm text-slate-300">
                {stall?.name} {stall?.eventName ? `• ${stall.eventName}` : ""}
              </p>
            </div>
            <div className="rounded-full bg-white/10 p-3">
              <Wallet className="h-8 w-8 text-white/90" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Student Payment
            </CardTitle>
            <CardDescription>Choose QR scan or phone lookup, then enter the amount.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Tabs
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value as "qr" | "phone")
                clearRecipient()
              }}
            >
              <TabsList className="grid h-12 w-full grid-cols-2">
                <TabsTrigger value="qr" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Scan QR Code</span>
                  <span className="sm:hidden">QR Code</span>
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Phone Number</span>
                  <span className="sm:hidden">Phone</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="mt-4 space-y-4">
                {!scannedStudent ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border-2 border-dashed p-6 text-center sm:p-8">
                      <Camera className="mx-auto mb-4 h-10 w-10 text-muted-foreground sm:h-12 sm:w-12" />
                      <p className="mb-4 text-sm text-muted-foreground sm:text-base">
                        Scan a student's QR code to start the payment.
                      </p>
                      {location.protocol !== "https:" &&
                      location.hostname !== "localhost" &&
                      location.hostname !== "127.0.0.1" ? (
                        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700 sm:text-sm">
                          <AlertCircle className="mr-2 inline h-4 w-4 text-yellow-600" />
                          Camera access requires HTTPS. You can use phone lookup instead.
                        </div>
                      ) : null}
                      <Button onClick={startCamera} size="lg" className="w-full sm:w-auto">
                        <Camera className="mr-2 h-4 w-4" />
                        Open Camera
                      </Button>
                    </div>

                    {cameraError && (
                      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                        <AlertCircle className="mr-2 inline h-4 w-4" />
                        {cameraError}
                      </div>
                    )}
                  </div>
                ) : (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="rounded-full bg-green-100 p-3">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase text-green-600">Student</p>
                            <p className="truncate text-lg font-semibold">{scannedStudent.name}</p>
                            <p className="text-sm text-muted-foreground">{scannedStudent.phone}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearRecipient}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="phone" className="mt-4 space-y-4">
                {!phoneLookupResult?.found ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-phone">Student Phone Number</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="student-phone"
                            type="tel"
                            placeholder="Enter student's registered phone"
                            value={studentPhone}
                            onChange={(event) => setStudentPhone(event.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Button onClick={handlePhoneLookup} disabled={phoneLookupLoading || !studentPhone}>
                          {phoneLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look Up"}
                        </Button>
                      </div>
                    </div>

                    {phoneLookupResult && !phoneLookupResult.found && (
                      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                        <AlertCircle className="mr-2 inline h-4 w-4" />
                        Student not found in this event.
                      </div>
                    )}
                  </div>
                ) : (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="rounded-full bg-green-100 p-3">
                            <User className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium uppercase text-green-600">Student</p>
                            <p className="truncate text-lg font-semibold">{phoneLookupResult.name}</p>
                            <p className="text-sm text-muted-foreground">{phoneLookupResult.phone}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearRecipient}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-muted-foreground">Current Stall Balance</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stall?.totalRevenue || 0)}</p>
            </div>

            <div className="rounded-lg border border-dashed border-slate-200 p-4">
              <p className="text-sm text-muted-foreground">After This Payment</p>
              <p className={`mt-1 text-2xl font-bold ${remainingRevenue >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(remainingRevenue)}
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              <AlertCircle className="mr-2 inline h-4 w-4" />
              The student must belong to the same active event as this stall.
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Amount</CardTitle>
            <CardDescription>Enter how much you want to send to the selected student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground">Rs</span>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-12 pl-9 text-lg font-semibold"
                />
              </div>
              <p className="text-sm text-muted-foreground">Available: {formatCurrency(stall?.totalRevenue || 0)}</p>
            </div>

            <Button className="w-full" size="lg" onClick={handlePreparePayment} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Pay {formatCurrency(amountValue)}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={scannerOpen} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-md rounded-[5px] border border-border/80 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 p-0 shadow-premium-xl">
          <div className="gradient-premium relative overflow-hidden rounded-t-[5px] p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
            <div className="relative z-10">
              <DialogTitle className="flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-wide text-white">
                <Camera className="h-5 w-5" />
                Scan Student QR Code
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm font-medium text-white/80">
                Point your camera at a student's QR code
              </DialogDescription>
            </div>
          </div>
          <div className="p-5">
            <div className="relative aspect-square overflow-hidden rounded-[5px] bg-black shadow-premium">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-48 rounded-lg border-2 border-white">
                  <div className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-primary" />
                  <div className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-primary" />
                  <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-primary" />
                  <div className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-primary" />
                </div>
              </div>
            </div>
            <div className="mt-5">
              <Button variant="outline" onClick={stopCamera} className="h-11 w-full rounded-[5px] font-bold">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-md rounded-[5px] border border-border/80 bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 p-0 shadow-premium-xl">
          <div className="gradient-premium relative overflow-hidden rounded-t-[5px] p-6 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/10" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
            <div className="relative z-10">
              <DialogTitle className="flex items-center justify-center gap-2 text-lg font-bold uppercase tracking-wide text-white">
                <AlertCircle className="h-5 w-5" />
                Confirm Payment
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm font-medium text-white/80">
                Review payment details before sending
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Student</span>
              <div className="text-right">
                <span className="font-bold">{selectedStudent?.name}</span>
                <p className="text-xs text-muted-foreground">{selectedStudent?.phone}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Amount</span>
              <span className="text-xl font-bold">{formatCurrency(amountValue)}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Remaining Balance</span>
              <span className="font-bold text-emerald-600">{formatCurrency(remainingRevenue)}</span>
            </div>
          </div>

          <div className="flex gap-3 p-6 pt-0">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="h-11 flex-1 rounded-[5px] font-bold">
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} className="h-11 flex-1 rounded-[5px] font-bold">
              Confirm Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
              Payment Successful
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-600">{formatCurrency(lastPayment?.amount || 0)}</p>
              <p className="mt-2 text-muted-foreground">
                Sent to <span className="font-medium text-foreground">{lastPayment?.studentName}</span>
              </p>
              <p className="text-sm text-muted-foreground">{lastPayment?.studentPhone}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-muted-foreground">New Stall Balance</span>
                <span className="font-bold">{formatCurrency(lastPayment?.remainingRevenue || 0)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
