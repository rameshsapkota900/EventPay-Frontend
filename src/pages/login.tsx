import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import type { AuthResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import bgImage from "../../background.png"
import {
  Loader2,
  CreditCard,
  Wallet,
  QrCode,
  Shield,
  BarChart3,
  Users,
  Zap,
  Mail,
  Phone,
  MapPin,
  Github,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

export default function LoginPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("")
  const [password, setPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpStep, setShowOtpStep] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [pendingAuthResponse, setPendingAuthResponse] = useState<AuthResponse | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { completeLogin } = useAuth()
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"

  const STUDENT_OTP = "123456" // Fixed OTP for all students

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!emailOrPhone || !password) {
      toast.error("Please fill in all fields")
      return
    }

    setIsLoading(true)
    try {
      // First, try to authenticate to check if it's a student
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const authResponse = data.data as AuthResponse | undefined
        if (!authResponse) {
          throw new Error("Login failed")
        }

        // Check if user is a student
        if (authResponse.role === "STUDENT") {
          // Show OTP step for students
          setPendingAuthResponse(authResponse)
          setShowOtpStep(true)
          toast.info("Please enter the OTP to complete login")
        } else {
          // Direct login for non-students
          completeLogin(authResponse)
          toast.success("Login successful")
          setIsLoginModalOpen(false) // Close modal on success
        }
      } else {
        toast.error(data.error?.message || data.message || "Login failed")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp) {
      toast.error("Please enter the OTP")
      return
    }

    if (otp !== STUDENT_OTP) {
      toast.error("Wrong OTP. Please try again.")
      return
    }

    if (!pendingAuthResponse) {
      toast.error("Session expired. Please login again.")
      setShowOtpStep(false)
      return
    }

    setIsLoading(true)
    try {
      completeLogin(pendingAuthResponse)
      setPendingAuthResponse(null)
      toast.success("Login successful")
      setIsLoginModalOpen(false) // Close modal on success
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowOtpStep(false)
    setShowForgotPassword(false)
    setPendingAuthResponse(null)
    setOtp("")
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedEmail = resetEmail.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error("Email is required")
      return
    }

    if (!normalizedEmail.includes("@")) {
      toast.error("Please enter a valid organization admin email")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      })

      const json = await response.json()
      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || json.message || "Failed to send reset email")
      }

      toast.success(json.message || "Password reset instructions sent to your email")
      setShowForgotPassword(false)
      setResetEmail("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  const openLoginModal = () => setIsLoginModalOpen(true)

  const handleModalChange = (open: boolean) => {
    setIsLoginModalOpen(open)
    if (!open) {
      // Reset all states when modal closes
      setTimeout(() => {
        setShowOtpStep(false)
        setShowForgotPassword(false)
        setPendingAuthResponse(null)
        setOtp("")
        setEmailOrPhone("")
        setPassword("")
        setResetEmail("")
      }, 300)
    }
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const features = [
    {
      icon: <Wallet className="h-7 w-7" />,
      title: "Digital Wallet",
      description: "Secure digital wallet for seamless cashless transactions at events. Keep track of every penny effortlessly."
    },
    {
      icon: <QrCode className="h-7 w-7" />,
      title: "QR Code Payments",
      description: "Quick and easy payments using lightning-fast QR code scanning technology. No lines, no change."
    },
    {
      icon: <Shield className="h-7 w-7" />,
      title: "Secure Transactions",
      description: "Bank-grade security ensuring safe and protected payments for all parties involved."
    },
    {
      icon: <BarChart3 className="h-7 w-7" />,
      title: "Real-time Analytics",
      description: "Live dashboards and granular reports for event organizers and stall owners out of the box."
    },
    {
      icon: <Users className="h-7 w-7" />,
      title: "Multi-Role Support",
      description: "Dedicated interfaces specifically tailored for admins, stall owners, volunteers, and students."
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: "Fast & Efficient",
      description: "Radically reduce queue times, streamline event payments, and boost overall visitor satisfaction."
    }
  ]

  return (
    <>
      <div className="min-h-dvh bg-background text-foreground selection:bg-primary/15 overflow-x-hidden relative">
        {/* Ambient depth */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-15%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/[0.07] blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] h-[40%] w-[40%] rounded-full bg-primary/[0.05] blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[20%] h-[40%] w-[30%] rounded-full bg-brand-warm/[0.06] blur-[100px]" />
        </div>

        {/* Global Max Width Container removed to allow true edge-to-edge rendering */}
        <div className="relative z-10 w-full">

          {/* Navigation */}
          <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90 shadow-3d">
            <div className="mx-auto w-full max-w-[2500px] px-4 sm:px-6 lg:px-12">
              <div className="flex h-16 items-center justify-between">
                <div className="group flex cursor-pointer items-center gap-3" onClick={() => scrollToSection('home')}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[5px] bg-primary text-primary-foreground shadow-3d transition-all duration-200 group-hover:shadow-3d-lg sm:h-10 sm:w-10 relative before:absolute before:inset-0 before:rounded-[5px] before:bg-gradient-to-br before:from-white/10 before:to-transparent">
                    <CreditCard className="h-5 w-5 sm:h-5 sm:w-5 relative z-10" />
                  </div>
                  <span className="text-xl font-bold text-foreground sm:text-xl">EventPay</span>
                </div>
                <div className="hidden md:flex items-center gap-8 lg:gap-10">
                  <button type="button" onClick={() => scrollToSection('home')} className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    Home
                  </button>
                  <button type="button" onClick={() => scrollToSection('about')} className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    About
                  </button>
                  <button type="button" onClick={() => scrollToSection('features')} className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    Features
                  </button>
                  <button type="button" onClick={() => scrollToSection('contact')} className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    Contact
                  </button>
                  <Button onClick={openLoginModal} size="default" className="shadow-3d-raised hover:shadow-3d-lg">
                    Sign In
                  </Button>
                </div>
                <div className="md:hidden">
                  <Button onClick={openLoginModal} size="sm" className="shadow-3d">
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section id="home" className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-12 min-h-screen flex flex-col justify-center items-center text-center relative w-full" 
            style={{ 
              backgroundImage: `url(${bgImage})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center', 
              backgroundRepeat: 'no-repeat' 
            }}>
            <div className="absolute inset-0 z-0 bg-foreground/75 backdrop-blur-[2px]" />
            
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className="flex-1 flex flex-col justify-center items-center py-16">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white max-w-5xl leading-[1.1] mb-6">
                  Transform Your Events with <br className="hidden md:block" />
                  <span className="text-white">Cashless Payments</span>
                </h1>
                <p className="mb-8 max-w-2xl text-base font-medium leading-relaxed text-white/90 sm:text-lg">
                  EventPay is a professional cashless payment solution designed for college fests, 
                  exhibitions, and events. Say goodbye to cash handling chaos.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
                  <Button
                    size="lg"
                    onClick={openLoginModal}
                    className="group flex-1 bg-white text-foreground hover:bg-white/95 shadow-elegant-lg"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollToSection('about')}
                    className="flex-1 border-2 border-white/60 bg-white/10 text-white hover:bg-white/20 hover:border-white/80 backdrop-blur-sm"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
              
              <div className="mt-8 flex w-full max-w-4xl flex-wrap justify-center gap-8 border-t border-white/20 pb-8 pt-8 sm:gap-16">
                <div className="text-center transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="mb-2 text-3xl font-bold text-white sm:text-4xl">100%</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-white/80 sm:text-sm">Cashless Secure</div>
                </div>
                <div className="text-center transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="mb-2 text-3xl font-bold text-white sm:text-4xl">Instant</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-white/80 sm:text-sm">QR Transactions</div>
                </div>
                <div className="text-center transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="mb-2 text-3xl font-bold text-white sm:text-4xl">Real-time</div>
                  <div className="text-xs font-medium uppercase tracking-wider text-white/80 sm:text-sm">Live Analytics</div>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section id="about" className="relative my-10 overflow-hidden border-y border-border/50 bg-card py-20 px-4 sm:my-20 sm:py-32 sm:px-6 lg:px-12">
            <div className="absolute top-0 right-0 w-[50%] h-[100%] bg-gradient-to-l from-muted/90 to-transparent pointer-events-none -z-10" />
            
            <div className="text-center mb-16 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">About the Platform</h2>
              <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 sm:gap-20 items-center max-w-[1700px] mx-auto">
              <div className="space-y-12">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 tracking-tight">The Problem We Solve</h3>
                  <div className="space-y-6 sm:space-y-8">
                    {[
                      { title: "Cash Handling Chaos", desc: "No more worrying about carrying change, counterfeit notes, or absolute cash security at massive events." },
                      { title: "Long Queue Times", desc: "Instant QR-based payments cut wait times down to seconds, supercharging vendor throughput." },
                      { title: "Lack of Transparency", desc: "Gain instant clarity with real-time tracking of all structural transactions and granular live reports." },
                      { title: "Manual Record Keeping", desc: "Automated digital records completely eliminate error-prone human paperwork and ledger mismatches." }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 group sm:bg-transparent bg-muted/50/50 p-5 sm:p-0 rounded-[10px] border border-border/60 sm:border-transparent hover:bg-muted/50 transition-colors">
                        <div className="h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 font-bold shadow-md transform sm:group-hover:scale-110 transition-transform duration-300">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-foreground mb-2">{item.title}</h4>
                          <p className="text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="relative mt-8 lg:mt-0">
                <div className="absolute inset-0 bg-primary rounded-[20px] transform translate-x-4 translate-y-4 -z-10 opacity-10 blur-sm"></div>
                <div className="bg-white rounded-[20px] p-6 sm:p-10 lg:p-14 border border-border shadow-xl h-full flex flex-col justify-center relative z-10 overflow-hidden">
                  <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-10 tracking-tight text-center sm:text-left">How It Works</h3>
                  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[27px] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                    {[
                      { title: "Register at Event", desc: "Volunteers seamlessly register students and instantly deploy their internal digital wallets.", step: 1 },
                      { title: "Scan & Pay", desc: "Students tap to pay at any internal stall by scanning an intelligently generated unique QR code.", step: 2 },
                      { title: "Track & Report", desc: "Administrators and stall runners view live transactions natively generating instantaneous reports.", step: 3 }
                    ].map((item) => (
                      <div key={item.step} className="relative flex items-center group">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-white bg-primary text-white shadow shadow-border/40 text-xl font-bold shrink-0 z-10 transition-transform duration-300 group-hover:scale-110">
                          {item.step}
                        </div>
                        <div className="ml-6 flex-1 bg-muted/50 p-6 rounded-[10px] border border-border shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:-translate-y-1">
                          <h4 className="font-bold text-foreground mb-2 text-lg">{item.title}</h4>
                          <p className="text-muted-foreground text-sm leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="py-32 px-4 sm:px-6 lg:px-12 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-muted blur-[120px] pointer-events-none -z-10" />
            
            <div className="text-center mb-24 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">Powerful Features</h2>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-medium">
                Everything you need to orchestrate a successful, seamless, and fully automated cashless event environment.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {features.map((feature, index) => (
                <div key={index} className="group relative rounded-2xl border border-border/60 bg-card/90 p-10 shadow-soft backdrop-blur-sm transition-all duration-300 ease-smooth hover:-translate-y-1.5 hover:shadow-soft-lg">
                  <div className="absolute top-0 left-10 w-20 h-1 bg-primary rounded-b-full transform origin-top scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  
                  <div className="h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center mb-8 shadow-md transform group-hover:rotate-6 transition-transform duration-300">
                    <div className="scale-75">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-[15px] xl:text-base font-medium">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* User Roles Section */}
          <section className="relative my-10 overflow-hidden border-y border-border/50 bg-card py-24 px-4 sm:px-6 lg:px-12">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-muted/90 to-transparent pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border to-transparent"></div>
            
            <div className="text-center mb-20 relative z-10">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6">Built for Everyone</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Dedicated real-time dashboards, meticulously optimized workflows, and exact granular permissions tailored specifically for every user role in your event.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 xl:gap-8 relative z-10 max-w-[1600px] mx-auto">
              {[
                { role: "Super Admin", desc: "Oversee global instances, system metrics, and cross-event analytics." },
                { role: "Org Admin", desc: "Configure events, assign staff roles, and monitor live revenue streams." },
                { role: "Stall Owner", desc: "Process instant QR payments and track item-level daily sales data." },
                { role: "Volunteer", desc: "Register fresh students, issue digital IDs, and safely handle wallet top-ups." },
                { role: "Student / User", desc: "Scan, pay seamlessly, trace history, and manage digital balance on demand." },
              ].map((item, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-background/80 p-8 text-left shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-1 hover:border-primary/25 hover:shadow-soft-lg"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/[0.06] blur-2xl transition-transform duration-500 group-hover:scale-110" />
                  <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-muted/50 text-primary shadow-sm transition-transform duration-300 group-hover:scale-[1.03]">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold tracking-tight text-foreground">{item.role}</h3>
                  <p className="text-sm font-medium leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="py-24 px-4 sm:px-6 lg:px-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-10">Get In Touch</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1400px] mx-auto">
              {[
                { icon: <Mail className="h-5 w-5" />, text: "info@eventpay.com", label: "Email Us" },
                { icon: <Phone className="h-5 w-5" />, text: "+977 9824065478", label: "Call Us" },
                { icon: <MapPin className="h-5 w-5" />, text: "Itahari International College", label: "Sundarharaicha Dulari, Nepal" },
                { icon: <Github className="h-5 w-5" />, text: "rameshsapkota900", label: "GitHub" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3 bg-white px-6 py-6 rounded-2xl border border-border/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-default w-full">
                  <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center text-foreground border border-border/60 mb-2">
                    {item.icon}
                  </div>
                  <span className="text-foreground font-bold text-[15px] xl:text-base break-words text-center">{item.text}</span>
                  <span className="text-muted-foreground text-sm font-medium text-center">{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-background/10 bg-foreground px-4 pb-6 pt-12 sm:px-6 lg:px-12">
            <div className="mx-auto w-full max-w-[1700px] min-[2500px]:max-w-[2300px]">
              <div className="grid justify-items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)] lg:justify-items-stretch">
                <div className="space-y-4 text-center lg:text-left">
                  <div className="mx-auto flex w-fit cursor-pointer items-center gap-3 lg:mx-0" onClick={() => scrollToSection('home')}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                      <CreditCard className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-white">EventPay</span>
                  </div>
                  <p className="mx-auto max-w-sm text-sm font-medium leading-relaxed text-background/70 lg:mx-0">
                    The ultimate cashless payment solution for college fests, exhibitions, and modern events.
                    Experience seamless, secure, and lightning-fast digital transactions.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-1 lg:justify-start">
                    <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl border border-background/20 text-background/70 transition-all duration-300 hover:border-white hover:bg-white hover:text-foreground">
                      <Github className="h-5 w-5" />
                    </a>
                    <a href="#" className="flex h-10 w-10 items-center justify-center rounded-xl border border-background/20 text-background/70 transition-all duration-300 hover:border-white hover:bg-white hover:text-foreground">
                      <Mail className="h-5 w-5" />
                    </a>
                  </div>
                </div>

                <div className="grid w-full max-w-[720px] grid-cols-1 justify-items-center gap-10 text-center sm:grid-cols-3 sm:gap-8 sm:text-left sm:justify-items-start lg:max-w-none lg:gap-14">
                  <div>
                    <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Quick Links</h4>
                    <ul className="space-y-3">
                      <li><button onClick={() => scrollToSection('home')} className="text-sm font-medium text-background/70 transition-colors hover:text-white">Home</button></li>
                      <li><button onClick={() => scrollToSection('about')} className="text-sm font-medium text-background/70 transition-colors hover:text-white">How It Works</button></li>
                      <li><button onClick={() => scrollToSection('features')} className="text-sm font-medium text-background/70 transition-colors hover:text-white">Core Features</button></li>
                      <li><button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-background/70 transition-colors hover:text-white">Contact Us</button></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Resources</h4>
                    <ul className="space-y-3">
                      <li><button onClick={openLoginModal} className="text-sm font-medium text-background/70 transition-colors hover:text-white">Sign In Portal</button></li>
                      <li><button className="text-sm font-medium text-background/70 transition-colors hover:text-white">Help Center</button></li>
                      <li><button className="text-sm font-medium text-background/70 transition-colors hover:text-white">Security Setup</button></li>
                      <li><button className="text-sm font-medium text-background/70 transition-colors hover:text-white">API Docs</button></li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-5 text-sm font-bold uppercase tracking-widest text-white">Legal</h4>
                    <ul className="space-y-3">
                      <li><a href="#" className="text-sm font-medium text-background/70 transition-colors hover:text-white">Privacy Policy</a></li>
                      <li><a href="#" className="text-sm font-medium text-background/70 transition-colors hover:text-white">Terms of Service</a></li>
                      <li><a href="#" className="text-sm font-medium text-background/70 transition-colors hover:text-white">Cookie Policy</a></li>
                      <li><a href="#" className="text-sm font-medium text-background/70 transition-colors hover:text-white">Refund Guidelines</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-10 border-t border-background/15 pt-6">
                <p className="text-center text-sm font-medium text-background/55">
                  © {new Date().getFullYear()} EventPay. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

        </div>

        {/* Hover / Modal Login Form */}
        <Dialog open={isLoginModalOpen} onOpenChange={handleModalChange}>
          <DialogContent className="max-h-[92vh] w-[calc(100%-1rem)] max-w-[440px] overflow-y-auto rounded-[5px] border border-border/80 bg-white p-0 shadow-premium-xl sm:max-w-[460px]">
            {/* 3D Header with depth */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-600 p-8 pb-10 text-center shadow-3d-inset">
              {/* 3D layered background */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
              
              <div className="relative z-10">
                {/* 3D Icon with raised effect */}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[5px] bg-white/10 shadow-3d-raised backdrop-blur-sm border border-white/20 relative">
                  <div className="absolute inset-0 rounded-[5px] bg-gradient-to-br from-white/20 to-transparent" />
                  <CreditCard className="h-7 w-7 text-white relative z-10 drop-shadow-lg" />
                </div>
                
                <DialogTitle className="text-2xl font-bold text-white mb-2 drop-shadow-md">
                  {showForgotPassword ? "Reset Password" : showOtpStep ? "Secure Verification" : "Welcome to EventPay"}
                </DialogTitle>
                <DialogDescription className="text-sm font-medium text-white/90 drop-shadow-sm">
                  {showForgotPassword
                    ? "We'll send you a secure link to reset it"
                    : showOtpStep 
                    ? "Enter your secure code to authenticate" 
                    : "Sign in to your professional workspace"}
                </DialogDescription>
              </div>
              
              {/* Bottom 3D edge */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-b from-transparent to-black/10" />
            </div>

            {/* 3D Content area with subtle depth */}
            <div className="p-8 pt-8 h-full bg-gradient-to-br from-gray-50 to-white relative">
              {/* Subtle 3D inner shadow */}
              <div className="absolute inset-0 shadow-3d-inset pointer-events-none rounded-b-[5px]" />
              
              <div className="relative z-10">
                {showForgotPassword ? (
                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="font-semibold">Organization Admin Email</Label>
                      <div className="relative">
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter organization admin email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <Button type="submit" className="h-11 w-full shadow-3d-raised hover:shadow-3d-lg active:shadow-3d transition-all" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending link...
                          </>
                        ) : (
                          "Send Reset Link"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full h-10 shadow-sm hover:shadow-3d transition-all" 
                        onClick={() => setShowForgotPassword(false)}
                        disabled={isLoading}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login
                      </Button>
                    </div>
                  </form>
                ) : !showOtpStep ? (
                  <form onSubmit={handleInitialSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="emailOrPhone" className="font-semibold">Email or Phone</Label>
                      <div className="relative">
                        <Input
                          id="emailOrPhone"
                          type="text"
                          placeholder="Enter your credentials"
                          value={emailOrPhone}
                          onChange={(e) => setEmailOrPhone(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="password" className="font-semibold">Password</Label>
                        <button 
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button type="submit" className="h-11 w-full shadow-3d-raised hover:shadow-3d-lg active:shadow-3d transition-all" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Authenticating...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <Label htmlFor="otp" className="block text-center font-semibold text-base">
                        6-Digit Security Code
                      </Label>
                      <div className="relative">
                        <Input
                          id="otp"
                          type="text"
                          placeholder="------"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          disabled={isLoading}
                          maxLength={6}
                          className="text-center text-3xl tracking-[0.5em] h-16 font-bold shadow-premium-inset"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground bg-primary/5 p-4 rounded-[5px] border-0 shadow-premium">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Student default OTP: <span className="text-primary font-bold">123456</span></span>
                      </div>
                    </div>
                    <div className="space-y-3 pt-2">
                      <Button type="submit" className="h-11 w-full shadow-3d-raised hover:shadow-3d-lg active:shadow-3d transition-all" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Verify & Continue
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="w-full h-10 shadow-sm hover:shadow-3d transition-all" 
                        onClick={handleBackToLogin}
                        disabled={isLoading}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Login Method
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </>
  )
}
