# Subscription AI Agent with DAT Billing

A blockchain-powered AI agent system that uses Data Anchoring Tokens (DAT) for subscription management and automatic revenue sharing among contributors.

## Overview

This project implements a sophisticated AI agent with blockchain-based access control using DAT (Data Anchoring Token) — a semi-fungible token standard that encodes ownership certificates, usage rights, and value sharing for AI datasets and models. The system provides tiered access to AI services with automatic billing and revenue distribution.

## Features

### 🤖 AI Agent with Access Control
- **Tiered Subscriptions**: Basic, Premium, and Enterprise tiers with different capabilities
- **ZKP Verification**: Zero-knowledge proof simulation for privacy-preserving access control
- **TEE Processing**: Trusted Execution Environment simulation for secure AI computations
- **Rate Limiting**: Usage-based throttling and quota management
- **Caching**: Intelligent response caching for improved performance

### 🔗 Blockchain Integration
- **DAT Smart Contracts**: Semi-fungible tokens for subscription management
- **Multi-Wallet Support**: MetaMask, Coinbase Wallet, and other injected wallets
- **Network Management**: Automatic network switching and validation
- **Transaction Monitoring**: Real-time transaction status tracking

### 📊 Billing & Analytics
- **Usage Tracking**: Comprehensive query and usage statistics
- **Revenue Analytics**: Real-time revenue distribution visualization
- **Subscription Management**: Tier upgrades and subscription monitoring
- **Event Logging**: On-chain activity tracking and audit trails

### 🎨 Modern UI/UX
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live data synchronization and status updates
- **Interactive Charts**: Revenue and usage analytics visualization
- **Wallet Integration**: Seamless wallet connection and management

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask or compatible Web3 wallet
- Access to Ethereum testnet (Sepolia recommended)

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd subscription-ai-agent
   npm install


2. **Configure environment variables**:

   ```bash
   # Add to your Vercel project or .env.local
   NEXT_PUBLIC_DAT_CONTRACT_ADDRESS=0x...  # Your deployed DAT contract address
   ```

3. **Deploy smart contracts** (optional - for development):

   ```bash
   # Deploy the DataAnchoringToken contract to your preferred network
   # Update NEXT_PUBLIC_DAT_CONTRACT_ADDRESS with the deployed address
   ```

4. **Start development server**:

   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### For End Users

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred wallet
2. **Purchase Subscription**: Choose a tier (Basic/Premium/Enterprise) and mint DAT tokens
3. **Query AI Agent**: Use the AI interface to ask questions and receive responses
4. **Monitor Usage**: View your usage statistics and remaining quota in the dashboard

### For Developers

#### Smart Contract Integration

```typescript
import { DATContract } from '@/lib/contracts';

// Check user subscription
const subscription = await DATContract.getSubscription(userAddress);

// Mint new subscription
await DATContract.mintSubscription(tier, duration, { value: price });
```

#### AI Agent Usage

```typescript
import { AIAgent } from '@/lib/ai-agent';

const agent = new AIAgent(provider);
const response = await agent.query(userAddress, "Your question here");
```

## Architecture

### Smart Contracts

* **DataAnchoringToken.sol**: Main DAT contract implementing ERC-1155 with subscription logic
* **Access Control**: Tier-based permissions and usage tracking
* **Revenue Sharing**: Automatic distribution among contributors

### Backend Services

* **AI Agent**: Core AI processing with access control
* **Billing System**: Usage tracking and subscription management
* **Security Layer**: ZKP verification and TEE processing simulation

### Frontend Components

* **Wallet Integration**: Multi-wallet support with React hooks
* **Dashboard**: Real-time analytics and subscription management
* **AI Interface**: Chat-like interface for AI interactions

## Subscription Tiers

| Tier           | Price    | Queries/Day | Features                                                 |
| -------------- | -------- | ----------- | -------------------------------------------------------- |
| **Basic**      | 0.01 ETH | 10          | Standard responses, basic support                        |
| **Premium**    | 0.05 ETH | 100         | Enhanced responses, priority support, analytics          |
| **Enterprise** | 0.1 ETH  | 1000        | Premium responses, dedicated support, advanced analytics |

## Development

### Project Structure

```
├── contracts/              # Smart contracts
│   └── DataAnchoringToken.sol
├── lib/                    # Core utilities
│   ├── ai-agent.ts        # AI agent logic
│   ├── contracts.ts       # Contract interactions
│   ├── wallet.ts          # Wallet management
│   └── billing.ts         # Billing utilities
├── components/            # React components
│   ├── wallet-connector.tsx
│   ├── billing-dashboard.tsx
│   └── revenue-analytics.tsx
├── hooks/                 # Custom React hooks
│   └── use-wallet.ts
└── app/                   # Next.js app router
    └── page.tsx           # Main application
```

### Key Technologies

* **Frontend**: Next.js 14, React, Tailwind CSS, TypeScript
* **Blockchain**: Ethers.js, ERC-1155 (DAT tokens)
* **Charts**: Recharts for analytics visualization
* **Wallet**: Multi-wallet support with automatic detection

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Security Considerations

* **Smart Contract Auditing**: Ensure contracts are audited before mainnet deployment
* **Private Key Management**: Never expose private keys in client-side code
* **Rate Limiting**: Implement proper rate limiting to prevent abuse
* **Input Validation**: Validate all user inputs and AI queries

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

* Create an issue in this repository
