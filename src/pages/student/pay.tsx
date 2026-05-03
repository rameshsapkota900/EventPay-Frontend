import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Store, Wallet, Send, Phone, AlertCircle, CheckCircle, Camera, X, User, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import jsQR from "jsqr"
import { APP_CONFIG } from "@/constants"
import { formatCurrency } from "@/lib/currency"
import { useAccountUpdateListener } from "@/lib/realtime"

interface StudentProfile {
  id: number
  walletBalance: number
  qrCode: string
  name: string
}

interface ScannedRecipient {
  type: "STALL" | "STUDENT"
  id: number
  name: string
  phone?: string
}

interface PhoneLookupResult {
  found: boolean
  type?: "STALL" | "STUDENT"
  id?: number
  name?: string
  stallName?: string
}

export default function StudentPayPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "phone">("qr")
  
  const [scannerOpen, setScannerOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  const [scannedRecipient, setScannedRecipient] = useState<ScannedRecipient | null>(null)
  
  const [recipientPhone, setRecipientPhone] = useState("")
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false)
  const [phoneLookupResult, setPhoneLookupResult] = useState<PhoneLookupResult | null>(null)
  
  const [amount, setAmount] = useState("")
  
  const [lastTransaction, setLastTransaction] = useState<{
    amount: string
    recipient: string
    newBalance: number
  } | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user?.userId || !user?.eventId || !user?.studentId) {
      setLoading(false)
      return
    }

    try {
      const profileRes = await api.get<StudentProfile>(`/student/profile/${user.userId}/${user.eventId}`)
      setProfile(profileRes)
    } catch (error) {
      console.error("Failed to fetch data:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [user?.eventId, user?.studentId, user?.userId])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  useAccountUpdateListener(() => {
    void fetchProfile()
  })

  const startCamera = async () => {
    setCameraError(null)
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported on this device")
      }

      // Check if we're on HTTPS or localhost (required for camera access)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error("Camera access requires HTTPS connection. Please use HTTPS or localhost.")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready before starting scanning
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              // Wait a bit more for video to stabilize
              setTimeout(() => {
                startScanning()
              }, 500)
            }).catch((playError) => {
              console.error("Video play error:", playError)
              setCameraError("Failed to start video playback")
            })
          }
        }
      }
      
      setScannerOpen(true)
    } catch (error: any) {
      console.error("Camera error:", error)
      let errorMessage = "Failed to access camera"
      
      if (error.name === 'NotAllowedError') {
        errorMessage = "Camera permission denied. Please allow camera access and try again."
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No camera found on this device."
      } else if (error.name === 'NotSupportedError') {
        errorMessage = "Camera is not supported on this device."
      } else if (error.name === 'NotReadableError') {
        errorMessage = "Camera is already in use by another application."
      } else if (error.message) {
        errorMessage = error.message
      }
      
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
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setScannerOpen(false)
  }

  const startScanning = () => {
    if (scanIntervalRef.current) return
    scanIntervalRef.current = setInterval(() => {
      scanQRCode()
    }, 200)
  }

  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return
    
    // Check if video dimensions are available
    if (!video.videoWidth || !video.videoHeight) return
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code && code.data) {
        handleQRCodeScanned(code.data)
      }
    } catch (error) {
      console.error("QR scanning error:", error)
      // Continue scanning even if one frame fails
    }
  }

  const handleQRCodeScanned = async (qrData: string) => {
    stopCamera()
    
    try {
      const lookupResult = await api.post<{found: boolean, type: string, id: number, name: string, phone?: string}>(`/student/lookup-qr`, { 
        qrCode: qrData,
        eventId: user?.eventId 
      })
      
      if (lookupResult && lookupResult.found) {
        setScannedRecipient({
          type: lookupResult.type as "STALL" | "STUDENT",
          id: lookupResult.id,
          name: lookupResult.name,
          phone: lookupResult.phone
        })
        toast.success(`Found: ${lookupResult.name}`)
      } else {
        toast.error("QR code not recognized")
      }
    } catch (error: any) {
      console.error("QR lookup error:", error)
      toast.error(error.message || "Could not identify QR code. Please try again.")
    }
  }

  const handlePhoneLookup = async () => {
    if (!recipientPhone || recipientPhone.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }
    
    if (recipientPhone === user?.phone) {
      toast.error("You cannot pay yourself")
      return
    }
    
    setPhoneLookupLoading(true)
    setPhoneLookupResult(null)
    
    try {
      const result = await api.get<PhoneLookupResult>(`/student/lookup-phone/${user?.eventId}/${recipientPhone}`)
      setPhoneLookupResult(result)
      
      if (!result.found) {
        toast.error("Phone number not found in this event")
      } else {
        toast.success(`Found: ${result.stallName || result.name}`)
      }
    } catch (error: any) {
      console.error("Phone lookup error:", error)
      setPhoneLookupResult({ found: false })
      toast.error("Phone number not registered in this event")
    } finally {
      setPhoneLookupLoading(false)
    }
  }

  const handlePreparePayment = () => {
    const amountValue = parseFloat(amount)
    
    if (!amount || amountValue <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (!profile || amountValue > profile.walletBalance) {
      toast.error("Insufficient balance")
      return
    }

    if (paymentMethod === "qr" && !scannedRecipient) {
      toast.error("Please scan a QR code first")
      return
    }

    if (paymentMethod === "phone" && (!phoneLookupResult || !phoneLookupResult.found)) {
      toast.error("Please look up a valid phone number first")
      return
    }

    setConfirmDialogOpen(true)
  }

  const getRecipientInfo = () => {
    if (paymentMethod === "qr" && scannedRecipient) {
      return {
        name: scannedRecipient.name,
        type: scannedRecipient.type
      }
    }
    if (paymentMethod === "phone" && phoneLookupResult?.found) {
      return {
        name: phoneLookupResult.stallName || phoneLookupResult.name || recipientPhone,
        type: phoneLookupResult.type
      }
    }
    return null
  }

  const handleConfirmPayment = async () => {
    if (!user?.studentId) return
    
    setProcessing(true)
    setConfirmDialogOpen(false)

    try {
      const amountValue = parseFloat(amount)
      const recipientInfo = getRecipientInfo()
      const idempotencyKey = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`
      
      if (paymentMethod === "qr" && scannedRecipient) {
        if (scannedRecipient.type === "STALL") {
          await api.post(
            `/student/pay/stall/${user.studentId}`,
            {
              amount: amountValue,
              paymentMethod: "QR",
              recipientType: "STALL",
              recipientStallId: scannedRecipient.id
            },
            { "Idempotency-Key": idempotencyKey }
          )
        } else {
          await api.post(
            `/student/transfer/${user.studentId}`,
            {
              amount: amountValue,
              paymentMethod: "QR",
              recipientType: "STUDENT",
              recipientStudentId: scannedRecipient.id
            },
            { "Idempotency-Key": idempotencyKey }
          )
        }
      } else if (paymentMethod === "phone" && phoneLookupResult?.found) {
        if (phoneLookupResult.type === "STALL") {
          await api.post(
            `/student/pay/stall/${user.studentId}`,
            {
              amount: amountValue,
              paymentMethod: "PHONE",
              recipientType: "STALL",
              recipientStallId: phoneLookupResult.id
            },
            { "Idempotency-Key": idempotencyKey }
          )
        } else {
          await api.post(
            `/student/transfer/${user.studentId}`,
            {
              amount: amountValue,
              paymentMethod: "PHONE",
              recipientType: "STUDENT",
              recipientPhone: recipientPhone
            },
            { "Idempotency-Key": idempotencyKey }
          )
        }
      }

      setLastTransaction({
        amount: amount,
        recipient: recipientInfo?.name || "Recipient",
        newBalance: (profile?.walletBalance || 0) - amountValue
      })

      if (profile) {
        setProfile({ ...profile, walletBalance: profile.walletBalance - amountValue })
      }

      setSuccessDialogOpen(true)
      
      setAmount("")
      setScannedRecipient(null)
      setRecipientPhone("")
      setPhoneLookupResult(null)
      
    } catch (error: any) {
      toast.error(error.message || "Payment failed")
    } finally {
      setProcessing(false)
    }
  }

  const handleClearRecipient = () => {
    setScannedRecipient(null)
    setPhoneLookupResult(null)
    setRecipientPhone("")
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const recipientInfo = getRecipientInfo()

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Make Payment</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Scan QR or enter phone number to pay</p>
      </div>

      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-green-100 text-sm">Available Balance</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {formatCurrency(profile?.walletBalance || 0)}
              </p>
            </div>
            <Wallet className="h-10 w-10 sm:h-12 sm:w-12 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Payment Method</CardTitle>
          <CardDescription className="text-sm">Choose how to identify the recipient</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={paymentMethod} onValueChange={(v) => {
            setPaymentMethod(v as "qr" | "phone")
            handleClearRecipient()
          }}>
            <TabsList className="grid w-full grid-cols-2 h-12">
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

            <TabsContent value="qr" className="space-y-4 mt-4">
              {!scannedRecipient ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 sm:p-8 text-center">
                    <Camera className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      Scan a stall or student QR code to make a payment
                    </p>
                    {location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' ? (
                      <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                        <AlertCircle className="h-4 w-4 inline mr-2 text-yellow-600" />
                        <span className="text-xs sm:text-sm text-yellow-700">
                          Camera access requires HTTPS. For mobile use, please access via HTTPS or use phone number lookup instead.
                        </span>
                      </div>
                    ) : null}
                    <Button onClick={startCamera} size="lg" className="w-full sm:w-auto touch-manipulation">
                      <Camera className="h-4 w-4 mr-2" />
                      Open Camera
                    </Button>
                  </div>
                  
                  {cameraError && (
                    <div className="p-3 sm:p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      {cameraError}
                      <div className="mt-2 text-xs">
                        <strong>Tip:</strong> Try using the "Phone Number" tab instead, or ensure you're using HTTPS on mobile devices.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                          {scannedRecipient.type === "STALL" ? (
                            <Store className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                          ) : (
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-green-600 font-medium uppercase">
                            {scannedRecipient.type === "STALL" ? "Stall" : "Student"}
                          </p>
                          <p className="font-semibold text-base sm:text-lg truncate">{scannedRecipient.name}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleClearRecipient} className="flex-shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="phone" className="space-y-4 mt-4">
              {!phoneLookupResult?.found ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recipient Phone Number</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Enter registered phone number"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button 
                        onClick={handlePhoneLookup} 
                        disabled={phoneLookupLoading || !recipientPhone}
                      >
                        {phoneLookupLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Look Up"
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {phoneLookupResult && !phoneLookupResult.found && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-2" />
                      Phone number not found. Please enter a registered number.
                    </div>
                  )}
                </div>
              ) : (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-full">
                          {phoneLookupResult.type === "STALL" ? (
                            <Store className="h-6 w-6 text-green-600" />
                          ) : (
                            <User className="h-6 w-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-green-600 font-medium uppercase">
                            {phoneLookupResult.type === "STALL" ? "Stall" : "Student"}
                          </p>
                          <p className="font-semibold text-lg">
                            {phoneLookupResult.stallName || phoneLookupResult.name}
                          </p>
                          <p className="text-sm text-muted-foreground">{recipientPhone}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={handleClearRecipient}>
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

      {(scannedRecipient || phoneLookupResult?.found) && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Amount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Amount to Pay</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                  {APP_CONFIG.currency.symbol}
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-2xl h-14 font-bold"
                  step="0.01"
                  min="0"
                  max={profile?.walletBalance}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Available: {formatCurrency(profile?.walletBalance || 0)}
              </p>
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handlePreparePayment}
              disabled={!amount || parseFloat(amount) <= 0 || processing}
            >
              <Send className="h-4 w-4 mr-2" />
              Pay {formatCurrency(parseFloat(amount || "0") || 0)}
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
                Scan QR Code
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm font-medium text-white/80">
                Point your camera at a stall or student QR code
              </DialogDescription>
            </div>
          </div>
          <div className="p-5">
            <div className="relative aspect-square bg-black rounded-[5px] overflow-hidden shadow-premium">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
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
                Review your payment details
              </DialogDescription>
            </div>
          </div>
          <div className="space-y-4 p-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Paying to</span>
              <div className="text-right">
                <span className="font-bold">{recipientInfo?.name}</span>
                <p className="text-xs text-muted-foreground">
                  {recipientInfo?.type === "STALL" ? "Stall" : "Student"}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Amount</span>
              <span className="font-bold text-xl">
                {formatCurrency(parseFloat(amount || "0") || 0)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Remaining Balance</span>
              <span className="font-bold text-green-600">
                {formatCurrency((profile?.walletBalance || 0) - (parseFloat(amount || "0") || 0))}
              </span>
            </div>
          </div>
          <div className="flex gap-3 p-6 pt-0">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} className="h-11 flex-1 rounded-[5px] font-bold">
              Cancel
            </Button>
            <Button onClick={handleConfirmPayment} disabled={processing} className="h-11 flex-1 rounded-[5px] font-bold">
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Payment"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-6 w-6" />
              Payment Successful!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">
                {formatCurrency(parseFloat(lastTransaction?.amount || "0"))}
              </p>
              <p className="text-muted-foreground mt-2">
                Paid to <span className="font-medium text-foreground">{lastTransaction?.recipient}</span>
              </p>
            </div>
            <div className="flex justify-between bg-muted p-4 rounded-lg">
              <span className="text-muted-foreground">New Balance</span>
              <span className="font-bold text-lg">
                {formatCurrency(lastTransaction?.newBalance || 0)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)} className="w-full" size="lg">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
