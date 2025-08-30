"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Wallet,
  Bot,
  Shield,
  Coins,
  BarChart3,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  Github,
  ExternalLink,
} from "lucide-react"
import { WalletConnector } from "@/components/wallet-connector"
import { BillingDashboard } from "@/components/billing-dashboard"
import { useWallet } from "@/hooks/use-wallet"
import { AIAgent } from "@/lib/ai-agent"
import { ethers } from "ethers"
import { DAT_CONTRACT_ADDRESS, DAT_ABI, SUBSCRIPTION_TIERS } from "@/lib/contracts"

export default function HomePage() {
  const { isConnected, address, provider, isValidNetwork } = useWallet()

  const [aiAgent, setAiAgent] = useState<AIAgent | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [query, setQuery] = useState("")
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("demo")

  useEffect(() => {
    if (isConnected && provider && address) {
      try {
        const agent = new AIAgent(provider, provider.getSigner?.())
        setAiAgent(agent)
        loadSubscription(agent)
      } catch (error) {
        console.error("Failed to initialize AI agent:", error)
        // Initialize without provider for demo purposes
        const agent = new AIAgent()
        setAiAgent(agent)
        loadSubscription(agent)
      }
    } else {
      const agent = new AIAgent()
      setAiAgent(agent)
      if (address) {
        loadSubscription(agent)
      }
    }
  }, [isConnected, provider, address])

  const loadSubscription = async (agent: AIAgent) => {
    if (!address) return
    try {
      const subData = await agent.getUsageStats(address)
      setSubscription(subData)
    } catch (error) {
      console.error("Failed to load subscription:", error)
      // Set mock subscription for demo
      setSubscription({
        hasAccess: false,
        remainingUsage: 0,
        tierName: "No Subscription",
      })
    }
  }

  const mintDAT = async (tierId: number, price: string) => {
    if (!aiAgent || !provider) return

    setIsLoading(true)
    try {
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(DAT_CONTRACT_ADDRESS, DAT_ABI, signer)

      const tx = await contract.mintDAT(tierId, {
        value: ethers.parseEther(price),
      })

      await tx.wait()
      alert("DAT minted successfully! You now have access to the AI agent.")
      if (aiAgent) loadSubscription(aiAgent)
    } catch (error) {
      console.error("Minting error:", error)
      alert("Failed to mint DAT. Please try again.")
    }
    setIsLoading(false)
  }

  const processQuery = async () => {
    if (!aiAgent || !query.trim() || !address) return

    setIsLoading(true)
    setResponse("")

    const result = await aiAgent.processQuery(address, query)

    if (result.success) {
      setResponse(result.response || "")
      if (aiAgent) loadSubscription(aiAgent)
    } else {
      setResponse(`Error: ${result.error}`)
    }

    setIsLoading(false)
  }

  const demoQueries = [
    "What are the top DeFi yield strategies right now?",
    "Analyze the current NFT market trends",
    "Explain how blockchain consensus mechanisms work",
    "What are the risks of liquidity mining?",
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DAT AI Agent</h1>
                <p className="text-sm text-gray-600">Blockchain-Powered Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden md:flex">
                <Shield className="h-3 w-3 mr-1" />
                ZKP Verified
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Subscription-Based AI with DAT Billing</h2>
              <p className="text-lg text-gray-600 max-w-2xl">
                Experience the future of AI access control with Data Anchoring Tokens. Secure, verifiable, and
                revenue-sharing blockchain AI.
              </p>
            </div>

            <TabsList className="grid w-full sm:w-auto grid-cols-4">
              <TabsTrigger value="demo">Demo</TabsTrigger>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="docs">Docs</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
          </div>

          {/* Demo Tab */}
          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Wallet & Subscription */}
              <div className="space-y-6">
                <WalletConnector />

                {/* Subscription Status */}
                {isConnected && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Access Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subscription?.hasAccess ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <Badge variant="default">Active Subscription</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tier:</span>
                              <span className="font-medium">{subscription.tierName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Remaining:</span>
                              <span className="font-medium">{subscription.remainingUsage} queries</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Expires:</span>
                              <span className="font-medium">
                                {new Date(subscription.expiryTime * 1000).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Alert>
                            <AlertDescription>Purchase a DAT subscription to access the AI agent</AlertDescription>
                          </Alert>

                          <div className="space-y-3">
                            {Object.values(SUBSCRIPTION_TIERS).map((tier) => (
                              <Card key={tier.id} className="border-2 hover:border-blue-200 transition-colors">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold">{tier.name}</h4>
                                    <Badge variant="outline">{tier.quota} queries</Badge>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-blue-600">{tier.price} TON</span>
                                    <Button
                                      onClick={() => mintDAT(tier.id, tier.price)}
                                      disabled={isLoading || !isValidNetwork}
                                      size="sm"
                                    >
                                      {isLoading ? "Minting..." : "Purchase"}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - AI Interface */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Agent Interface */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Agent Query Interface
                    </CardTitle>
                    <CardDescription>
                      Ask about DeFi strategies, NFT trends, blockchain insights, and more
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Demo Queries */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Try these examples:</label>
                      <div className="flex flex-wrap gap-2">
                        {demoQueries.map((demoQuery, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => setQuery(demoQuery)}
                            className="text-xs"
                          >
                            {demoQuery.slice(0, 30)}...
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Query Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask me about DeFi yield strategies, NFT trends, or blockchain insights..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && processQuery()}
                        className="flex-1"
                      />
                      <Button
                        onClick={processQuery}
                        disabled={isLoading || !query.trim() || !subscription?.hasAccess}
                        className="px-6"
                      >
                        {isLoading ? (
                          "Processing..."
                        ) : (
                          <>
                            Ask AI <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Response */}
                    {response && (
                      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Bot className="h-5 w-5 text-blue-600" />
                            AI Response
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{response}</p>
                          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              ZKP Verified
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              TEE Secured
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              On-chain Logged
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Access Required Message */}
                    {!subscription?.hasAccess && isConnected && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>Purchase a DAT subscription above to unlock AI agent access</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* Features Showcase */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Verifiable AI</h3>
                      <p className="text-sm text-gray-600">
                        Every response verified with zero-knowledge proofs and TEE execution
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <Coins className="h-8 w-8 text-green-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Revenue Sharing</h3>
                      <p className="text-sm text-gray-600">
                        Automatic distribution among dataset providers and model creators
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center">
                    <CardContent className="pt-6">
                      <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                      <h3 className="font-semibold mb-2">Usage Tracking</h3>
                      <p className="text-sm text-gray-600">Complete transparency with on-chain logging and analytics</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {isConnected ? (
              <BillingDashboard userAddress={address} isAdmin={false} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Wallet className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Connect Wallet Required</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Connect your wallet to view your billing dashboard and usage statistics
                  </p>
                  <Button onClick={() => setActiveTab("demo")}>Go to Demo Tab</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Guide</CardTitle>
                  <CardDescription>Get started with DAT-powered AI in minutes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">Connect Your Wallet</h4>
                        <p className="text-sm text-gray-600">Use MetaMask or any Web3 wallet to connect</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">Purchase DAT Subscription</h4>
                        <p className="text-sm text-gray-600">Choose from trial, monthly, or lifetime access</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">Query the AI Agent</h4>
                        <p className="text-sm text-gray-600">Ask questions and get verified AI responses</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-6 w-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">Track Usage & Billing</h4>
                        <p className="text-sm text-gray-600">Monitor your usage and revenue sharing</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Architecture</CardTitle>
                  <CardDescription>How DAT tokens enable secure AI access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Data Anchoring Tokens (DAT)
                      </h4>
                      <p className="text-sm text-gray-600">
                        Semi-fungible tokens that encode ownership, usage rights, and revenue sharing
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Zero-Knowledge Proofs
                      </h4>
                      <p className="text-sm text-gray-600">Every AI response is cryptographically verifiable</p>
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        TEE Execution
                      </h4>
                      <p className="text-sm text-gray-600">Trusted Execution Environment ensures secure processing</p>
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        <Coins className="h-4 w-4" />
                        Automatic Revenue Sharing
                      </h4>
                      <p className="text-sm text-gray-600">Smart contracts distribute earnings to all contributors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
                <CardDescription>Integration endpoints and smart contract interfaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-mono text-sm font-semibold mb-2">Smart Contract</h4>
                    <p className="font-mono text-xs text-gray-600 mb-2">Address: {DAT_CONTRACT_ADDRESS || "0x..."}</p>
                    <div className="space-y-1 text-xs">
                      <div>
                        <code>mintDAT(uint256 tierId)</code> - Purchase subscription
                      </div>
                      <div>
                        <code>hasValidSubscription(address user)</code> - Check access
                      </div>
                      <div>
                        <code>consumeUsage(address user, uint256 amount)</code> - Track usage
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://docs.lazai.network" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        LazAI Docs
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href="https://diary.duckchain.io" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        DuckChain Docs
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About DAT AI Agent</CardTitle>
                <CardDescription>The future of subscription-based AI with blockchain billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  This project demonstrates a revolutionary approach to AI access control using Data Anchoring Tokens
                  (DAT). Built for the hackathon, it showcases how blockchain technology can create fair, transparent,
                  and verifiable AI services with automatic revenue sharing.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Key Features</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        DAT-based subscription management
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Zero-knowledge proof verification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Automatic revenue distribution
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        On-chain usage tracking
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Multi-tier access control
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Technology Stack</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>• Next.js 15 + TypeScript</li>
                      <li>• Ethereum Smart Contracts</li>
                      <li>• LazAI Network Integration</li>
                      <li>• DuckChain AI Module</li>
                      <li>• Ethers.js + Web3 Wallets</li>
                      <li>• Tailwind CSS + shadcn/ui</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-4 mt-6">
                  <h4 className="font-semibold mb-3">Hackathon Deliverables</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">✅ Smart Contracts</h5>
                      <p className="text-xs text-gray-600">DAT minting, validation, and revenue sharing</p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">✅ AI Agent</h5>
                      <p className="text-xs text-gray-600">Access control with ZKP + TEE integration</p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">✅ Frontend Demo</h5>
                      <p className="text-xs text-gray-600">Complete user interface with wallet integration</p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">✅ Billing Dashboard</h5>
                      <p className="text-xs text-gray-600">Real-time analytics and revenue tracking</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Bot className="h-4 w-4" />
              Built for the Hackathon • Powered by LazAI & DuckChain
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <a href="https://docs.lazai.network" target="_blank" rel="noopener noreferrer">
                  LazAI Network
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="https://diary.duckchain.io" target="_blank" rel="noopener noreferrer">
                  DuckChain
                </a>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
