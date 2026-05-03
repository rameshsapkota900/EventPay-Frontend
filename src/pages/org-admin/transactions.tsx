import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api, type Event, type Transaction } from "@/lib/api"
import { DataTable } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"

export default function TransactionsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user?.organizationId) return
    const fetchEvents = async () => {
      try {
        const data = await api.get<Event[]>(`/org-admin/events/organization/${user.organizationId}`)
        setEvents(data)
        setIsLoading(false)
      } catch (error) {
        toast.error("Failed to load events")
        setIsLoading(false)
      }
    }
    fetchEvents()
  }, [user?.organizationId])

  useEffect(() => {
    if (!selectedEvent) return
    const fetchTransactions = async () => {
      try {
        const data = await api.get<Transaction[]>(`/org-admin/transactions/event/${selectedEvent}`)
        setTransactions(data)
      } catch (error) {
        toast.error("Failed to load transactions")
      }
    }
    fetchTransactions()
  }, [selectedEvent])

  const columns = [
    {
      header: "Date & Time",
      accessorKey: "createdAt" as const,
      cell: (row: Transaction) => new Date(row.createdAt).toLocaleString(),
    },
    { header: "From", accessorKey: "fromStudentName" as const },
    { header: "From Phone", accessorKey: "fromStudentPhone" as const },
    {
      header: "To",
      accessorKey: "toStallName" as const,
      cell: (row: Transaction) => row.toStallName || row.toStudentName || "-",
    },
    {
      header: "Type",
      accessorKey: "transactionType" as const,
      cell: (row: Transaction) => <Badge variant="outline">{row.transactionType}</Badge>,
    },
    {
      header: "Amount",
      accessorKey: "amount" as const,
      cell: (row: Transaction) => formatCurrency(row.amount),
    },
    {
      header: "Method",
      accessorKey: "paymentMethod" as const,
      cell: (row: Transaction) => <Badge variant="secondary">{row.paymentMethod}</Badge>,
    },
  ]

  const selectedEventName = events.find((event) => String(event.id) === selectedEvent)?.name || "-"
  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)
  const qrTransactions = transactions.filter((transaction) => transaction.paymentMethod === "QR").length
  const phoneTransactions = transactions.filter((transaction) => transaction.paymentMethod === "PHONE").length

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
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">Track payments and transfer activity by event</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-slate-500">Select Event</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="h-10 bg-white">
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
          </div>
          <div className="rounded-[8px] border border-slate-200 bg-white p-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Selected Event</p>
            <p className="text-base font-semibold text-slate-900">{selectedEventName}</p>
          </div>
        </div>
      </div>

      {selectedEvent ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Total Transactions</p>
              <p className="text-xl font-semibold text-slate-900">{transactions.length}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Total Amount</p>
              <p className="text-xl font-semibold text-slate-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">QR Payments</p>
              <p className="text-xl font-semibold text-indigo-700">{qrTransactions}</p>
            </div>
            <div className="rounded-[8px] border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wider text-slate-500">Phone Payments</p>
              <p className="text-xl font-semibold text-cyan-700">{phoneTransactions}</p>
            </div>
          </div>

          <div className="rounded-[10px] border border-slate-200 bg-white p-3 sm:p-4 overflow-x-auto">
            <DataTable
              columns={columns}
              data={transactions}
              searchPlaceholder="Search by student name..."
              searchKey="fromStudentName"
            />
          </div>
        </>
      ) : (
        <div className="rounded-[10px] border border-dashed border-slate-300 bg-white py-12 text-center text-sm text-muted-foreground sm:text-base">
          Please select an event to view transactions
        </div>
      )}
    </div>
  )
}
