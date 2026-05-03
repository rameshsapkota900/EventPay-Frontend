import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CreditCard, CheckCircle2, ArrowLeft } from "lucide-react"
import { API_BASE_URL } from "@/lib/api"
import bgImage from "../../background.png"

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error("Reset token is missing")
      return
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to reset password")
      }
      setIsDone(true)
      toast.success("Password reset successful")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="relative min-h-dvh overflow-hidden bg-foreground"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}
    >
      <div className="absolute inset-0 bg-foreground/75 backdrop-blur-[3px]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-15%] h-[45%] w-[45%] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-brand-warm/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-3 py-8 sm:px-6">
        <Card className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft-lg">
          <div className="relative border-b border-primary-foreground/15 bg-primary p-7 pb-9 text-center sm:p-8 sm:pb-10">
            <div className="absolute left-[-20%] top-[-55%] h-[155%] w-[100%] rounded-full bg-primary-foreground/10 blur-[60px]" />
            <div className="relative z-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 shadow-sm backdrop-blur-sm">
                <CreditCard className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-primary-foreground">Reset Password</h1>
              <p className="mt-2 text-sm font-medium text-primary-foreground/85">Set a new password for your organization admin account.</p>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            {isDone ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">Password Reset Complete</h2>
                  <p className="text-sm font-medium text-muted-foreground">Your password has been reset successfully.</p>
                </div>
                <Link
                  to="/login"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-soft transition-all duration-200 hover:bg-primary/92 hover:shadow-soft-lg"
                >
                  Back to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="password" className="text-sm font-semibold tracking-tight text-foreground">
                    New Password
                  </Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" className="h-12" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold tracking-tight text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="h-12"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Button type="submit" className="h-12 w-full rounded-xl font-semibold shadow-soft" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                  <Link
                    to="/login"
                    className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-transparent text-sm font-semibold text-muted-foreground transition-all duration-200 hover:border-border hover:bg-muted hover:text-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
