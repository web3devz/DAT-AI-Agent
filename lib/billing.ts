import { ethers } from "ethers"
import { DAT_CONTRACT_ADDRESS, DAT_ABI } from "./contracts"

export interface UsageEvent {
  id: string
  userAddress: string
  tokenId: string
  usageAmount: number
  timestamp: number
  transactionHash: string
  queryType: string
  cost: number
}

export interface RevenueEvent {
  id: string
  tokenId: string
  amount: number
  timestamp: number
  transactionHash: string
  contributors: string[]
  shares: number[]
}

export interface BillingStats {
  totalRevenue: number
  totalUsage: number
  activeSubscriptions: number
  averageUsagePerUser: number
  revenueByTier: Record<string, number>
  usageByTier: Record<string, number>
  dailyStats: Array<{
    date: string
    revenue: number
    usage: number
    newSubscriptions: number
  }>
}

export interface UserBilling {
  address: string
  totalSpent: number
  totalUsage: number
  subscriptionHistory: Array<{
    tokenId: string
    tierName: string
    purchaseDate: number
    expiryDate: number
    cost: number
    status: "active" | "expired" | "cancelled"
  }>
  usageHistory: UsageEvent[]
}

export class BillingManager {
  private contract: ethers.Contract
  private provider: ethers.Provider
  private eventCache: Map<string, any[]> = new Map()

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider
    this.contract = new ethers.Contract(DAT_CONTRACT_ADDRESS, DAT_ABI, signer || provider)
  }

  /**
   * Get comprehensive billing statistics
   */
  async getBillingStats(fromBlock = 0): Promise<BillingStats> {
    try {
      const [usageEvents, revenueEvents, mintEvents] = await Promise.all([
        this.getUsageEvents(fromBlock),
        this.getRevenueEvents(fromBlock),
        this.getMintEvents(fromBlock),
      ])

      const totalRevenue = revenueEvents.reduce((sum, event) => sum + event.amount, 0)
      const totalUsage = usageEvents.reduce((sum, event) => sum + event.usageAmount, 0)
      const activeSubscriptions = await this.getActiveSubscriptionsCount()

      const revenueByTier: Record<string, number> = {}
      const usageByTier: Record<string, number> = {}

      // Group by tier (simplified - in production, fetch tier info from contract)
      mintEvents.forEach((event) => {
        const tierName = `Tier ${event.tierId}`
        revenueByTier[tierName] = (revenueByTier[tierName] || 0) + event.cost
      })

      usageEvents.forEach((event) => {
        const tierName = `Tier ${event.tokenId}` // Simplified
        usageByTier[tierName] = (usageByTier[tierName] || 0) + event.usageAmount
      })

      const dailyStats = this.generateDailyStats(usageEvents, revenueEvents, mintEvents)

      return {
        totalRevenue,
        totalUsage,
        activeSubscriptions,
        averageUsagePerUser: totalUsage / Math.max(mintEvents.length, 1),
        revenueByTier,
        usageByTier,
        dailyStats,
      }
    } catch (error) {
      console.error("Error fetching billing stats:", error)
      return this.getEmptyStats()
    }
  }

  /**
   * Get user-specific billing information
   */
  async getUserBilling(userAddress: string): Promise<UserBilling> {
    try {
      const [usageEvents, mintEvents] = await Promise.all([
        this.getUserUsageEvents(userAddress),
        this.getUserMintEvents(userAddress),
      ])

      const totalSpent = mintEvents.reduce((sum, event) => sum + event.cost, 0)
      const totalUsage = usageEvents.reduce((sum, event) => sum + event.usageAmount, 0)

      const subscriptionHistory = mintEvents.map((event) => ({
        tokenId: event.tokenId,
        tierName: `Tier ${event.tierId}`,
        purchaseDate: event.timestamp,
        expiryDate: event.timestamp + 30 * 24 * 60 * 60, // Simplified
        cost: event.cost,
        status: Date.now() / 1000 < event.timestamp + 30 * 24 * 60 * 60 ? "active" : ("expired" as const),
      }))

      return {
        address: userAddress,
        totalSpent,
        totalUsage,
        subscriptionHistory,
        usageHistory: usageEvents,
      }
    } catch (error) {
      console.error("Error fetching user billing:", error)
      return {
        address: userAddress,
        totalSpent: 0,
        totalUsage: 0,
        subscriptionHistory: [],
        usageHistory: [],
      }
    }
  }

  /**
   * Get usage events from contract logs
   */
  private async getUsageEvents(fromBlock = 0): Promise<UsageEvent[]> {
    const cacheKey = `usage_${fromBlock}`
    if (this.eventCache.has(cacheKey)) {
      return this.eventCache.get(cacheKey)!
    }

    try {
      const filter = this.contract.filters.UsageConsumed()
      const events = await this.contract.queryFilter(filter, fromBlock)

      const usageEvents: UsageEvent[] = events.map((event, index) => ({
        id: `usage_${event.blockNumber}_${index}`,
        userAddress: event.args?.user || "",
        tokenId: event.args?.tokenId?.toString() || "",
        usageAmount: event.args?.amount?.toNumber() || 0,
        timestamp: Date.now() / 1000, // Simplified - should get from block
        transactionHash: event.transactionHash,
        queryType: "ai_query",
        cost: event.args?.amount?.toNumber() || 0,
      }))

      this.eventCache.set(cacheKey, usageEvents)
      return usageEvents
    } catch (error) {
      console.error("Error fetching usage events:", error)
      return []
    }
  }

  /**
   * Get revenue events from contract logs
   */
  private async getRevenueEvents(fromBlock = 0): Promise<RevenueEvent[]> {
    const cacheKey = `revenue_${fromBlock}`
    if (this.eventCache.has(cacheKey)) {
      return this.eventCache.get(cacheKey)!
    }

    try {
      const filter = this.contract.filters.RevenueDistributed()
      const events = await this.contract.queryFilter(filter, fromBlock)

      const revenueEvents: RevenueEvent[] = events.map((event, index) => ({
        id: `revenue_${event.blockNumber}_${index}`,
        tokenId: event.args?.tokenId?.toString() || "",
        amount: Number.parseFloat(ethers.formatEther(event.args?.amount || 0)),
        timestamp: Date.now() / 1000,
        transactionHash: event.transactionHash,
        contributors: [], // Simplified
        shares: [],
      }))

      this.eventCache.set(cacheKey, revenueEvents)
      return revenueEvents
    } catch (error) {
      console.error("Error fetching revenue events:", error)
      return []
    }
  }

  /**
   * Get mint events from contract logs
   */
  private async getMintEvents(fromBlock = 0) {
    try {
      const filter = this.contract.filters.DATMinted()
      const events = await this.contract.queryFilter(filter, fromBlock)

      return events.map((event) => ({
        userAddress: event.args?.user || "",
        tokenId: event.args?.tokenId?.toString() || "",
        tierId: event.args?.tierId?.toNumber() || 0,
        timestamp: Date.now() / 1000,
        transactionHash: event.transactionHash,
        cost: 0.1, // Simplified - should calculate from tier
      }))
    } catch (error) {
      console.error("Error fetching mint events:", error)
      return []
    }
  }

  private async getUserUsageEvents(userAddress: string): Promise<UsageEvent[]> {
    const allEvents = await this.getUsageEvents()
    return allEvents.filter((event) => event.userAddress.toLowerCase() === userAddress.toLowerCase())
  }

  private async getUserMintEvents(userAddress: string) {
    const allEvents = await this.getMintEvents()
    return allEvents.filter((event) => event.userAddress.toLowerCase() === userAddress.toLowerCase())
  }

  private async getActiveSubscriptionsCount(): Promise<number> {
    // Simplified - in production, query contract for active subscriptions
    const mintEvents = await this.getMintEvents()
    return mintEvents.length
  }

  private generateDailyStats(usageEvents: UsageEvent[], revenueEvents: RevenueEvent[], mintEvents: any[]) {
    const dailyMap = new Map<string, { revenue: number; usage: number; newSubscriptions: number }>()

    // Process events by day
    const processEventsByDay = (events: any[], type: "revenue" | "usage" | "mint") => {
      events.forEach((event) => {
        const date = new Date(event.timestamp * 1000).toISOString().split("T")[0]

        if (!dailyMap.has(date)) {
          dailyMap.set(date, { revenue: 0, usage: 0, newSubscriptions: 0 })
        }

        const dayStats = dailyMap.get(date)!

        if (type === "revenue") {
          dayStats.revenue += event.amount
        } else if (type === "usage") {
          dayStats.usage += event.usageAmount
        } else if (type === "mint") {
          dayStats.newSubscriptions += 1
          dayStats.revenue += event.cost
        }
      })
    }

    processEventsByDay(revenueEvents, "revenue")
    processEventsByDay(usageEvents, "usage")
    processEventsByDay(mintEvents, "mint")

    return Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30) // Last 30 days
  }

  private getEmptyStats(): BillingStats {
    return {
      totalRevenue: 0,
      totalUsage: 0,
      activeSubscriptions: 0,
      averageUsagePerUser: 0,
      revenueByTier: {},
      usageByTier: {},
      dailyStats: [],
    }
  }

  /**
   * Clear event cache to force refresh
   */
  clearCache() {
    this.eventCache.clear()
  }

  /**
   * Get real-time billing events (WebSocket simulation)
   */
  subscribeToEvents(callback: (event: any) => void) {
    // Simulate real-time events
    const interval = setInterval(() => {
      const mockEvent = {
        type: "usage",
        data: {
          userAddress: "0x" + Math.random().toString(16).substr(2, 40),
          amount: Math.floor(Math.random() * 5) + 1,
          timestamp: Date.now() / 1000,
        },
      }
      callback(mockEvent)
    }, 10000) // Every 10 seconds

    return () => clearInterval(interval)
  }
}
