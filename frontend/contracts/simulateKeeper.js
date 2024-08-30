const { ethers } = require("ethers");
const AlphaEnsembleABI = require("./AlphaEnsembleABI.json");
const MockV3AggregatorABI = require("./MockV3AggregatorABI.json");
const MockV3AggregatorBytecode = require("./MockV3AggregatorBytecode.json");

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS
  if (!contractAddress) {
    throw new Error("Contract address is not set in environment variables.");
  }

  // Set up a provider and signer
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_TEST_PRIVATE_KEY, provider);

  console.log("Deploying and setting mock price feeds...");

  // Deploy the MockV3Aggregator contract
  const MockV3Aggregator = new ethers.ContractFactory(MockV3AggregatorABI, MockV3AggregatorBytecode.bytecode, wallet);
  const mockPriceFeed = await MockV3Aggregator.deploy();
  await mockPriceFeed.waitForDeployment();

  console.log("Mock price feed deployed at:", mockPriceFeed.target);

  // Connect to the deployed contract
  const contract = new ethers.Contract(contractAddress, AlphaEnsembleABI, wallet);

  try {
    const txSetBTC = await contract.setPriceFeed("BTC", mockPriceFeed.target);
    await txSetBTC.wait();
    console.log("BTC price feed set.");

    const txSetETH = await contract.setPriceFeed("ETH", mockPriceFeed.target);
    await txSetETH.wait();
    console.log("ETH price feed set.");
  } catch (error) {
    console.error("Error setting price feeds:", error);
  }

  // Function to simulate Chainlink Keeper by calling the update functions periodically
  async function simulateKeepers() {
    console.log("Simulating Chainlink Keepers...");

    try {
      // Call the update functions
      const tx1 = await contract.updateAssetPrices();
      await tx1.wait();
      console.log("Asset prices updated.");

      // const tx2 = await contract.updatePositions();
      // await tx2.wait();
      // console.log("Positions updated.");
    } catch (error) {
      console.error("Error during keepers simulation:", error);
    }
  }

  // Set an interval to simulate periodic calls (e.g., every 15 seconds)
  setInterval(simulateKeepers, 15000); // 15000 ms = 15 seconds
}

// Start the simulation
main().catch((error) => {
  console.error("Error:", error);
});
