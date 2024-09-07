import { ethers } from 'ethers';
import AlphaEnsembleABI from './AlphaEnsembleABI.json';
import AgentABI from './AgentABI.json';

let contract;
let provider;
let lastCheckedBlock = 0;
let agentContracts = [];

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

    // Get the addresses of all deployed agent contracts
    agentContracts = await contract.getAgentContracts();

    console.log("Subscribed to agent contracts: ", agentContracts);
  }
}

export async function pollEvents(updateInstrumentOverview, updateLeaderboard, updatePositionData, updatePnlData) {
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

  // Poll for PositionsUpdated events in the AlphaEnsemble contract (this will capture general updates)
  const positionsUpdatedEvents = await contract.queryFilter("PositionsUpdated", lastCheckedBlock, latestBlock);
  positionsUpdatedEvents.forEach((event) => {
    const { agentID, assets, positions } = event.args;
    console.log(`Positions updated for agentID: ${agentID}, assets: ${assets}, positions: ${positions}`);

    const positionData = {
      team: `team-${agentID}`,
      positions: assets.map((asset, index) => ({
        asset,
        position: positions[index],
      })),
    };
    updatePositionData(positionData);
  });

  // Poll for PnLUpdated events in the AlphaEnsemble contract (general updates)
  const pnlUpdatedEvents = await contract.queryFilter("PnLUpdated", lastCheckedBlock, latestBlock);
  pnlUpdatedEvents.forEach((event) => {
    const { agentID, pnl } = event.args;
    console.log(`PnL updated for agentID: ${agentID}, pnl: ${pnl}`);
    const leaderboardEntry = {
      team: `team-${agentID}`,
      pnl: ethers.formatUnits(pnl, 8),
    };
    updateLeaderboard(leaderboardEntry);
    updatePnlData(leaderboardEntry);
  });

  // // Poll for AgentRunStarted events in the AlphaEnsemble contract
  // const agentRunStartedEvents = await contract.queryFilter("AgentRunStarted", lastCheckedBlock, latestBlock);
  // agentRunStartedEvents.forEach((event) => {
  //   const { agentId, query } = event.args;
  //   console.log(`Agent run started for agentID: ${agentId}, query: ${query}`);
  // });

  // Subscribe to each agent's specific events (like PositionsUpdated and PnLUpdated)
  await subscribeToAgentEvents(updatePositionData, updateLeaderboard, updatePnlData, latestBlock);

  // Update the last checked block to the latest block
  lastCheckedBlock = latestBlock + 1;
}

async function subscribeToAgentEvents(updatePositionData, updateLeaderboard, updatePnlData, latestBlock) {
  // Loop through all agent contracts and subscribe to their events
  for (const agentAddress of agentContracts) {
    try {
      const agentContract = new ethers.Contract(agentAddress, AgentABI, provider);

      // Poll for PositionsUpdated events from agent contracts
      const positionsUpdatedEvents = await agentContract.queryFilter("PositionsUpdated", lastCheckedBlock, latestBlock);
      positionsUpdatedEvents.forEach((event) => {
        const { agentId, assets, positions } = event.args;
        console.log(`Positions updated for agentID: ${agentId}, assets: ${assets}, positions: ${positions}`);

        const positionData = {
          team: `team-${agentId}`,
          positions: assets.map((asset, index) => ({
            asset,
            position: positions[index],
          })),
        };
        updatePositionData(positionData);
      });

      // Poll for PnLUpdated events from agent contracts
      const pnlUpdatedEvents = await agentContract.queryFilter("PnLUpdated", lastCheckedBlock, latestBlock);
      pnlUpdatedEvents.forEach((event) => {
        const { agentId, pnl } = event.args;
        console.log(`PnL updated for agentID: ${agentId}, pnl: ${pnl}`);
        const leaderboardEntry = {
          team: `team-${agentId}`,
          pnl: ethers.formatUnits(pnl, 8),
        };
        updateLeaderboard(leaderboardEntry);
        updatePnlData(leaderboardEntry);
      });

      // Poll for OracleResponseCallback events from agent contracts
      const oracleResponseCallbackEvents = await agentContract.queryFilter("OracleResponseCallback", lastCheckedBlock, latestBlock);
      oracleResponseCallbackEvents.forEach((event) => {
        const { agentId, response, errorMessage } = event.args;
        console.log(`Oracle response received for agentID: ${agentId}, response: ${response}, errorMessage: ${errorMessage}`);
      });

    } catch (error) {
      console.error(`Error fetching events for agent ${agentAddress}:`, error);
    }
  }
}
