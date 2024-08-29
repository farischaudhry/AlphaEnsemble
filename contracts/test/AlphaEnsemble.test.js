const { expect } = require("chai");
const { ethers } = require("hardhat");
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: '../../config/.env' });

describe("AlphaEnsemble", function () {
  let AlphaEnsemble, alphaEnsemble, owner, addr1, addr2;
  const oracleAddress = process.env.ORACLE_ADDRESS;
  const numAgents = 5;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    AlphaEnsemble = await ethers.getContractFactory("AlphaEnsemble");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy an instance of the AlphaEnsemble contract
    alphaEnsemble = await AlphaEnsemble.deploy(oracleAddress, numAgents);
  });

  it("Should deploy with the correct oracle address and number of agents", async function () {
    expect(await alphaEnsemble.oracleAddress()).to.equal(oracleAddress);

    // Verify the PnL of the first agent is 0
    const pnl = await alphaEnsemble.getPnl(0);
    expect(pnl).to.equal(0);
  });
});
