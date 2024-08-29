const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: '../../config/.env' });

describe("AlphaEnsemble Contract", function () {
    const oracleAddress = process.env.ORACLE_ADDRESS;
    let alphaEnsemble;
    let owner;
    let mockPriceFeed;

    beforeEach(async function () {
        [owner] = await ethers.getSigners();

        // Deploy Mock Price Feeds
        const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");

        mockPriceFeed = await MockV3Aggregator.deploy();
        mockPriceFeed.waitForDeployment();

        // Deploy AlphaEnsemble Contract
        const AlphaEnsemble = await ethers.getContractFactory("AlphaEnsemble");
        alphaEnsemble = await AlphaEnsemble.deploy(oracleAddress, 5);
        alphaEnsemble.waitForDeployment();

        // Set Mock Price Feeds
        await alphaEnsemble.setPriceFeed("BTC", mockPriceFeed.target);
        await alphaEnsemble.setPriceFeed("ETH", mockPriceFeed.target);
    });

    it("Should emit AssetPricesUpdated event with correct data", async function () {
        await expect(alphaEnsemble.updateAssetPrices())
            .to.emit(alphaEnsemble, "AssetPricesUpdated")
            .withArgs(
                ["BTC", "ETH"],
                anyValue
            );
    });

    // Requires updateAgentPositionsFromLLMResponse to be public
    // it("Should emit PositionsUpdated event when LLM response is handled", async function () {
    //     // Mock the LLM response handling (this simulates the asynchronous response)
    //     const agentRunId = 0; // Assuming the first run has ID 0
    //     const mockLlmResponse = '{\'BTC\': 10, \'ETH\': -5}';

    //     // Call the function to handle the LLM response
    //     await expect(alphaEnsemble.updateAgentPositionsFromLLMResponse(agentRunId, mockLlmResponse))
    //         .to.emit(alphaEnsemble, "PositionsUpdated")
    // });
});
