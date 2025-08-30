"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react"

interface RevenueAnalyticsProps {
  data: {
    totalRevenue: number
    monthlyGrowth: number
    contributorShares: Array<{
      name: string
      type: "dataset" | "model" | "infrastructure"
      share: number
      earnings: number
    }>
    revenueHistory: Array<{
      month: string
      revenue: number
      users: number
    }>
  }
}

export function RevenueAnalytics({ data }: RevenueAnalyticsProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "dataset":
        return "bg-blue-500"
      case "model":
        return "bg-green-500"
      case "infrastructure":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "dataset":
        return <Activity className="h-4 w-4" />
      case "model":
        return <TrendingUp className="h-4 w-4" />
      case "infrastructure":
        return <Users className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{data.monthlyGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.contributorShares.length}</div>
            <p className="text-xs text-muted-foreground">Active contributors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Share</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.contributorShares.reduce((sum, c) => sum + c.share, 0) / data.contributorShares.length).toFixed(1)}
              %
            </div>
            <p className="text-xs text-muted-foreground">Per contributor</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Growth</CardTitle>
          <CardDescription>Monthly revenue and user growth trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
                name="Revenue ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Contributor Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Distribution</CardTitle>
          <CardDescription>How revenue is shared among different contributor types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.contributorShares.map((contributor, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(contributor.type)}
                    <span className="font-medium">{contributor.name}</span>
                    <Badge variant="outline" className="capitalize">
                      {contributor.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${contributor.earnings.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">{contributor.share}%</div>
                  </div>
                </div>
                <Progress value={contributor.share} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["dataset", "model", "infrastructure"].map((type) => {
          const typeContributors = data.contributorShares.filter((c) => c.type === type)
          const totalShare = typeContributors.reduce((sum, c) => sum + c.share, 0)
          const totalEarnings = typeContributors.reduce((sum, c) => sum + c.earnings, 0)

          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getTypeIcon(type)}
                  {type} Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Share:</span>
                    <span className="font-medium">{totalShare.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Earnings:</span>
                    <span className="font-medium">${totalEarnings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contributors:</span>
                    <span className="font-medium">{typeContributors.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
