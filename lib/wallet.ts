import { ethers } from "ethers"

export type WalletProvider = "metamask" | "walletconnect" | "coinbase" | "injected"

export interface WalletState {
  isConnected: boolean
  address: string | null
  balance: string
  chainId: number | null
  provider: WalletProvider | null
  isConnecting: boolean
  error: string | null
}

export interface NetworkConfig {
  chainId: string
  chainName: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  rpcUrls: string[]
  blockExplorerUrls: string[]
}

export const SUPPORTED_NETWORKS: Record<string, NetworkConfig> = {
  ethereum: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.infura.io/v3/"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  sepolia: {
    chainId: "0xaa36a7",
    chainName: "Sepolia Testnet",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://sepolia.infura.io/v3/"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
  polygon: {
    chainId: "0x89",
    chainName: "Polygon Mainnet",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com/"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
}

export class WalletManager {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null
  private listeners: Map<string, Function[]> = new Map()
  private state: WalletState = {
    isConnected: false,
    address: null,
    balance: "0",
    chainId: null,
    provider: null,
    isConnecting: false,
    error: null,
  }

  constructor() {
    this.initializeEventListeners()
  }

  private initializeEventListeners() {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", this.handleAccountsChanged.bind(this))
      window.ethereum.on("chainChanged", this.handleChainChanged.bind(this))
      window.ethereum.on("disconnect", this.handleDisconnect.bind(this))
    }
  }

  private handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.disconnect()
    } else if (accounts[0] !== this.state.address) {
      this.updateState({ address: accounts[0] })
      this.updateBalance(accounts[0])
    }
    this.emit("accountsChanged", accounts)
  }

  private handleChainChanged(chainId: string) {
    const numericChainId = Number.parseInt(chainId, 16)
    this.updateState({ chainId: numericChainId })
    this.emit("chainChanged", numericChainId)
  }

  private handleDisconnect() {
    this.disconnect()
    this.emit("disconnect")
  }

  private updateState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates }
    this.emit("stateChanged", this.state)
  }

  private emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event) || []
    eventListeners.forEach((listener) => listener(data))
  }

  public on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  public off(event: string, listener: Function) {
    const eventListeners = this.listeners.get(event) || []
    const index = eventListeners.indexOf(listener)
    if (index > -1) {
      eventListeners.splice(index, 1)
    }
  }

  async connectWallet(preferredProvider: WalletProvider = "metamask"): Promise<{
    success: boolean
    address?: string
    error?: string
  }> {
    this.updateState({ isConnecting: true, error: null })

    try {
      if (typeof window === "undefined") {
        throw new Error("Window object not available")
      }

      let ethereum = window.ethereum

      // Handle multiple wallet providers
      if (preferredProvider === "metamask" && window.ethereum?.isMetaMask) {
        ethereum = window.ethereum
      } else if (preferredProvider === "coinbase" && window.ethereum?.isCoinbaseWallet) {
        ethereum = window.ethereum
      } else if (!ethereum) {
        throw new Error(`${preferredProvider} wallet not found. Please install the wallet extension.`)
      }

      // Request account access
      const accounts = await ethereum.request({ method: "eth_requestAccounts" })

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found")
      }

      this.provider = new ethers.BrowserProvider(ethereum)
      this.signer = await this.provider.getSigner()
      const address = await this.signer.getAddress()
      const network = await this.provider.getNetwork()

      this.updateState({
        isConnected: true,
        address,
        chainId: Number(network.chainId),
        provider: preferredProvider,
        isConnecting: false,
      })

      await this.updateBalance(address)
      this.emit("connected", { address, chainId: Number(network.chainId) })

      return { success: true, address }
    } catch (error: any) {
      console.error("Wallet connection error:", error)
      const errorMessage = this.getErrorMessage(error)

      this.updateState({
        isConnecting: false,
        error: errorMessage,
      })

      return { success: false, error: errorMessage }
    }
  }

  private getErrorMessage(error: any): string {
    if (error.code === 4001) {
      return "Connection rejected by user"
    } else if (error.code === -32002) {
      return "Connection request already pending"
    } else if (error.message?.includes("User rejected")) {
      return "Connection rejected by user"
    } else if (error.message?.includes("not found")) {
      return error.message
    } else {
      return "Failed to connect wallet. Please try again."
    }
  }

  async disconnect() {
    this.provider = null
    this.signer = null

    this.updateState({
      isConnected: false,
      address: null,
      balance: "0",
      chainId: null,
      provider: null,
      error: null,
    })

    this.emit("disconnected")
  }

  async updateBalance(address: string): Promise<string> {
    if (!this.provider || !address) return "0"

    try {
      const balance = await this.provider.getBalance(address)
      const formattedBalance = ethers.formatEther(balance)

      this.updateState({ balance: formattedBalance })
      return formattedBalance
    } catch (error) {
      console.error("Error getting balance:", error)
      return "0"
    }
  }

  async getBalance(address: string): Promise<string> {
    return this.updateBalance(address)
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider
  }

  getState(): WalletState {
    return { ...this.state }
  }

  async switchToNetwork(networkKey: string): Promise<boolean> {
    if (!window.ethereum) return false

    const network = SUPPORTED_NETWORKS[networkKey]
    if (!network) {
      console.error(`Unsupported network: ${networkKey}`)
      return false
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      })
      return true
    } catch (error: any) {
      // If network doesn't exist, try to add it
      if (error.code === 4902) {
        return this.addNetwork(network)
      }
      console.error("Network switch error:", error)
      return false
    }
  }

  async addNetwork(network: NetworkConfig): Promise<boolean> {
    if (!window.ethereum) return false

    try {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [network],
      })
      return true
    } catch (error) {
      console.error("Add network error:", error)
      return false
    }
  }

  async sendTransaction(transaction: {
    to: string
    value?: string
    data?: string
    gasLimit?: string
  }): Promise<{
    success: boolean
    hash?: string
    error?: string
  }> {
    if (!this.signer) {
      return { success: false, error: "Wallet not connected" }
    }

    try {
      const tx = await this.signer.sendTransaction({
        to: transaction.to,
        value: transaction.value ? ethers.parseEther(transaction.value) : undefined,
        data: transaction.data,
        gasLimit: transaction.gasLimit,
      })

      this.emit("transactionSent", { hash: tx.hash, transaction })

      // Wait for confirmation
      const receipt = await tx.wait()
      this.emit("transactionConfirmed", { hash: tx.hash, receipt })

      return { success: true, hash: tx.hash }
    } catch (error: any) {
      console.error("Transaction error:", error)
      const errorMessage = this.getErrorMessage(error)
      this.emit("transactionError", { error: errorMessage, transaction })

      return { success: false, error: errorMessage }
    }
  }

  static detectAvailableWallets(): WalletProvider[] {
    const available: WalletProvider[] = []

    if (typeof window !== "undefined" && window.ethereum) {
      if (window.ethereum.isMetaMask) {
        available.push("metamask")
      }
      if (window.ethereum.isCoinbaseWallet) {
        available.push("coinbase")
      }
      if (!window.ethereum.isMetaMask && !window.ethereum.isCoinbaseWallet) {
        available.push("injected")
      }
    }

    return available
  }

  static getWalletInfo(provider: WalletProvider): {
    name: string
    icon: string
    downloadUrl: string
  } {
    const walletInfo = {
      metamask: {
        name: "MetaMask",
        icon: "🦊",
        downloadUrl: "https://metamask.io/download/",
      },
      coinbase: {
        name: "Coinbase Wallet",
        icon: "🔵",
        downloadUrl: "https://www.coinbase.com/wallet",
      },
      walletconnect: {
        name: "WalletConnect",
        icon: "🔗",
        downloadUrl: "https://walletconnect.com/",
      },
      injected: {
        name: "Injected Wallet",
        icon: "💼",
        downloadUrl: "",
      },
    }

    return walletInfo[provider]
  }

  async autoConnect(): Promise<boolean> {
    if (typeof window === "undefined" || !window.ethereum) {
      return false
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" })

      if (accounts && accounts.length > 0) {
        const result = await this.connectWallet()
        return result.success
      }
    } catch (error) {
      console.error("Auto-connect error:", error)
    }

    return false
  }

  isValidNetwork(chainId: number): boolean {
    const supportedChainIds = Object.values(SUPPORTED_NETWORKS).map((network) => Number.parseInt(network.chainId, 16))
    return supportedChainIds.includes(chainId)
  }

  getCurrentNetwork(): NetworkConfig | null {
    if (!this.state.chainId) return null

    const hexChainId = `0x${this.state.chainId.toString(16)}`
    return Object.values(SUPPORTED_NETWORKS).find((network) => network.chainId === hexChainId) || null
  }
}

// Global wallet instance
export const walletManager = new WalletManager()
