"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, ChevronDown, ExternalLink, RefreshCw } from "lucide-react"
import { useWallet } from "@/hooks/use-wallet"
import { SUPPORTED_NETWORKS, type WalletProvider, WalletManager } from "@/lib/wallet" // Fixed import path to use correct wallet file and WalletManager class
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function WalletConnector() {
  const {
    isConnected,
    address,
    balance,
    chainId,
    provider,
    isConnecting,
    error,
    availableWallets,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    isValidNetwork,
    currentNetwork,
    walletInfo,
  } = useWallet()

  const [selectedWallet, setSelectedWallet] = useState<WalletProvider>("metamask")

  const handleConnect = async (walletProvider: WalletProvider) => {
    setSelectedWallet(walletProvider)
    await connect(walletProvider)
  }

  const handleNetworkSwitch = async (networkKey: string) => {
    await switchNetwork(networkKey)
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (bal: string) => {
    return Number.parseFloat(bal).toFixed(4)
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>Connect your wallet to access the DAT-powered AI agent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {availableWallets.length > 0 ? (
            <div className="space-y-2">
              {availableWallets.map((wallet) => {
                const info = WalletManager.getWalletInfo(wallet) // Use static method instead of instance method
                return (
                  <Button
                    key={wallet}
                    onClick={() => handleConnect(wallet)}
                    disabled={isConnecting}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <span className="mr-2">{info.icon}</span>
                    {isConnecting && selectedWallet === wallet ? "Connecting..." : info.name}
                  </Button>
                )
              })}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">No wallet detected</p>
              <div className="space-y-2">
                <Button variant="outline" asChild>
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Install MetaMask <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Connected
          </div>
          <Button variant="outline" size="sm" onClick={disconnect}>
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Wallet Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Address:</span>
            <Badge variant="secondary" className="font-mono">
              {formatAddress(address!)}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatBalance(balance)} ETH</span>
              <Button variant="ghost" size="sm" onClick={refreshBalance} className="h-6 w-6 p-0">
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Wallet:</span>
            <div className="flex items-center gap-2">
              <span>{walletInfo?.icon}</span>
              <span className="text-sm">{walletInfo?.name}</span>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network:</span>
            <div className="flex items-center gap-2">
              <Badge variant={isValidNetwork ? "default" : "destructive"}>
                {currentNetwork?.chainName || `Chain ${chainId}`}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(SUPPORTED_NETWORKS).map(([key, network]) => (
                    <DropdownMenuItem key={key} onClick={() => handleNetworkSwitch(key)}>
                      {network.chainName}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!isValidNetwork && (
            <Alert variant="destructive">
              <AlertDescription>Please switch to a supported network to use the AI agent.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
