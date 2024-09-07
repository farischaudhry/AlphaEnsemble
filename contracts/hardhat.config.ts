import {HardhatUserConfig} from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@xyrusworx/hardhat-solidity-json";
import 'solidity-docgen';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the shared .env file
dotenv.config({ path: path.resolve(__dirname, '../config/.env') });

const galadrielDevnet = []
if (process.env.PRIVATE_KEY_GALADRIEL) {
  galadrielDevnet.push(process.env.PRIVATE_KEY_GALADRIEL)
}
const localhostPrivateKeys = []
if (process.env.PRIVATE_KEY_LOCALHOST) {
  localhostPrivateKeys.push(process.env.PRIVATE_KEY_LOCALHOST)
}

const sepoliaPrivateKeys: string[] = [];
if (process.env.PRIVATE_KEY_SEPOLIA) {
  sepoliaPrivateKeys.push(process.env.PRIVATE_KEY_SEPOLIA);
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true  // Enable the IR optimization to work around the "Stack too deep" error
    }
  },
  networks: {
    galadriel: {
      chainId: 696969,
      url: "https://devnet.galadriel.com/",
      accounts: galadrielDevnet,
    },
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      chainId: 1337,
      url: "http://127.0.0.1:8545",
      accounts: localhostPrivateKeys,
    },
    sepolia: {
      chainId: 11155111, // Sepolia's chain ID
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: sepoliaPrivateKeys,
    },
  },
};

export default config;
