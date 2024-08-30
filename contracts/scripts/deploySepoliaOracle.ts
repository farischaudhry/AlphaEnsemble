import { ethers } from "hardhat";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { Addressable } from "ethers";

// Load environment variables from the shared .env file
dotenv.config({ path: path.resolve(__dirname, '../../config/.env') });

async function main() {
  // Ensure ORACLE_ADDRESS is set in the environment variables
  if (!process.env.ORACLE_ADDRESS) {
    throw new Error("ORACLE_ADDRESS env variable is not set.");
  }

  // Deploy the USDPriceOracle contract
  const contract = await deployUSDPriceOracle();

  // Save the deployed contract address to the .env file
  await saveContractAddress(contract.target);
}

async function deployUSDPriceOracle() {
  // Get the contract factory
  const USDPriceOracle = await ethers.getContractFactory("USDPriceOracle");

  // Deploy the contract
  const contract = await USDPriceOracle.deploy();

  // Wait for the deployment to complete
  const deployedContract = await contract.waitForDeployment();

  return deployedContract;
}

// Function to save the contract address to the .env file
async function saveContractAddress(address: string | Addressable) {
  // Define the path to the .env file
  const envPath = path.resolve(__dirname, '../../frontend/.env.local');

  // Read the existing content of the .env file
  let envFile = fs.readFileSync(envPath, 'utf-8');

  // If the USD_PRICE_ORACLE_ADDRESS already exists, replace it. Otherwise, add it.
  if (envFile.includes('NEXT_PUBLIC_USD_PRICE_ORACLE_ADDRESS=')) {
    envFile = envFile.replace(/NEXT_PUBLIC_USD_PRICE_ORACLE_ADDRESS=.*/g, `NEXT_PUBLIC_USD_PRICE_ORACLE_ADDRESS="${address}"`);
  } else {
    envFile += `\nNEXT_PUBLIC_USD_PRICE_ORACLE_ADDRESS="${address}"\n`;
  }

  // Write the updated content back to the .env file
  fs.writeFileSync(envPath, envFile, 'utf-8');
  console.log(`Updated .env file with the new contract address: ${address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
