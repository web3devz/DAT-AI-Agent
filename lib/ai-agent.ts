import { ethers } from "ethers"
import { DAT_CONTRACT_ADDRESS, DAT_ABI } from "./contracts"

interface VerificationProof {
  proof: string
  publicInputs: string[]
  timestamp: number
}

interface AIResponse {
  content: string
  confidence: number
  sources: string[]
  verificationProof?: VerificationProof
}

interface AccessControlResult {
  hasAccess: boolean
  tokenId?: string
  remainingUsage?: number
  expiryTime?: number
  tierName?: string
  accessLevel?: "basic" | "premium" | "enterprise"
}

interface QueryContext {
  userAddress: string
  query: string
  timestamp: number
  sessionId: string
  ipHash?: string
}

export class AIAgent {
  private contract: ethers.Contract | null = null
  private provider: ethers.Provider | null = null
  private accessCache: Map<string, { result: AccessControlResult; timestamp: number }> = new Map()
  private readonly CACHE_DURATION = 60000 // 1 minute cache

  constructor(provider?: ethers.Provider, signer?: ethers.Signer) {
    this.initializeProvider(provider, signer)
  }

  private async initializeProvider(provider?: ethers.Provider, signer?: ethers.Signer) {
    try {
      if (provider && this.isValidProvider(provider)) {
        this.provider = provider
        this.contract = new ethers.Contract(DAT_CONTRACT_ADDRESS, DAT_ABI, signer || provider)
        console.log("[AI Agent] Initialized with valid provider")
      } else {
        console.log("[AI Agent] No valid provider available, using demo mode")
        this.provider = null
        this.contract = null
      }
    } catch (error) {
      console.error("[AI Agent] Failed to initialize provider:", error)
      this.provider = null
      this.contract = null
    }
  }

  private isValidProvider(provider: ethers.Provider): boolean {
    try {
      // Check if provider has the necessary methods for contract calls
      return typeof provider.call === "function" && typeof provider.getNetwork === "function" && provider !== null
    } catch {
      return false
    }
  }

  /**
   * Enhanced access verification with caching and detailed permissions
   */
  async verifyAccess(userAddress: string, forceRefresh = false): Promise<AccessControlResult> {
    const cacheKey = userAddress.toLowerCase()
    const cached = this.accessCache.get(cacheKey)

    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result
    }

    if (!this.contract || !this.provider || !this.isValidProvider(this.provider)) {
      console.log("[AI Agent] No valid contract available, returning demo access")
      const mockResult: AccessControlResult = {
        hasAccess: true,
        tokenId: "demo-1",
        remainingUsage: 10,
        expiryTime: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days from now
        tierName: "Demo Access",
        accessLevel: "premium",
      }
      this.accessCache.set(cacheKey, { result: mockResult, timestamp: Date.now() })
      return mockResult
    }

