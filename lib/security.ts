export class SecurityManager {
  private static instance: SecurityManager
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map()
  private suspiciousAddresses: Set<string> = new Set()

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  /**
   * Rate limiting per user address
   */
  checkRateLimit(
    userAddress: string,
    maxRequests = 10,
    windowMs = 60000,
  ): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const key = userAddress.toLowerCase()
    const current = this.rateLimitMap.get(key)

    if (!current || now > current.resetTime) {
      // Reset or initialize
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
    }

    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime }
    }

    current.count++
    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
    }
  }

  /**
   * Mark address as suspicious for monitoring
   */
  flagSuspiciousAddress(address: string, reason: string): void {
    this.suspiciousAddresses.add(address.toLowerCase())
    console.log(`[Security] Flagged address ${address} for: ${reason}`)
  }

  /**
   * Check if address is flagged as suspicious
   */
  isSuspiciousAddress(address: string): boolean {
    return this.suspiciousAddresses.has(address.toLowerCase())
  }

  /**
   * Validate Ethereum address format
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  /**
   * Generate secure session ID
   */
  generateSecureSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`
  }
}
