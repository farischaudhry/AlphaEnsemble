const { ethers } = require("ethers");
const AlphaEnsembleABI = require("./AlphaEnsembleABI.json");
const MockV3AggregatorABI = require("./MockV3AggregatorABI.json");
const MockV3AggregatorBytecode = require("./MockV3AggregatorBytecode.json");

async function main() {
  // Ensure the contract address is available
  const contractAddress = "0x12431557f06658AeD192938B49c8738e7Bb99fDd"
  if (!contractAddress) {
    throw new Error("Contract address is not set in environment variables.");
  }

  // Set up a provider and signer
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const wallet = new ethers.Wallet("0x5ac5497b575bdf85721ce036f83f8985e88f3ed1fce2a7028d00d3cb1725ee78", provider);

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

    const txSetETH = await contract.setPriceFeed("ETH", mockPriceFeed.target);
    await txSetETH.wait();
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

  // Set an interval to simulate periodic calls (e.g., every 30 seconds)
  setInterval(simulateKeepers, 30000); // 30000 ms = 30 seconds
}

// Start the simulation
main().catch((error) => {
  console.error("Error:", error);
});