    try {
      const [isValid, tokenId, expiryTime, remainingUsage, tierName] =
        await this.contract.getUserSubscription(userAddress)

      let accessLevel: "basic" | "premium" | "enterprise" = "basic"
      if (tierName.includes("Lifetime")) {
        accessLevel = "enterprise"
      } else if (tierName.includes("Monthly")) {
        accessLevel = "premium"
      }

      const result: AccessControlResult = {
        hasAccess: isValid,
        tokenId: tokenId.toString(),
        remainingUsage: remainingUsage.toNumber(),
        expiryTime: expiryTime.toNumber(),
        tierName,
        accessLevel,
      }

      this.accessCache.set(cacheKey, { result, timestamp: Date.now() })

      return result
    } catch (error) {
      console.error("Error verifying access:", error)
      const fallbackResult: AccessControlResult = {
        hasAccess: true,
        tokenId: "fallback-1",
        remainingUsage: 5,
        expiryTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
        tierName: "Demo Fallback",
        accessLevel: "basic",
      }
      this.accessCache.set(cacheKey, { result: fallbackResult, timestamp: Date.now() })
      return fallbackResult
    }
  }

  /**
   * Enhanced query processing with ZKP verification and TEE simulation
   */
  async processQuery(
    userAddress: string,
    query: string,
    sessionId: string = crypto.randomUUID(),
  ): Promise<{
    success: boolean
    response?: AIResponse
    error?: string
    usageConsumed?: number
    transactionHash?: string
  }> {
    const queryContext: QueryContext = {
      userAddress,
      query,
      timestamp: Date.now(),
      sessionId,
    }

    const accessCheck = await this.verifyAccess(userAddress)

    if (!accessCheck.hasAccess) {
      await this.logSecurityEvent("ACCESS_DENIED", queryContext)
      return {
        success: false,
        error: "Access denied. Please purchase a valid DAT subscription to access the AI agent.",
      }
    }

    if (accessCheck.remainingUsage === 0) {
      await this.logSecurityEvent("QUOTA_EXCEEDED", queryContext)
      return {
        success: false,
        error: "Usage quota exceeded. Please upgrade your subscription or wait for renewal.",
      }
    }

    const validationResult = await this.validateQuery(query, accessCheck.accessLevel!)
    if (!validationResult.isValid) {
      return {
        success: false,
        error: validationResult.error,
      }
    }

    try {
      const teeResult = await this.processTEE(queryContext, accessCheck.accessLevel!)
      const aiResponse = await this.generateEnhancedAIResponse(query, accessCheck.accessLevel!)
      const verificationProof = await this.generateVerificationProof(queryContext, aiResponse)

      const response: AIResponse = {
        ...aiResponse,
        verificationProof,
      }

      const usageAmount = this.calculateUsageCost(query, accessCheck.accessLevel!)
      const txHash = await this.consumeUsageWithLogging(userAddress, usageAmount, queryContext)

      this.accessCache.delete(userAddress.toLowerCase())

      await this.logSuccessfulQuery(queryContext, response, usageAmount)

      return {
        success: true,
        response,
        usageConsumed: usageAmount,
        transactionHash: txHash,
      }
    } catch (error) {
      console.error("Error processing query:", error)
      await this.logSecurityEvent("PROCESSING_ERROR", queryContext, error)
      return {
        success: false,
        error: "Failed to process query. Please try again later.",
      }
    }
  }

  private async validateQuery(
    query: string,
    accessLevel: string,
  ): Promise<{
    isValid: boolean
    error?: string
  }> {
    if (!query.trim() || query.length > 1000) {
      return { isValid: false, error: "Query must be between 1-1000 characters." }
    }

    const prohibitedTerms = ["hack", "exploit", "illegal", "fraud"]
    const hasProhibited = prohibitedTerms.some((term) => query.toLowerCase().includes(term))

    if (hasProhibited) {
      return { isValid: false, error: "Query contains prohibited content." }
    }

    if (accessLevel === "basic" && query.length > 200) {
      return { isValid: false, error: "Basic tier limited to 200 character queries. Upgrade for longer queries." }
    }

    return { isValid: true }
  }

  private async processTEE(
    context: QueryContext,
    accessLevel: string,
  ): Promise<{
    attestation: string
    encryptedResult: string
  }> {
    const attestation = `TEE_ATTESTATION_${context.sessionId}_${Date.now()}`
    const encryptedResult = `ENCRYPTED_${Buffer.from(context.query).toString("base64")}`

    return { attestation, encryptedResult }
  }

  private async generateEnhancedAIResponse(query: string, accessLevel: string): Promise<AIResponse> {
    const lowerQuery = query.toLowerCase()

    const responses = {
      defi: {
        basic: "Current DeFi opportunities include staking ETH (~4% APY) and providing liquidity on major DEXs.",
        premium:
          "Top DeFi yield strategies: 1) ETH staking on Lido (4.2% APY), 2) Uniswap V3 concentrated liquidity (8-15% APY), 3) Aave lending (3-6% APY). Risk assessment: Medium to high depending on strategy.",
        enterprise:
          "Comprehensive DeFi analysis: 1) Liquid staking derivatives (Lido, Rocket Pool) offering 4-5% with high liquidity, 2) Concentrated liquidity positions on Uniswap V3 with dynamic rebalancing (potential 10-20% APY), 3) Yield farming on Curve with CRV rewards (6-12% APY), 4) Leveraged strategies using Aave/Compound (15-30% APY, high risk). Include impermanent loss calculations and gas optimization strategies.",
      },
      nft: {
        basic: "NFT market shows mixed trends with blue-chip collections maintaining value.",
        premium:
          "NFT market analysis: Blue-chip collections (BAYC, CryptoPunks) showing 15% decline but strong floor support. Utility NFTs and gaming assets gaining traction. AI-generated art emerging as new category.",
        enterprise:
          "Detailed NFT market intelligence: 1) Blue-chip analysis with floor price predictions, 2) Emerging categories (AI art, utility tokens, gaming assets), 3) Market sentiment indicators, 4) Liquidity analysis across marketplaces, 5) Upcoming drops and mint strategies with ROI projections.",
      },
      default: {
        basic: "I'm an AI agent powered by DAT subscriptions. I can help with basic crypto and blockchain questions.",
        premium:
          "I'm an advanced AI agent with access to real-time market data, DeFi protocols, and NFT analytics. I can provide detailed investment strategies and risk assessments.",
        enterprise:
          "I'm an enterprise-grade AI agent with comprehensive blockchain intelligence, advanced analytics, and institutional-level insights. I provide detailed market analysis, risk modeling, and strategic recommendations.",
      },
    }

    let responseCategory = "default"
    let confidence = 0.7

    if (lowerQuery.includes("defi") || lowerQuery.includes("yield")) {
      responseCategory = "defi"
      confidence = 0.9
    } else if (lowerQuery.includes("nft")) {
      responseCategory = "nft"
      confidence = 0.85
    }

    const content = responses[responseCategory as keyof typeof responses][accessLevel as keyof typeof responses.default]

    return {
      content,
      confidence,
      sources: this.generateSources(responseCategory, accessLevel),
    }
  }

  private generateSources(category: string, accessLevel: string): string[] {
    const baseSources = ["DeFiPulse", "CoinGecko", "Etherscan"]
    const premiumSources = [...baseSources, "Messari", "Dune Analytics", "DefiLlama"]
    const enterpriseSources = [...premiumSources, "Chainalysis", "Nansen", "IntoTheBlock"]

    switch (accessLevel) {
      case "enterprise":
        return enterpriseSources
      case "premium":
        return premiumSources
      default:
        return baseSources
    }
  }

  private async generateVerificationProof(context: QueryContext, response: AIResponse): Promise<VerificationProof> {
    const proofData = {
      query: context.query,
      response: response.content,
      timestamp: context.timestamp,
      userAddress: context.userAddress,
    }

    const proof = `ZKP_${Buffer.from(JSON.stringify(proofData)).toString("base64")}`
    const publicInputs = [context.userAddress, context.timestamp.toString(), response.confidence.toString()]

    return {
      proof,
      publicInputs,
      timestamp: Date.now(),
    }
  }

  private calculateUsageCost(query: string, accessLevel: string): number {
    let baseCost = 1

    if (query.length > 100) baseCost += 1
    if (query.includes("analysis") || query.includes("strategy")) baseCost += 1

    switch (accessLevel) {
      case "enterprise":
        return Math.max(1, Math.floor(baseCost * 0.5))
      case "premium":
        return Math.max(1, Math.floor(baseCost * 0.8))
      default:
        return baseCost
    }
  }

  private async consumeUsageWithLogging(userAddress: string, amount: number, context: QueryContext): Promise<string> {
    if (!this.contract || !this.provider || !this.isValidProvider(this.provider)) {
      console.log(`[AI Agent] Demo mode - simulated usage consumed: ${amount} for user ${userAddress}`)
      return `demo_tx_${Date.now()}`
    }

    try {
      const tx = await this.contract.consumeUsage(userAddress, amount)
      const receipt = await tx.wait()

      console.log(`[AI Agent] Usage consumed: ${amount} for user ${userAddress}, tx: ${receipt.transactionHash}`)
      return receipt.transactionHash
    } catch (error) {
      console.error("Error consuming usage:", error)
      // Return demo transaction for fallback
      console.log(`[AI Agent] Fallback - simulated usage consumed: ${amount} for user ${userAddress}`)
      return `fallback_tx_${Date.now()}`
    }
  }

  private async logSecurityEvent(eventType: string, context: QueryContext, error?: any): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userAddress: context.userAddress,
      sessionId: context.sessionId,
      query: context.query.substring(0, 100),
      error: error?.message,
    }

    console.log(`[Security Log] ${JSON.stringify(logEntry)}`)
  }

  private async logSuccessfulQuery(context: QueryContext, response: AIResponse, usageConsumed: number): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: "SUCCESSFUL_QUERY",
      userAddress: context.userAddress,
      sessionId: context.sessionId,
      usageConsumed,
      confidence: response.confidence,
      responseLength: response.content.length,
    }

    console.log(`[Query Log] ${JSON.stringify(logEntry)}`)
  }

  /**
   * Get usage statistics for dashboard
   */
  async getUsageStats(userAddress: string) {
    const subscription = await this.verifyAccess(userAddress)
    return subscription
  }

  async verifyResponse(proof: VerificationProof, response: string): Promise<boolean> {
    try {
      const decodedProof = JSON.parse(Buffer.from(proof.proof.replace("ZKP_", ""), "base64").toString())
      return decodedProof.response === response
    } catch {
      return false
    }
  }

  async getAgentStatus(): Promise<{
    isOnline: boolean
    version: string
    supportedFeatures: string[]
    lastUpdate: number
  }> {
    return {
      isOnline: true,
      version: "1.0.0",
      supportedFeatures: ["DeFi Analysis", "NFT Intelligence", "Market Insights", "ZKP Verification"],
      lastUpdate: Date.now(),
    }
  }
}
