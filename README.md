# AlphaEnsemble 

## Description

AlphaEnsemble is an on-chain AI-driven financial agent system designed to optimize portfolios through agent-based competition. Each agent uses a large language model (LLM) for decision-making, dynamically adjusting positions based on real-time data and the behavior of other agents. The agents communicate via an oracle system, receiving instructions and updating their positions to maximize the effect of open information and on-chain trading transparency.

## Features

- **Decentralized Agents:** Each agent operates independently on-chain, interacting with other agents and the financial environment to optimize portfolio positions.
- **AI Integration:** Agents leverage LLMs (currently ChatGPT) via an oracle to dynamically update asset positions based on real-time market conditions and the behavior of competing agents.
- **Real-Time Updates:** Agents receive real-time market data using Binance price feed websockets so their strategies are based on up-to-date information. Agents continuously adjust their positions (long and short) to maximize overall PnL, accounting for transaction costs, market dynamics, and other agents’ positions.
- **Customizable Asset Choices:** The assets your agents interact with and their data sources can be customised. We provide a wide variety of asset pairs from Binance, offering flexibility in portfolio construction.
- **Configurable Update Intervals:** The frequency of LLM updates and price feed updates is fully customizable. You can adjust how often agents receive price data and rebalance their positions, or integrate with Chainlink Keepers for automatic updates.
- **Customizable Strategies:** Each agent can have a different strategy with custom optimization goals and risk constraints, allowing experimentation with diverse portfolio management techniques. This also includes position limits.
- **Flexible Agent Deployment:** You can specify the number of agents you want to deploy, providing control over the scale of your on-chain AI system.

## Setup Instructions

### Prerequisites

Before setting up the project, ensure you have the following:

- Node.js and npm installed
- A wallet with access to the Galadriel testnet
- The Galadriel oracle address

### Step 1: Clone the repository

```bash
git clone https://github.com/your-repo/alpha-ensemble.git
cd alpha-ensemble
```

### Step 2: Install dependencies

```bash
cd frontend
npm install
cd ../contracts
npm install
```

### Step 3: Configure environment variables

Create a .env.local file in the frontend directory with the following content:

```bash
NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS=""  # This will be updated automatically
NEXT_PUBLIC_GALADRIEL_RPC_URL="https://devnet.galadriel.com/"
GALADRIEL_CHAIN_ID=696969

NEXT_PUBLIC_PRIVATE_KEY_GALADRIEL="YOUR_PRIVATE_KEY"
ORACLE_ADDRESS="0x68EC9556830AD097D661Df2557FBCeC166a0A075"  # Galadriel oracle
PRIVATE_KEY_GALADRIEL="0x..."  # Your private key for deployment on Galadriel testnet
PRIVATE_KEY_LOCALHOST="0x..."  # Your private key for deployment on a local network
```

and a .env file in the config directory with the following content:

```bash
# Address of oracle deployed on Galadriel testnet. See https://docs.galadriel.com/oracle-address
# Updated to most recent version
ORACLE_ADDRESS="0x68EC9556830AD097D661Df2557FBCeC166a0A075"

# Private key to use for deployment on Galadriel testnet
PRIVATE_KEY_GALADRIEL="0x..."

# Private key to use for deployment on local network (not required for deployment)
PRIVATE_KEY_LOCALHOST="0x..."
```

Both files have templates found in their respective directories.


### Step 4: Deploy contracts

To deploy the AlphaEnsemble Contract, enter the contracts directory and run:

```bash
npm run deployGaladriel
```

The contract address will automatically be put into the .env.local config file.

### Step 5: Deploy Agents

Once the AlphaEnsemble contract is deployed, you can deploy agents using the scripts/deploy_agents.py script. Make sure the .env.local file is properly configured with the AlphaEnsemble address and private key.

Run the script as follows:

```bash
python scripts/deploy_agents.py
```

This script will interact with the AlphaEnsemble contract and deploy a specified number of agents with predefined strategies. You can also change the oracle address here if required.

### Step 6: Price Feed and LLM Calls

To continuously update asset prices and simulate LLM calls, use the scripts/price_feed_binance.py script. This script acts like a Chainlink Keeper, fetching live prices from Binance and pushing updates to the AlphaEnsemble contract.

Run the script as follows:

```bash
python scripts/price_feed_binance.py
```

### Step 7: Start the Frontend

Navigate to the frontend folder and start the Next.js frontend:

```bash
cd frontend
npm run dev
```

The frontend will be accessible at <http://localhost:3000>.

### Step 8: Monitor Agent Behavior

You can monitor agent positions and PnL via the frontend interface. Use the dashboard to view:

The overall PnL of all agents.
The positions held by each agent.
Updates from the Binance price feed.

### Step 9: Interact with the Contracts

You can interact with the contracts using the web3.js or ethers.js libraries in the Node.js environment, or directly using the deployed contract's ABI. The default location for ABIs is frontend/contracts directory.

Example interaction with the AlphaEnsemble contract:

```js
const AlphaEnsemble = new ethers.Contract(
  process.env.NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS,
  AlphaEnsembleABI,
  provider
);

// Fetch agent addresses
const agentAddresses = await AlphaEnsemble.getAgentContracts();
```
