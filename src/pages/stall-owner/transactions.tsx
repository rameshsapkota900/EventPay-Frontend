import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Download, ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/currency"
import { useAccountUpdateListener } from "@/lib/realtime"

interface Transaction {
  id: number
  amount: number
  transactionType: string
  paymentMethod: string
  direction: string
  fromStudentName: string
  fromStudentPhone: string
  toStallName?: string
  toStudentName?: string
  toStudentPhone?: string
  eventName: string
  createdAt: string
}

export default function StallTransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [stallId, setStallId] = useState<number | null>(null)

  // Get stall ID from user profile
  const fetchStallInfo = useCallback(async () => {
    if (!user?.userId) {
      return
    }

    try {
      const response = await api.get<any>(`/stall-owner/profile/${user.userId}`)
      setStallId(response.id)
    } catch (error) {
      console.error("Failed to fetch stall info:", error)
    }
  }, [user?.userId])

  const fetchTransactions = useCallback(async () => {
    if (!stallId) return

    try {
      setLoading(true)
      const data = await api.get<Transaction[]>(`/stall-owner/transactions/all/${stallId}`)
      setTransactions(data)
      setFilteredTransactions(data)
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }, [stallId])

  useEffect(() => {
    void fetchStallInfo()
  }, [fetchStallInfo])

  useEffect(() => {
    if (stallId) {
      void fetchTransactions()
    }
  }, [fetchTransactions, stallId])

  useAccountUpdateListener(() => {
    if (stallId) {
      void fetchTransactions()
    } else {
      void fetchStallInfo()
    }
  })

  // Filter transactions based on search, tab, and payment method
  useEffect(() => {
    let filtered = transactions

    // Filter by direction (tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(tx => 
        activeTab === "incoming" ? tx.direction === "INCOMING" : tx.direction === "OUTGOING"
      )
    }

    // Filter by payment method
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter(tx => tx.paymentMethod === paymentMethodFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.fromStudentName?.toLowerCase().includes(term) ||
        tx.fromStudentPhone?.toLowerCase().includes(term) ||
        tx.toStallName?.toLowerCase().includes(term) ||
        tx.toStudentName?.toLowerCase().includes(term) ||
        tx.toStudentPhone?.toLowerCase().includes(term) ||
        tx.id.toString().includes(term)
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, activeTab, paymentMethodFilter, searchTerm])

  const exportTransactions = async () => {
    if (!stallId) return
    
    try {
      await api.downloadFile(`/stall-owner/transactions/export/${stallId}`, "stall_transactions.csv")
    } catch (error) {
      console.error("Failed to export:", error)
    }
  }

  const getTransactionIcon = (direction: string) => {
    return direction === "INCOMING" ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    )
  }

  const getTransactionColor = (direction: string) => {
    return direction === "INCOMING" ? "text-green-600" : "text-red-600"
  }

  const getDirectionBadge = (direction: string) => {
    return direction === "INCOMING" ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <ArrowDownLeft className="mr-1 h-3 w-3" />
        Incoming
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <ArrowUpRight className="mr-1 h-3 w-3" />
        Outgoing
      </Badge>
    )
  }

  const getOtherParty = (tx: Transaction) => {
    if (tx.direction === "INCOMING") {
      return {
        name: tx.fromStudentName,
        phone: tx.fromStudentPhone,
        type: "Student"
      }
    } else {
      return {
        name: tx.toStallName || tx.toStudentName,
        phone: tx.toStudentPhone,
        type: tx.toStallName ? "Stall" : "Student"
      }
    }
  }

  const incomingCount = transactions.filter(tx => tx.direction === "INCOMING").length
  const outgoingCount = transactions.filter(tx => tx.direction === "OUTGOING").length
  const totalIncoming = transactions
    .filter(tx => tx.direction === "INCOMING")
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalOutgoing = transactions
    .filter(tx => tx.direction === "OUTGOING")
    .reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">View all stall transactions</p>
        </div>
        <Button onClick={exportTransactions} variant="outline" size="sm" className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incoming</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalIncoming)}</div>
            <p className="text-xs text-muted-foreground">{incomingCount} transactions</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outgoing</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(totalOutgoing)}</div>
            <p className="text-xs text-muted-foreground">{outgoingCount} transactions</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${totalIncoming - totalOutgoing >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalIncoming - totalOutgoing)}
            </div>
            <p className="text-xs text-muted-foreground">{transactions.length} total transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="QR">QR Code</SelectItem>
                <SelectItem value="PHONE">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="text-xs sm:text-sm">All ({transactions.length})</TabsTrigger>
              <TabsTrigger value="incoming" className="text-xs sm:text-sm">Incoming ({incomingCount})</TabsTrigger>
              <TabsTrigger value="outgoing" className="text-xs sm:text-sm">Outgoing ({outgoingCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">ID</TableHead>
                        <TableHead className="min-w-[100px]">Direction</TableHead>
                        <TableHead className="min-w-[150px]">Other Party</TableHead>
                        <TableHead className="min-w-[100px]">Amount</TableHead>
                        <TableHead className="min-w-[80px]">Type</TableHead>
                        <TableHead className="min-w-[100px]">Payment</TableHead>
                        <TableHead className="min-w-[120px]">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTransactions.map((tx) => {
                          const otherParty = getOtherParty(tx)
                          return (
                            <TableRow key={tx.id}>
                              <TableCell className="font-mono text-xs sm:text-sm">#{tx.id}</TableCell>
                              <TableCell>{getDirectionBadge(tx.direction)}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{otherParty.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {otherParty.phone} • {otherParty.type}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={`font-semibold flex items-center gap-1 ${getTransactionColor(tx.direction)}`}>
                                  {getTransactionIcon(tx.direction)}
                                  {formatCurrency(tx.amount)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">{tx.transactionType}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">{tx.paymentMethod}</TableCell>
                              <TableCell className="text-xs sm:text-sm">{new Date(tx.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  )
}
