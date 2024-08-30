import { ethers } from 'ethers';
import AlphaEnsembleABI from './AlphaEnsembleABI.json';

let contract;
let provider;
let lastCheckedBlock = 0;

export async function initializeContract() {
  if (!contract) {
    // Connect to the Galadriel network using JsonRpcProvider
    provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_GALADRIEL_RPC_URL);

    // Use a specific wallet or account
    const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY_GALADRIEL, provider);

    // Initialize the contract with the wallet as the signer
    contract = new ethers.Contract(process.env.NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS, AlphaEnsembleABI, wallet);

    // Set the last checked block number to the current block
    lastCheckedBlock = await provider.getBlockNumber();
  }
}

export async function pollEvents(updateInstrumentOverview, updateLeaderboard) {
  if (!contract) {
    console.error('Contract is not initialized yet.');
    return;
  }

  const latestBlock = await provider.getBlockNumber();

  // Poll for AssetPricesUpdated events
  const assetPricesEvents = await contract.queryFilter("AssetPricesUpdated", lastCheckedBlock, latestBlock);
  assetPricesEvents.forEach((event) => {
    const { assets, prices } = event.args;
    const instrumentData = assets.map((asset, index) => ({
      asset,
      price: ethers.utils.formatUnits(prices[index], 18)  // Adjust decimals as necessary
    }));
    updateInstrumentOverview(instrumentData);
  });

  // Poll for PositionsUpdated events
  const positionsUpdatedEvents = await contract.queryFilter("PositionsUpdated", lastCheckedBlock, latestBlock);
  positionsUpdatedEvents.forEach((event) => {
    const { agentID, assets, positions } = event.args;
    const leaderboardEntry = {
      team: `team-${agentID}`,
      pnl: positions.reduce((total, pos) => total + parseFloat(pos), 0),
      position: positions.reduce((total, pos) => total + parseFloat(pos), 0),
    };
    updateLeaderboard(leaderboardEntry);
  });

  // Poll for PnLUpdated events
  const pnlUpdatedEvents = await contract.queryFilter("PnLUpdated", lastCheckedBlock, latestBlock);
  pnlUpdatedEvents.forEach((event) => {
    const { agentID, pnl } = event.args;
    const leaderboardEntry = {
      team: `team-${agentID}`,
      pnl: parseFloat(pnl),
    };
    updateLeaderboard(leaderboardEntry);
  });

  // Update the last checked block to the latest block + 1
  lastCheckedBlock = latestBlock + 1;
}
