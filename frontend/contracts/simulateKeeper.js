const { ethers } = require("ethers");
const AlphaEnsembleABI = require("./AlphaEnsembleABI.json");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_GALADRIEL_RPC_URL);
  const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY_GALADRIEL, provider);
  const contract = new ethers.Contract(process.env.NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS, AlphaEnsembleABI, wallet);

  // Function to check upkeep and perform if needed
  async function simulateKeeper() {
      try {
          console.log('Checking upkeep...');
          const [upkeepNeeded, performData] = await contract.checkUpkeep("0x");

          if (upkeepNeeded) {
              console.log('Upkeep is needed. Calling performUpkeep...');
              const tx = await contract.performUpkeep(performData);
              console.log(`performUpkeep called, transaction: ${tx.hash}`);
              await tx.wait(); // Wait for the transaction to be mined
              console.log('Transaction confirmed');
          } else {
              console.log('No upkeep needed.');
          }
      } catch (error) {
          console.error('Error during upkeep simulation:', error);
      }
  }

  // Call simulateKeeper every minute
  setInterval(simulateKeeper, 60000);  // 60,000 ms = 1 minute
}

// Start the simulation
main().catch((error) => {
  console.error("Error:", error);
});
