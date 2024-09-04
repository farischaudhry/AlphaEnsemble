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
    console.log(`Asset prices updated for assets: ${assets}, prices: ${prices}`);
    const instrumentData = assets.map((asset, index) => ({
      asset,
      price: ethers.formatUnits(prices[index], 8),
    }));
    updateInstrumentOverview(instrumentData);
  });

  // Poll for PositionsUpdated events
  const positionsUpdatedEvents = await contract.queryFilter("PositionsUpdated", lastCheckedBlock, latestBlock);
  positionsUpdatedEvents.forEach((event) => {
    const { agentID, assets, positions } = event.args;
    console.log(`Positions updated for agentID: ${agentID}, assets: ${assets}, positions: ${positions}`);
    const leaderboardEntry = {
      team: `team-${agentID}`,
      position: positions.reduce((total, pos) => total + parseFloat(pos), 0),
    };
    updateLeaderboard(leaderboardEntry);
  });

  // Poll for PnLUpdated events
  const pnlUpdatedEvents = await contract.queryFilter("PnLUpdated", lastCheckedBlock, latestBlock);
  pnlUpdatedEvents.forEach((event) => {
    const { agentID, pnl } = event.args;
    console.log(`PnL updated for agentID: ${agentID}, pnl: ${pnl}`);
    const leaderboardEntry = {
      team: `team-${agentID}`,
      pnl: parseFloat(pnl),
    };
    updateLeaderboard(leaderboardEntry);
  });

  const oracleCallbackEvents = await contract.queryFilter("OracleResponseCallback", lastCheckedBlock, latestBlock);
  oracleCallbackEvents.forEach((event) => {
      const { agentRunId, response, errorMessage } = event.args;
      console.log(`Oracle response for agentRunId: ${agentRunId}, response: ${response}, errorMessage: ${errorMessage}`);
  });

  // Poll for AgentRunStarted events
  const agentRunStartedEvents = await contract.queryFilter("AgentRunStarted", lastCheckedBlock, latestBlock);
  agentRunStartedEvents.forEach((event) => {
      const { agentRunId, agentId, query } = event.args;
      console.log(`Agent run started for agentRunId: ${agentRunId}, agentID: ${agentId}, query: ${query}`);
  });

  // Update the last checked block to the latest block
  lastCheckedBlock = latestBlock + 1;
}
