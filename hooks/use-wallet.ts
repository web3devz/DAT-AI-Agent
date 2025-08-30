"use client"

import { useState, useEffect, useCallback } from "react"
import { walletManager, type WalletState, type WalletProvider, WalletManager } from "@/lib/wallet"

export function useWallet() {
  const [state, setState] = useState<WalletState>(walletManager.getState())
  const [availableWallets, setAvailableWallets] = useState<WalletProvider[]>([])

  useEffect(() => {
    // Initialize available wallets
    setAvailableWallets(WalletManager.detectAvailableWallets())

    // Set up event listeners
    const handleStateChange = (newState: WalletState) => {
      setState(newState)
    }

    walletManager.on("stateChanged", handleStateChange)
    walletManager.on("connected", handleStateChange)
    walletManager.on("disconnected", handleStateChange)

    // Try auto-connect on mount
    walletManager.autoConnect()

    return () => {
      walletManager.off("stateChanged", handleStateChange)
      walletManager.off("connected", handleStateChange)
      walletManager.off("disconnected", handleStateChange)
    }
  }, [])

  const connect = useCallback(async (provider: WalletProvider = "metamask") => {
    return await walletManager.connectWallet(provider)
  }, [])

  const disconnect = useCallback(async () => {
    await walletManager.disconnect()
  }, [])

  const switchNetwork = useCallback(async (networkKey: string) => {
    return await walletManager.switchToNetwork(networkKey)
  }, [])

  const sendTransaction = useCallback(
    async (transaction: {
      to: string
      value?: string
      data?: string
      gasLimit?: string
    }) => {
      return await walletManager.sendTransaction(transaction)
    },
    [],
  )

  const refreshBalance = useCallback(async () => {
    if (state.address) {
      return await walletManager.updateBalance(state.address)
    }
    return "0"
  }, [state.address])

  return {
    // State
    ...state,
    availableWallets,

    // Actions
    connect,
    disconnect,
    switchNetwork,
    sendTransaction,
    refreshBalance,

    // Utilities
    isValidNetwork: walletManager.isValidNetwork(state.chainId || 0),
    currentNetwork: walletManager.getCurrentNetwork(),
    walletInfo: state.provider ? WalletManager.getWalletInfo(state.provider) : null,
  }
}
