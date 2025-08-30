"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DollarSign, Users, Activity, TrendingUp, RefreshCw, Download, Eye } from "lucide-react"
import { BillingManager, type BillingStats, type UserBilling } from "@/lib/billing"
import { useWallet } from "@/hooks/use-wallet"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface BillingDashboardProps {
  userAddress?: string
  isAdmin?: boolean
}

export function BillingDashboard({ userAddress, isAdmin = false }: BillingDashboardProps) {
  const { provider } = useWallet()
  const [billingManager, setBillingManager] = useState<BillingManager | null>(null)
  const [billingStats, setBillingStats] = useState<BillingStats | null>(null)
  const [userBilling, setUserBilling] = useState<UserBilling | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [realTimeEvents, setRealTimeEvents] = useState<any[]>([])

  useEffect(() => {
    if (provider) {
      const manager = new BillingManager(provider)
      setBillingManager(manager)
      loadBillingData(manager)

      // Subscribe to real-time events
      const unsubscribe = manager.subscribeToEvents((event) => {
        setRealTimeEvents((prev) => [event, ...prev.slice(0, 9)]) // Keep last 10 events
      })

      return unsubscribe
    }
  }, [provider, userAddress])

  const loadBillingData = async (manager: BillingManager) => {
    setIsLoading(true)
    try {
      const [stats, userBill] = await Promise.all([
        isAdmin ? manager.getBillingStats() : Promise.resolve(null),
        userAddress ? manager.getUserBilling(userAddress) : Promise.resolve(null),
      ])

      setBillingStats(stats)
      setUserBilling(userBill)
    } catch (error) {
      console.error("Error loading billing data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = () => {
    if (billingManager) {
      billingManager.clearCache()
      loadBillingData(billingManager)
    }
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading billing data...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Billing Dashboard</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "System-wide billing analytics" : "Your usage and billing information"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue={isAdmin ? "overview" : "usage"} className="space-y-4">
        <TabsList>
          {isAdmin && <TabsTrigger value="overview">Overview</TabsTrigger>}
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        {/* Admin Overview */}
        {isAdmin && billingStats && (
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(billingStats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{billingStats.activeSubscriptions}</div>
                  <p className="text-xs text-muted-foreground">+5 new this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{billingStats.totalUsage.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">queries processed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Usage/User</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{billingStats.averageUsagePerUser.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">queries per user</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Daily Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue & Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={billingStats.dailyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue ($)" />
                      <Line type="monotone" dataKey="usage" stroke="#82ca9d" name="Usage" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Revenue by Tier */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Tier</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(billingStats.revenueByTier).map(([tier, revenue]) => ({
                          name: tier,
                          value: revenue,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(billingStats.revenueByTier).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          {userBilling && (
            <>
              {/* User Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(userBilling.totalSpent)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Total Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userBilling.totalUsage}</div>
                    <p className="text-xs text-muted-foreground">queries processed</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Active Subscriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userBilling.subscriptionHistory.filter((s) => s.status === "active").length}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subscription History */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscription History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userBilling.subscriptionHistory.map((sub, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{sub.tierName}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(sub.purchaseDate)} - {formatDate(sub.expiryDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.status === "active" ? "default" : "secondary"}>{sub.status}</Badge>
                          <span className="font-medium">{formatCurrency(sub.cost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
              <CardDescription>How revenue is shared among contributors based on DAT token rules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">40%</div>
                    <div className="text-sm text-muted-foreground">Dataset Providers</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">35%</div>
                    <div className="text-sm text-muted-foreground">Model Creators</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-purple-600">25%</div>
                    <div className="text-sm text-muted-foreground">Infrastructure</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Revenue sharing is automatically enforced by DAT smart contracts based on contribution ratios.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Real-time Events
              </CardTitle>
              <CardDescription>Live billing and usage events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {realTimeEvents.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Waiting for events...</div>
                ) : (
                  realTimeEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div>
                        <Badge variant="outline" className="mr-2">
                          {event.type}
                        </Badge>
                        User {event.data.userAddress.slice(0, 6)}...{event.data.userAddress.slice(-4)}
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(event.data.timestamp * 1000).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
