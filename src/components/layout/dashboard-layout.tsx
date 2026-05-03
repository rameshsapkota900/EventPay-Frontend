import { type ReactNode, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLocation, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { NotificationSheet } from "@/components/layout/notification-sheet"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Store,
  UserCheck,
  GraduationCap,
  FileText,
  LogOut,
  Menu,
  X,
  CreditCard,
  QrCode,
  History,
  Send,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: ReactNode
}

const navigationByRole: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { title: "Dashboard", href: "/super-admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Organizations", href: "/super-admin/organizations", icon: <Building2 className="h-5 w-5" /> },
    { title: "User Search", href: "/super-admin/users", icon: <Users className="h-5 w-5" /> },
    { title: "Reports", href: "/super-admin/reports", icon: <FileText className="h-5 w-5" /> },
  ],
  ORG_ADMIN: [
    { title: "Dashboard", href: "/org-admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Events", href: "/org-admin/events", icon: <Calendar className="h-5 w-5" /> },
    { title: "Stalls", href: "/org-admin/stalls", icon: <Store className="h-5 w-5" /> },
    { title: "Volunteers", href: "/org-admin/volunteers", icon: <UserCheck className="h-5 w-5" /> },
    { title: "Students", href: "/org-admin/students", icon: <GraduationCap className="h-5 w-5" /> },
    { title: "Transactions", href: "/org-admin/transactions", icon: <CreditCard className="h-5 w-5" /> },
    { title: "User Search", href: "/org-admin/users", icon: <Users className="h-5 w-5" /> },
    { title: "Reports", href: "/org-admin/reports", icon: <FileText className="h-5 w-5" /> },
  ],
  STALL_OWNER: [
    { title: "Dashboard", href: "/stall-owner/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Profile", href: "/stall-owner/profile", icon: <Store className="h-5 w-5" /> },
    { title: "Pay Student", href: "/stall-owner/pay-student", icon: <Send className="h-5 w-5" /> },
    { title: "Transactions", href: "/stall-owner/transactions", icon: <History className="h-5 w-5" /> },
  ],
  VOLUNTEER: [
    { title: "Dashboard", href: "/volunteer/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Register Student", href: "/volunteer/register", icon: <GraduationCap className="h-5 w-5" /> },
    { title: "Transactions", href: "/volunteer/transactions", icon: <History className="h-5 w-5" /> },
  ],
  STUDENT: [
    { title: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { title: "Profile", href: "/student/profile", icon: <Users className="h-5 w-5" /> },
    { title: "Pay", href: "/student/pay", icon: <QrCode className="h-5 w-5" /> },
    { title: "Transactions", href: "/student/transactions", icon: <History className="h-5 w-5" /> },
  ],
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const pathname = location.pathname
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user) return null

  const navigation = navigationByRole[user.role] || []

  return (
    <div className="min-h-dvh bg-muted/40">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col border-r border-border/80 bg-card shadow-soft transition-transform duration-300 ease-smooth sm:w-72",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border/60 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <CreditCard className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight text-foreground">EventPay</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Console</p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {navigation.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-200 ease-smooth",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                    active ? "bg-primary/15 text-primary" : "bg-muted/80 text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                  )}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.title}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 border-t border-border/60 bg-card/95 p-4 backdrop-blur-sm">
          {user.role !== "SUPER_ADMIN" && user.role !== "ORG_ADMIN" && (
            <div className="mb-3 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email || user.phone}</p>
            </div>
          )}
          <span className="mb-3 inline-flex rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold capitalize tracking-wide text-muted-foreground">
            {user.role.replace("_", " ").toLowerCase()}
          </span>
          <Button
            variant="outline"
            className="h-11 w-full justify-start gap-2 rounded-xl border-border/80 font-medium text-muted-foreground transition-all duration-200 hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </Button>
        </div>
      </aside>

      <div className="min-h-dvh lg:pl-72">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/85 px-4 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/70 sm:h-16 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1" />
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationSheet />
            {user.organizationName && (
              <span className="hidden max-w-[12rem] truncate text-sm font-medium text-muted-foreground sm:inline-block md:max-w-xs">
                {user.organizationName}
              </span>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
