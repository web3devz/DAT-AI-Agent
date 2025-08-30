// Contract addresses and ABIs
export const DAT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DAT_CONTRACT_ADDRESS || ""

export const DAT_ABI = [
  "function createSubscriptionTier(string name, uint256 duration, uint256 price, uint256 usageQuota, address[] contributors, uint256[] revenueShares)",
  "function mintDAT(uint256 tierId) payable",
  "function hasValidSubscription(address user) view returns (bool, uint256)",
  "function consumeUsage(address user, uint256 amount)",
  "function getUserSubscription(address user) view returns (bool, uint256, uint256, uint256, string)",
  "function subscriptionTiers(uint256) view returns (string, uint256, uint256, uint256, bool)",
  "function tierCount() view returns (uint256)",
  "event DATMinted(address indexed user, uint256 indexed tokenId, uint256 tierId)",
  "event UsageConsumed(address indexed user, uint256 indexed tokenId, uint256 amount)",
] as const

export const SUBSCRIPTION_TIERS = {
  TRIAL: { id: 1, name: "7-Day Trial", duration: 7 * 24 * 60 * 60, price: "0.01", quota: 50 },
  MONTHLY: { id: 2, name: "Monthly Access", duration: 30 * 24 * 60 * 60, price: "0.1", quota: 1000 },
  LIFETIME: { id: 3, name: "Lifetime Access", duration: 365 * 24 * 60 * 60 * 10, price: "1.0", quota: 999999 },
}
