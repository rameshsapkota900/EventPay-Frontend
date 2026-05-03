import { useEffect, useMemo, useState } from "react"
import { api, type User, type Organization } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

const userRoles = [
  { value: "all", label: "All Roles" },
  { value: "ORG_ADMIN", label: "Organization Admin" },
  { value: "STALL_OWNER", label: "Stall Owner" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "STUDENT", label: "Student" },
]

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function UserSearchPage() {
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState({
    role: "all",
    organizationId: "all",
    email: "",
    phone: "",
    dateFrom: "",
    dateTo: "",
  })
  const [debouncedEmail, setDebouncedEmail] = useState("")
  const [debouncedPhone, setDebouncedPhone] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedEmail(filters.email.trim()), 300)
    return () => clearTimeout(timer)
  }, [filters.email])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPhone(filters.phone.trim()), 300)
    return () => clearTimeout(timer)
  }, [filters.phone])

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const data = await api.get<Organization[]>("/super-admin/organizations")
        setOrganizations(data)
      } catch {
        console.error("Failed to load organizations")
      }
    }
    fetchOrganizations()
  }, [])

  useEffect(() => {
    let active = true
    const fetchUsers = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.role !== "all") params.append("role", filters.role)
        if (filters.organizationId !== "all") params.append("organizationId", filters.organizationId)
        if (debouncedEmail) params.append("email", debouncedEmail)
        if (debouncedPhone) params.append("phone", debouncedPhone)
        if (filters.dateFrom) params.append("dateFrom", filters.dateFrom)
        if (filters.dateTo) params.append("dateTo", filters.dateTo)

        const query = params.toString()
        const endpoint = query ? `/super-admin/users/search?${query}` : "/super-admin/users/search"
        const data = await api.get<User[]>(endpoint)
        if (active) setUsers(data)
      } catch {
        if (active) toast.error("Failed to load users")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    fetchUsers()
    return () => {
      active = false
    }
  }, [filters.role, filters.organizationId, debouncedEmail, debouncedPhone, filters.dateFrom, filters.dateTo])

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setPage(1)
    setFilters({
      role: "all",
      organizationId: "all",
      email: "",
      phone: "",
      dateFrom: "",
      dateTo: "",
    })
  }

  const totalItems = users.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize
    return users.slice(start, start + pageSize)
  }, [users, page, pageSize])

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems)

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    {
      header: "Organization",
      accessorKey: "organizationId" as const,
      cell: (row: User) => {
        if (!row.organizationId) return "-"
        const organization = organizations.find((org) => org.id === row.organizationId)
        return organization?.name || `#${row.organizationId}`
      },
    },
    { header: "Email", accessorKey: "email" as const, cell: (row: User) => row.email || "-" },
    { header: "Phone", accessorKey: "phone" as const, cell: (row: User) => row.phone || "-" },
    {
      header: "Role",
      accessorKey: "role" as const,
      cell: (row: User) => <Badge variant="outline">{row.role.replace("_", " ")}</Badge>,
    },
    {
      header: "Status",
      accessorKey: "isActive" as const,
      cell: (row: User) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>{row.isActive ? "Active" : "Inactive"}</Badge>
      ),
    },
    {
      header: "Registered",
      accessorKey: "createdAt" as const,
      cell: (row: User) => new Date(row.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[10px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">User Search</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Search users across all organizations</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg sm:text-xl">Search Filters</CardTitle>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Filters apply automatically in real time
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={filters.role} onValueChange={(value) => updateFilter("role", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select
                value={filters.organizationId}
                onValueChange={(value) => updateFilter("organizationId", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={filters.email}
                onChange={(e) => updateFilter("email", e.target.value)}
                placeholder="Search by email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={filters.phone}
                onChange={(e) => updateFilter("phone", e.target.value)}
                placeholder="Search by phone"
              />
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="h-10 w-full font-semibold" onClick={resetFilters} disabled={isLoading}>
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-[10px] border border-slate-200 bg-white p-3 sm:p-4">
        <DataTable columns={columns} data={paginatedUsers} />
      </div>

      <div className="flex flex-col gap-3 rounded-[10px] border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} users
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value))
              setPage(1)
            }}
          >
            <SelectTrigger className="h-8 w-[88px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Prev
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
