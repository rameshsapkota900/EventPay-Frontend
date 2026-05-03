import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard, CheckCircle2, AlertTriangle, Clock3, ArrowLeft } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import bgImage from "../../background.png"

interface InviteValidationResponse {
  email: string
  expiresAt: string
}

export default function OrganizationSetupPage() {
  const [params] = useSearchParams()
  const token = params.get("token") || ""

  const [isValidating, setIsValidating] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [invite, setInvite] = useState<InviteValidationResponse | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    password: "",
  })

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError("Invitation token is missing")
        setIsValidating(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/organization-invitations/validate?token=${encodeURIComponent(token)}`)
        const json = await response.json()
        if (!response.ok || !json.success) {
          throw new Error(json.error?.message || json.message || "Invalid invitation link")
        }
        setInvite(json.data as InviteValidationResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid invitation link")
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.password.trim()) {
      toast.error("Organization name and password are required")
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/organization-invitations/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          password: formData.password,
        }),
      })
      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to setup organization")
      }
      setCompleted(true)
      toast.success("Organization setup completed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to setup organization")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-slate-900"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    >
      <div className="absolute inset-0 bg-slate-900/82 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] h-[45%] w-[45%] rounded-full bg-slate-500/20 blur-[150px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-3 py-8 sm:px-6">
        <Card className="w-full max-w-[840px] overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-2xl">
          <div className="relative border-b border-slate-800 bg-slate-900 p-7 pb-9 text-center sm:p-8 sm:pb-10">
            <div className="absolute top-[-55%] left-[-20%] h-[155%] w-[100%] rounded-full bg-slate-800 blur-[60px]" />
            <div className="relative z-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[5px] border border-slate-200 bg-white shadow-md">
                <CreditCard className="h-6 w-6 text-slate-900" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">Organization Setup</h1>
              <p className="mt-2 text-sm font-medium text-slate-300">
                Complete your organization setup using the secure invitation link.
              </p>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            {isValidating ? (
              <div className="flex flex-col items-center justify-center space-y-4 py-12 text-sm font-medium text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p>Validating secure invitation...</p>
              </div>
            ) : error ? (
              <div className="space-y-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Invalid Invitation</h2>
                  <p className="text-sm font-medium text-slate-600">{error}</p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex h-12 w-full max-w-[280px] items-center justify-center rounded-[5px] border border-transparent text-sm font-bold text-slate-700 transition-all hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Login
                </Link>
              </div>
            ) : completed ? (
              <div className="space-y-6 py-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[5px] bg-slate-900 text-white shadow-lg shadow-black/10">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">Setup Complete</h2>
                  <p className="text-sm font-medium text-slate-500">Your organization has been configured successfully.</p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex h-12 w-full max-w-[280px] items-center justify-center rounded-[5px] bg-slate-900 text-sm font-bold text-white transition-all hover:bg-slate-800"
                >
                  Proceed to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2.5 sm:col-span-2">
                    <Label className="text-sm font-bold tracking-tight text-slate-900">Admin Email</Label>
                    <Input
                      value={invite?.email || ""}
                      disabled
                      className="h-12 rounded-[5px] border-slate-200 bg-slate-50 text-sm font-medium text-slate-500"
                    />
                  </div>

                  <div className="space-y-2.5 sm:col-span-2">
                    <Label htmlFor="name" className="text-sm font-bold tracking-tight text-slate-900">
                      Organization Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter organization name"
                      className="h-12 rounded-[5px] border-slate-200 bg-slate-50 text-sm font-medium placeholder:text-slate-400 focus-visible:border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-2.5 sm:col-span-2">
                    <Label htmlFor="description" className="text-sm font-bold tracking-tight text-slate-900">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief organization description"
                      rows={3}
                      className="rounded-[5px] border-slate-200 bg-slate-50 text-sm font-medium placeholder:text-slate-400 resize-none focus-visible:border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="location" className="text-sm font-bold tracking-tight text-slate-900">
                      Location
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Enter location"
                      className="h-12 rounded-[5px] border-slate-200 bg-slate-50 text-sm font-medium placeholder:text-slate-400 focus-visible:border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="password" className="text-sm font-bold tracking-tight text-slate-900">
                      Administrator Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="h-12 rounded-[5px] border-slate-200 bg-slate-50 text-sm font-medium placeholder:text-slate-400 focus-visible:border-transparent focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-slate-900"
                    />
                    <p className="text-xs font-medium text-slate-400">Password must be at least 6 characters.</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-center rounded-[5px] border border-slate-100 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-500">
                    <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                    Token expires:&nbsp;
                    <span className="text-slate-700">
                      {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleString() : "-"}
                    </span>
                  </div>
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-[5px] bg-slate-900 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Completing Setup...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
