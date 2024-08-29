// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IOracle.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract AlphaEnsemble is KeeperCompatibleInterface {
    address public oracleAddress;

    struct Agent {
        int256 pnl; // Profit and Loss
        mapping(string => int256) positions; // Position of each asset (TICKER => POSITION)
    }

    struct AgentRun {
        IOracle.Message[] messages;
        uint responsesCount;
        uint8 max_iterations;
        bool is_finished;
    }

    Agent[] public agents;
    mapping(uint => AgentRun) public agentRuns;
    uint public agentRunCount; // Counter for the number of agent runs

    uint256 public priceUpdateInterval = 10 seconds;
    uint256 public llmUpdateInterval = 5 minutes;
    uint256 public lastPriceUpdateTime;
    uint256 public lastLlmUpdateTime;

    // Events
    event AssetPricesUpdated(string[] assets, uint256[] prices);
    event PositionsUpdated(uint indexed agentID, string[] assets, int256[] positions);

    // Mapping from asset ticker (e.g., "BTC", "ETH") to the Chainlink price feed contract address
    mapping(string => address) public priceFeeds;
    // Mapping from asset ticker (e.g., "BTC", "ETH") to the price of the asset
    mapping(string => uint256) public assetPrices;
    // Array of asset tickers
    string[] public assetKeys = ["BTC", "ETH"];

    constructor(address _oracleAddress, uint256 numAgents) {
        oracleAddress = _oracleAddress; // Set the oracle address during contract deployment
        initializeAgents(numAgents); // Initialize the fixed number of agents
        lastPriceUpdateTime = block.timestamp;
        lastLlmUpdateTime = block.timestamp;

        // Set the price feed addresses for the assets
        setPriceFeed("BTC", 0x6135b13325bfC4B00278B4abC5e20bbce2D6580e);
        setPriceFeed("ETH", 0x9326BFA02ADD2366b30bacB125260Af641031331);
    }

    // Check if the upkeep is needed (either for price update or LLM update)
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        bool priceUpdateNeeded = (block.timestamp - lastPriceUpdateTime) > priceUpdateInterval;
        bool llmUpdateNeeded = (block.timestamp - lastLlmUpdateTime) > llmUpdateInterval;
        upkeepNeeded = priceUpdateNeeded || llmUpdateNeeded;
        performData = "";
    }

    // Perform the upkeep based on which update is required
    function performUpkeep(bytes calldata) external override {
        if ((block.timestamp - lastPriceUpdateTime) > priceUpdateInterval) {
            lastPriceUpdateTime = block.timestamp;
            updateAssetPrices(); // Implement this function to update prices
        }
    }

    function updateAssetPrices() public {
        // Declare and initialize the assets array with asset names from assetKeys
        string[] memory assets = new string[](assetKeys.length);

        // Declare the prices array to hold the updated prices
        uint256[] memory prices = new uint256[](assetKeys.length);

        // Iterate over the assets and update their prices
        for (uint256 i = 0; i < assetKeys.length; i++) {
            string memory asset = assetKeys[i];
            address feedAddress = priceFeeds[asset];
            require(feedAddress != address(0), "Price feed not set for asset");

            // Fetch the latest price from the Chainlink Aggregator
            AggregatorV3Interface priceFeed = AggregatorV3Interface(feedAddress);
            (, int256 price,,,) = priceFeed.latestRoundData();
            require(price > 0, "Invalid price retrieved");

            uint256 adjustedPrice = uint256(price);
            assetPrices[asset] = adjustedPrice;
            prices[i] = adjustedPrice;
            assets[i] = asset;
        }

        // Emit the AssetPricesUpdated event with the updated assets and prices
        emit AssetPricesUpdated(assets, prices);
    }

    /**
     * @notice Initialize the fixed number of agents
     * @param numAgents Number of agents to initialize
     */
    function initializeAgents(uint256 numAgents) private {
        // Add an agent to the agents array
        for (uint256 i = 0; i < numAgents; i++) {
            Agent storage newAgent = agents.push();
            newAgent.pnl = 0;
        }
    }

    /**
     * @notice Get the PnL for a specific agent
     * @param agentId ID of the agent
     * @return pnl PnL of the agent
     */
    function getPnl(uint agentId) external view returns (int256) {
        require(agentId < agents.length, "Invalid agent ID");
        return agents[agentId].pnl;
    }

    /**
     * @notice Update the positions of the assets for a given agent
     * @param agentId ID of the agent
     * @param query Query to be sent to the LLM
     * @param max_iterations The maximum number of iterations for the agent run
     */
    function startAgentRun(uint agentId, string memory query, uint8 max_iterations) public returns (uint) {
        require(agentId < agents.length, "Invalid agent ID");

        AgentRun storage run = agentRuns[agentRunCount];
        run.is_finished = false;
        run.responsesCount = 0;
        run.max_iterations = max_iterations;

        // Initlize message with a system prompt and the user query
        IOracle.Message memory systemMessage = createTextMessage("system", "");
        run.messages.push(systemMessage);

        IOracle.Message memory userMessage = createTextMessage("user", query);
        run.messages.push(userMessage);

        // Trigger an LLM  call via the oracle
        IOracle(oracleAddress).createOpenAiLlmCall(agentRunCount, getDefaultOpenAiConfig());

        return agentRunCount++;
    }

    // ====================================================================================================
    // Helper functions
    // ====================================================================================================

    /**
     * @notice Creates a text message for the LLM.
     * @param role The role of the message sender ("system", "user", "assistant").
     * @param content The content of the message.
     * @return The created message.
     */
    function createTextMessage(string memory role, string memory content) private pure returns (IOracle.Message memory) {
        IOracle.Content[] memory contents = new IOracle.Content[](1);


        contents[0] = IOracle.Content({
            contentType: "text",
            value: content
        });

        IOracle.Message memory newMessage = IOracle.Message({
            role: role,
            content: contents
        });

        return newMessage;
    }

    /**
     * @notice Returns the default configuration for the OpenAI request.
     */
    function getDefaultOpenAiConfig() private pure returns (IOracle.OpenAiRequest memory) {
        return IOracle.OpenAiRequest({
            model: "gpt-4-turbo",
            frequencyPenalty: 0,
            logitBias: "",
            maxTokens: 1000,
            presencePenalty: 0,
            responseFormat: "{\"type\":\"text\"}",
            seed: 0,
            stop: "",
            temperature: 10,
            topP: 100,
            tools: "",
            toolChoice: "auto",
            user: ""
        });
    }

    /**
     * @notice Compares two strings for equality.
     * @param a The first string.
     * @param b The second string.
     * @return True if the strings are equal, false otherwise.
     */
    function compareStrings(string memory a, string memory b) private pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    /**
     *
     * @param asset Asset ticker (e.g., "BTC", "ETH")
     * @param feedAddress Price feed contract address for the asset
     */
    function setPriceFeed(string memory asset, address feedAddress) public {
        priceFeeds[asset] = feedAddress;
    }

    // ====================================================================================================
    // Modifiers
    // ====================================================================================================

    /**
     * @notice Ensures the caller is the oracle contract.
     */
    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only Oracle can call this function");
        _;
    }
}
