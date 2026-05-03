import { useEffect, useState } from "react"
import { api, type Organization } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { OrganizationDialog } from "@/components/super-admin/organization-dialog"
import { Plus, Trash2, Power, PowerOff } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; org: Organization | null }>({
    open: false,
    org: null,
  })

  const fetchOrganizations = async () => {
    try {
      const data = await api.get<Organization[]>("/super-admin/organizations")
      setOrganizations(data)
    } catch (error) {
      toast.error("Failed to load organizations")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const handleToggleStatus = async (org: Organization) => {
    try {
      if (org.isActive) {
        await api.post(`/super-admin/organizations/${org.id}/deactivate`)
        toast.success("Organization deactivated")
      } else {
        await api.post(`/super-admin/organizations/${org.id}/activate`)
        toast.success("Organization activated")
      }
      fetchOrganizations()
    } catch (error) {
      toast.error("Failed to update organization status")
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.org) return
    try {
      await api.delete(`/super-admin/organizations/${deleteDialog.org.id}`)
      toast.success("Organization deleted")
      setDeleteDialog({ open: false, org: null })
      fetchOrganizations()
    } catch (error) {
      toast.error("Failed to delete organization")
    }
  }

  const columns = [
    { header: "Name", accessorKey: "name" as const },
    { header: "Location", accessorKey: "location" as const },
    { header: "Admin Email", accessorKey: "adminEmail" as const },
    { header: "Events", accessorKey: "eventCount" as const },
    {
      header: "Revenue",
      accessorKey: "totalRevenue" as const,
      cell: (row: Organization) => formatCurrency(row.totalRevenue),
    },
    {
      header: "Status",
      accessorKey: "isActive" as const,
      cell: (row: Organization) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>{row.isActive ? "Active" : "Inactive"}</Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as const,
      cell: (row: Organization) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(row)}>
            {row.isActive ? (
              <PowerOff className="h-3 w-3 text-orange-500" />
            ) : (
              <Power className="h-3 w-3 text-green-500" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteDialog({ open: true, org: row })}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-[10px] border border-slate-200 bg-gradient-to-r from-white to-slate-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Organizations</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage all organizations</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Organization
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-900">{organizations.length}</p>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Active</p>
            <p className="text-xl font-semibold text-emerald-700">{organizations.filter((org) => org.isActive).length}</p>
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Inactive</p>
            <p className="text-xl font-semibold text-orange-700">{organizations.filter((org) => !org.isActive).length}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[10px] border border-slate-200 bg-white p-3 sm:p-4">
        <DataTable columns={columns} data={organizations} searchPlaceholder="Search organizations..." searchKey="name" />
      </div>

      <OrganizationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Organization"
        description={`Are you sure you want to delete "${deleteDialog.org?.name}"? This will permanently remove all events, stalls, transactions, and users under this organization.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  )
}
