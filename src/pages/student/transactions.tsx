import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, ArrowUpRight, ArrowDownLeft, Store, Users, Filter } from "lucide-react"
import { formatCurrency } from "@/lib/currency"
import { useAccountUpdateListener } from "@/lib/realtime"

interface Transaction {
  id: number
  amount: number
  transactionType: string // STALL or STUDENT
  direction: string // SENT or RECEIVED
  paymentMethod: string
  toStallName?: string | null
  toStudentName?: string | null
  fromStudentName?: string | null
  eventName: string
  createdAt: string
}

export default function StudentTransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  const [studentId, setStudentId] = useState<number | null>(null)

  // Get student ID from user profile
  const fetchStudentInfo = useCallback(async () => {
    if (!user?.userId || !user?.eventId) {
      return
    }

    try {
      const response = await api.get<any>(`/student/profile/${user.userId}/${user.eventId}`)
      setStudentId(response.id)
    } catch (error) {
      console.error("Failed to fetch student info:", error)
    }
  }, [user?.eventId, user?.userId])

  const fetchTransactions = useCallback(async () => {
    if (!studentId) return

    try {
      setLoading(true)
      const data = await api.get<Transaction[]>(`/student/history/${studentId}`)
      setTransactions(data)
      setFilteredTransactions(data)
    } catch (error) {
      console.error("Failed to fetch transactions:", error)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    void fetchStudentInfo()
  }, [fetchStudentInfo])

  useEffect(() => {
    if (studentId) {
      void fetchTransactions()
    }
  }, [fetchTransactions, studentId])

  useAccountUpdateListener(() => {
    if (studentId) {
      void fetchTransactions()
    } else {
      void fetchStudentInfo()
    }
  })

  // Filter transactions based on search, tab, and payment method
  useEffect(() => {
    let filtered = transactions

    // Filter by direction/type (tab)
    if (activeTab !== "all") {
      if (activeTab === "sent") {
        filtered = filtered.filter(tx => tx.direction === "SENT")
      } else if (activeTab === "received") {
        filtered = filtered.filter(tx => tx.direction === "RECEIVED")
      } else if (activeTab === "purchases") {
        filtered = filtered.filter(tx => tx.transactionType === "STALL")
      } else if (activeTab === "transfers") {
        filtered = filtered.filter(tx => tx.transactionType === "STUDENT")
      }
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
        tx.toStallName?.toLowerCase().includes(term) ||
        tx.toStudentName?.toLowerCase().includes(term) ||
        tx.id.toString().includes(term)
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, activeTab, paymentMethodFilter, searchTerm])

  const exportTransactions = async () => {
    const csvContent = "Type,Direction,Details,Amount,Date\n" + 
      transactions.map(tx => {
        const details = getOtherParty(tx)
        const amountStr = `${tx.direction === "RECEIVED" ? "+" : "-"}${formatCurrency(tx.amount)}`
        return `${tx.transactionType},${tx.direction},${details.name},${amountStr},${new Date(tx.createdAt).toLocaleString()}`
      }).join("\n")
    
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "my_transactions.csv")
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const getTransactionIcon = (tx: Transaction) => {
    if (tx.direction === "RECEIVED") {
      return <ArrowDownLeft className="h-4 w-4 text-green-600" />
    } else if (tx.transactionType === "STALL") {
      return <Store className="h-4 w-4 text-red-600" />
    } else {
      return <ArrowUpRight className="h-4 w-4 text-red-600" />
    }
  }

  const getTransactionColor = (direction: string) => {
    return direction === "RECEIVED" ? "text-green-600" : "text-red-600"
  }

  const getDirectionBadge = (tx: Transaction) => {
    if (tx.direction === "RECEIVED") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <ArrowDownLeft className="mr-1 h-3 w-3" />
          Received
        </Badge>
      )
    } else if (tx.transactionType === "STALL") {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <Store className="mr-1 h-3 w-3" />
          Purchase
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          <ArrowUpRight className="mr-1 h-3 w-3" />
          Transfer
        </Badge>
      )
    }
  }

  const getOtherParty = (tx: Transaction) => {
    if (tx.direction === "RECEIVED") {
      return {
        name: tx.fromStudentName || "Unknown",
        type: "Student"
      }
    } else if (tx.transactionType === "STALL") {
      return {
        name: tx.toStallName || "Unknown Stall",
        type: "Stall"
      }
    } else {
      return {
        name: tx.toStudentName || "Unknown",
        type: "Student"
      }
    }
  }

  const sentCount = transactions.filter(tx => tx.direction === "SENT").length
  const receivedCount = transactions.filter(tx => tx.direction === "RECEIVED").length
  const purchaseCount = transactions.filter(tx => tx.transactionType === "STALL").length
  const transferCount = transactions.filter(tx => tx.transactionType === "STUDENT").length
  
  const totalSent = transactions
    .filter(tx => tx.direction === "SENT")
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalReceived = transactions
    .filter(tx => tx.direction === "RECEIVED")
    .reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Transactions</h1>
          <p className="text-muted-foreground">View your complete transaction history</p>
        </div>
        <Button onClick={exportTransactions} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSent)}</div>
            <p className="text-xs text-muted-foreground">{sentCount} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</div>
            <p className="text-xs text-muted-foreground">{receivedCount} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Flow</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalReceived - totalSent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalReceived - totalSent)}
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
                placeholder="Search by name or transaction ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-[180px]">
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
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
              <TabsTrigger value="sent">Sent ({sentCount})</TabsTrigger>
              <TabsTrigger value="received">Received ({receivedCount})</TabsTrigger>
              <TabsTrigger value="purchases">Purchases ({purchaseCount})</TabsTrigger>
              <TabsTrigger value="transfers">Transfers ({transferCount})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((tx) => {
                        const otherParty = getOtherParty(tx)
                        return (
                          <TableRow key={tx.id}>
                            <TableCell>#{tx.id}</TableCell>
                            <TableCell>{getDirectionBadge(tx)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{otherParty.name}</p>
                                <p className="text-sm text-muted-foreground">{otherParty.type}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={`font-semibold flex items-center gap-1 ${getTransactionColor(tx.direction)}`}>
                                {getTransactionIcon(tx)}
                                {tx.direction === "RECEIVED" ? "+" : "-"}
                                {formatCurrency(tx.amount)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{tx.paymentMethod}</Badge>
                            </TableCell>
                            <TableCell>{new Date(tx.createdAt).toLocaleString()}</TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
