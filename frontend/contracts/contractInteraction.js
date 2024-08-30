// frontend/contracts/contractInteraction.js
import { ethers, WebSocketProvider } from 'ethers';
import AlphaEnsembleABI from './AlphaEnsembleABI.json';

// Temporary contract address for testing
const contractAddress = process.env.NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS;
const provider = new ethers.WebSocketProvider('ws://127.0.0.1:8545');
const signer = await provider.getSigner();

const contract = new ethers.Contract(contractAddress, AlphaEnsembleABI, signer);

export function listenToEvents(updateInstrumentOverview, updateLeaderboard) {
    // Listen for AssetPricesUpdated event
    contract.on("AssetPricesUpdated", (assets, prices) => {
        // Handle the event data and update the InstrumentOverview component
        const instrumentData = assets.map((asset, index) => ({
            asset,
            price: ethers.utils.formatUnits(prices[index], 18) // Adjust decimals as necessary
        }));
        updateInstrumentOverview(instrumentData);
    });

    // Listen for PositionsUpdated event
    contract.on("PositionsUpdated", (agentID, assets, positions) => {
        // Handle the event data and update the Leaderboard component
        const leaderboardEntry = {
            team: `team-${agentID}`,
            pnl: positions.reduce((total, pos) => total + parseFloat(pos), 0),
            position: positions.reduce((total, pos) => total + parseFloat(pos), 0),
        };
        updateLeaderboard(leaderboardEntry);
    });

    contract.on("PnLUpdated", (agentID, pnl) => {
        // Handle the event data and update the Leaderboard component
        const leaderboardEntry = {
            team: `team-${agentID}`,
            pnl: parseFloat(pnl),
        };
        updateLeaderboard(leaderboardEntry);
    });
}
