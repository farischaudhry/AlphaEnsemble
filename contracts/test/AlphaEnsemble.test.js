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
        // const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");

        // mockPriceFeed = await MockV3Aggregator.deploy();
        // mockPriceFeed.waitForDeployment();

        // Deploy AlphaEnsemble Contract
        const AlphaEnsemble = await ethers.getContractFactory("AlphaEnsemble");
        alphaEnsemble = await AlphaEnsemble.deploy(oracleAddress, 5);
        alphaEnsemble.waitForDeployment();

        // // Set Mock Price Feeds
        // await alphaEnsemble.setPriceFeed("BTC", mockPriceFeed.target);
        // await alphaEnsemble.setPriceFeed("ETH", mockPriceFeed.target);
    });

    // ====================
    // Test Cases
    // ====================

    // it("Should emit AssetPricesUpdated event and PnLUpdated event", async function () {
    //     await expect(alphaEnsemble.updateAssetPrices())
    //         .to.emit(alphaEnsemble, "AssetPricesUpdated")
    //         .withArgs(
    //             ["BTC", "ETH"],
    //             anyValue
    //         );

    //     await expect(alphaEnsemble.updatePnL())
    //         .to.emit(alphaEnsemble, "PnLUpdated")
    // });


    // Requires updateAgentPositionsFromLLMResponse to be public
    // it("Should emit PositionsUpdated event when LLM response is handled", async function () {
    //     // Mock the LLM response handling (this simulates the asynchronous response)
    //     const agentRunId = 0; // Assuming the first run has ID 0
    //     const mockLlmResponse = '{"BTC/USD": 10, "ETH/USD": -5, "AUD/USD": -10}';

    //     // Call the function to handle the LLM response
    //     await expect(alphaEnsemble.updateAgentPositionsFromLLMResponse(agentRunId, mockLlmResponse))
    //         .to.emit(alphaEnsemble, "PositionsUpdated")
    //         .withArgs(0, ["BTC/USD", "ETH/USD", "AUD/USD"], [10, -5, -10]);
    // });

    // it("Should setPositions and emit PositionsUpdated event", async function () {
    //     const agentId = 0;
    //     const assets = ["BTC", "ETH"];
    //     const positions = [10, -5];

    //     await expect(alphaEnsemble.setPositions(agentId, assets, positions))
    //         .to.emit(alphaEnsemble, "PositionsUpdated")
    //         .withArgs(agentId, assets, positions);
    // });

    // it("Should updatePositions and emit PositionsUpdated event", async function () {
    //     await expect(alphaEnsemble.updatePositions())
    //         .to.emit(alphaEnsemble, "PositionsUpdated")
    // });

    // it("Should generateLLMQuery correctly", async function () {
    //     const result = await alphaEnsemble.generateLLMQuery(0);

    //     // Check the return value
    //     expect(result).to.equal("test");
    // });
});
