# 🔷 ETH Command Center

All-in-one Ethereum Dashboard - Monitor nodes, explore blocks, inspect accounts, track transactions, and analyze gas fees.

![ETH Command Center](https://img.shields.io/badge/Ethereum-Dashboard-6366f1?style=for-the-badge&logo=ethereum)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite)
![JavaScript](https://img.shields.io/badge/Vanilla-JS-F7DF1E?style=for-the-badge&logo=javascript)

## ✨ Features

### 🌐 Tab A - Node & Network
- Connection status with real-time latency
- Client version, Network ID, Chain ID
- Peer count monitoring
- SHA3 (Keccak-256) hash demo

### 📦 Tab B - Chain & Blocks
- Latest block information
- Block search by number or hash
- Transaction count per block
- Gas used/limit display

### 👛 Tab C - Accounts
- ETH balance lookup
- Transaction count (nonce)
- Account type detection (EOA vs Contract)
- Storage slot reader

### 💸 Tab D - Transactions
- Transaction hash lookup
- Receipt & logs viewer
- `eth_call` simulator
- Gas estimation

### 📋 Tab E - Logs & Events
- `eth_getLogs` query builder
- Filter creation (logs, blocks, pending tx)
- Live polling mode

### ⛽ Tab F - Gas & Fees
- Slow/Normal/Fast recommendations
- EIP-1559 base fee history chart
- Legacy gas price display

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/it2kvku/ETH-Command-Center.git
cd ETH-Command-Center
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` and add your Ethereum RPC URL:
```env
VITE_RPC_URL=https://your-rpc-provider.com/api-key
```

### 4. Run development server
```bash
npm run dev
```

Open http://localhost:5173

## 🔧 Supported RPC Methods

| Category | Methods |
|----------|---------|
| **Web3** | `web3_clientVersion`, `web3_sha3` |
| **Net** | `net_version`, `net_listening`, `net_peerCount` |
| **Chain** | `eth_chainId`, `eth_blockNumber` |
| **Blocks** | `eth_getBlockByNumber`, `eth_getBlockByHash`, `eth_getBlockTransactionCountByNumber` |
| **Accounts** | `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode`, `eth_getStorageAt` |
| **Transactions** | `eth_getTransactionByHash`, `eth_getTransactionReceipt`, `eth_call`, `eth_estimateGas` |
| **Logs** | `eth_getLogs`, `eth_newFilter`, `eth_getFilterChanges`, `eth_uninstallFilter` |
| **Gas** | `eth_gasPrice`, `eth_feeHistory`, `eth_maxPriorityFeePerGas` |

## 📁 Project Structure

```
ETH-Command-Center/
├── index.html          # Main HTML with 6 tabs
├── src/
│   ├── main.js         # App entry point
│   ├── style.css       # Dark theme design system
│   ├── rpc.js          # RPC client & capability scanner
│   ├── utils.js        # Utility functions
│   └── tabs/
│       ├── nodeNetwork.js    # Tab A
│       ├── chainBlocks.js    # Tab B
│       ├── accounts.js       # Tab C
│       ├── transactions.js   # Tab D
│       ├── logsEvents.js     # Tab E
│       └── gasFees.js        # Tab F
├── .env.example        # Environment template
└── package.json
```

## 🎨 Tech Stack

- **Build**: Vite
- **Language**: Vanilla JavaScript (ES6+)
- **Styling**: Custom CSS with glassmorphism
- **Charts**: Chart.js
- **Fonts**: Inter, JetBrains Mono

## 📄 License

MIT License - feel free to use this project for learning or building your own tools!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
