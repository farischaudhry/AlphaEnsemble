// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IOracle.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AlphaEnsemble is KeeperCompatibleInterface, Ownable {
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
        uint agentId;
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
    event PnLUpdated(uint indexed agentID, int256 pnl);
    event AgentRunCompleted(uint indexed agentRunId, uint indexed agentId, string result);

    // Mapping from asset ticker (e.g., "BTC", "ETH") to the Chainlink price feed contract address
    mapping(string => address) public priceFeeds;
    // Mapping from asset ticker (e.g., "BTC", "ETH") to the price of the asset
    mapping(string => uint256) public assetPrices;
    // Array of asset tickers
    string[] public assetKeys = [
        "AUD/USD",
        "BTC/USD",
        "CSPX/USD",
        "CZK/USD",
        "DAI/USD",
        "ETH/USD",
        "EUR/USD",
        "FORTH/USD",
        "GBP/USD",
        "GHO/USD",
        "IB01/USD",
        "IBTA/USD",
        "JPY/USD",
        "LINK/USD",
        "SNX/USD",
        "SUSDE/USD",
        "USDC/USD",
        "USDE/USD",
        "WSTETH/USD",
        "XAU/USD"
    ];

    constructor(address _oracleAddress, uint256 numAgents) Ownable(msg.sender) {
        oracleAddress = _oracleAddress; // Set the oracle address during contract deployment
        initializeAgents(numAgents); // Initialize the fixed number of agents
        lastPriceUpdateTime = block.timestamp;
        lastLlmUpdateTime = block.timestamp;
    }

    // Check if the upkeep is needed (either for price update or LLM update)
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        bool priceUpdateNeeded = (block.timestamp - lastPriceUpdateTime) > priceUpdateInterval;
        bool llmUpdateNeeded = (block.timestamp - lastLlmUpdateTime) > llmUpdateInterval;

        upkeepNeeded = llmUpdateNeeded;
        // upkeepNeeded = priceUpdateNeeded || llmUpdateNeeded;
        performData = abi.encode(priceUpdateNeeded, llmUpdateNeeded);
    }

    // Perform the upkeep (to be called by Chainlink Keepers or manually)
    function performUpkeep(bytes calldata performData) external {
        (bool priceUpdateNeeded, bool llmUpdateNeeded) = abi.decode(performData, (bool, bool));

        // if (priceUpdateNeeded) {
        //     updateAssetPrices();
        //     lastPriceUpdateTime = block.timestamp;
        // }

        if (llmUpdateNeeded) {
            updatePositions();
            lastLlmUpdateTime = block.timestamp;
        }
    }

    function updateAssetPrices() public {
        string[] memory assets = new string[](assetKeys.length);
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

        updatePnL();
    }

    function updateAssetPricesManual(string[] memory assets, uint256[] memory prices) public onlyOwner {
        require(assets.length == prices.length, "Assets and prices arrays must have the same length");

        for (uint256 i = 0; i < assets.length; i++) {
            string memory asset = assets[i];
            uint256 price = prices[i];
            assetPrices[asset] = price;
        }

        // Emit the AssetPricesUpdated event with the updated assets and prices
        emit AssetPricesUpdated(assets, prices);

        updatePnL();
    }

    function updatePnL() public {
        for (uint256 i = 0; i < agents.length; i++) {
            int256 pnl = 0;

            for (uint256 j = 0; j < assetKeys.length; j++) {
                string memory asset = assetKeys[j];
                int256 position = agents[i].positions[asset];
                uint256 price = assetPrices[asset];
                pnl += position * int256(price);
            }

            agents[i].pnl = pnl;
            emit PnLUpdated(i, pnl);
        }
    }

    /**
     * @notice Update the positions of the agents based on the latest asset price
     */
    function updatePositions() internal {
        for (uint256 i = 0; i < agents.length; i++) {
            // Generate the query and start new runs for each agent
            string memory query = generateLLMQuery(i);
            startAgentRun(i, query, 1);
        }
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

            // Initialize the positions of the assets for the agent
            for (uint256 j = 0; j < assetKeys.length; j++) {
                string memory asset = assetKeys[j];
                newAgent.positions[asset] = 0;
            }
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
     * @notice Get the positions of the assets for a specific agent
     * @param agentId ID of the agent
     * @return assets Array of asset tickers
     * @return positions Array of positions for each asset
     */
    function getPositions(uint agentId) external view returns (string[] memory assets, int256[] memory positions) {
        require(agentId < agents.length, "Invalid agent ID");

        assets = assetKeys;
        positions = new int256[](assetKeys.length);

        for (uint256 i = 0; i < assetKeys.length; i++) {
            string memory asset = assetKeys[i];
            positions[i] = agents[agentId].positions[asset];
        }
    }

    /**
     * @notice Sets the positions for multiple assets for a given agent
     * @param agentId ID of the agent
     * @param assets Array of asset tickers (e.g., ["BTC", "ETH"])
     * @param positions Array of new position values for the corresponding assets
     */
    function setPositions(uint agentId, string[] memory assets, int256[] memory positions) public {
        require(agentId < agents.length, "Invalid agent ID");
        require(assets.length == positions.length, "Assets and positions arrays must have the same length");

        for (uint256 i = 0; i < assets.length; i++) {
            require(bytes(assets[i]).length > 0, "Asset ticker cannot be empty");

            // Update the position for each asset
            agents[agentId].positions[assets[i]] = positions[i];
        }

        // Emit an event to notify that the positions have been updated
        emit PositionsUpdated(agentId, assets, positions);
    }

    /**
     *
     * @param asset Asset ticker (e.g., "BTC", "ETH")
     * @param feedAddress Price feed contract address for the asset
     */
    function setPriceFeed(string memory asset, address feedAddress) public {
        priceFeeds[asset] = feedAddress;
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

        // Initialize the system message with a standard prompt to instruct the LLM
        string memory systemPrompt = "You are an AI agent tasked with optimizing asset positions for a financial portfolio. ";
        systemPrompt = string(abi.encodePacked(systemPrompt, "For your agent, provide the new positions for each asset in the format: {'BTC/USD': <position>, 'ETH/USD': <position>} and so on."));

        IOracle.Message memory systemMessage = createTextMessage("system", systemPrompt);
        run.messages.push(systemMessage);

        // Initialize the user message with the specific query for this agent
        IOracle.Message memory userMessage = createTextMessage("user", query);
        run.messages.push(userMessage);

        // Trigger an LLM call via the oracle
        IOracle(oracleAddress).createOpenAiLlmCall(agentRunCount, getDefaultOpenAiConfig());

        return agentRunCount++;
    }

    function handleLlmResponse(uint agentRunId) public {
        // Fetch the AgentRun data using the provided agentRunId
        AgentRun storage run = agentRuns[agentRunId];

        // Emit the AgentRunCompleted event before processing the response
        emit AgentRunCompleted(agentRunId, run.agentId, run.messages[run.responsesCount - 1].content[0].value);

        // Process the LLM response
        string memory llmResponse = run.messages[run.responsesCount - 1].content[0].value;

        // Update the agent's positions based on the LLM response
        updateAgentPositionsFromLLMResponse(agentRunId, llmResponse);

        // Mark the agentRun as finished
        run.is_finished = true;
    }

    function updateAgentPositionsFromLLMResponse(uint agentRunId, string memory llmResponse) internal {
        // Parsing the LLM response which is expected to be in the form {"BTC": 10, "ETH": -5, ...}

        // Strip leading/trailing braces {}
        bytes memory responseBytes = bytes(llmResponse);
        require(responseBytes.length > 2, "Invalid LLM response format");
        bytes memory trimmedResponse = new bytes(responseBytes.length - 2);

        for (uint i = 1; i < responseBytes.length - 1; i++) {
            trimmedResponse[i - 1] = responseBytes[i];
        }

        // Split the string by ","
        string[] memory keyValuePairs = splitString(string(trimmedResponse), ",");
        string[] memory assets = new string[](keyValuePairs.length);
        int256[] memory positions = new int256[](keyValuePairs.length);

        for (uint i = 0; i < keyValuePairs.length; i++) {
            // Split each pair by ":"
            string[] memory pair = splitString(keyValuePairs[i], ":");
            require(pair.length == 2, "Invalid key-value pair format in LLM response");

            // Extract asset ticker and position value
            string memory asset = stripQuotes(pair[0]);
            string memory positionStr = stripQuotes(pair[1]);

            // Remove any leading or trailing whitespace from the position string
            positionStr = trimWhitespace(positionStr);

            // Parse the position value
            int256 position = parseInt(positionStr);

            assets[i] = asset;
            positions[i] = position;
        }

        // Update the agent's positions using the setPositions function
        AgentRun storage run = agentRuns[agentRunId];
        setPositions(run.agentId, assets, positions);
    }

    /**
     *
     * @param agentId ID of the agent
     */
    function generateLLMQuery(uint256 agentId) internal view returns (string memory) {
        // Start with the specific agent's information
        string memory query = "You are agent ";
        query = string(abi.encodePacked(query, uint2str(agentId), ". Your current positions are: "));

        for (uint256 i = 0; i < assetKeys.length; i++) {
            string memory asset = assetKeys[i];
            int256 position = agents[agentId].positions[asset];
            query = string(abi.encodePacked(query, asset, "=", int2str(position), "; "));
        }

        // Add information about other agents
        query = string(abi.encodePacked(query, " Other agents' positions and total PnL: "));

        for (uint256 j = 0; j < agents.length; j++) {
            if (j != agentId) {  // Exclude the current agent's own info
                query = string(abi.encodePacked(query, "Agent ", uint2str(j), " - PnL: ", int2str(agents[j].pnl), "; Positions: "));

                for (uint256 k = 0; k < assetKeys.length; k++) {
                    string memory asset = assetKeys[k];
                    int256 otherPosition = agents[j].positions[asset];
                    query = string(abi.encodePacked(query, asset, "=", int2str(otherPosition), "; "));
                }

                query = string(abi.encodePacked(query, " "));
            }
        }

        query = string(abi.encodePacked(query, " Optimize your positions based on this information."));
        return query;
    }

    // ====================================================================================================
    // Parsing functions
    // ====================================================================================================

    function splitString(string memory str, string memory delimiter) internal pure returns (string[] memory) {
        bytes memory strBytes = bytes(str);
        bytes memory delimiterBytes = bytes(delimiter);
        uint delimiterLength = delimiterBytes.length;

        require(delimiterLength > 0, "Delimiter cannot be empty");

        // Count occurrences of the delimiter in the string
        uint count = 1;
        for (uint i = 0; i < strBytes.length - delimiterLength + 1; i++) {
            bool matchFound = true;
            for (uint j = 0; j < delimiterLength; j++) {
                if (strBytes[i + j] != delimiterBytes[j]) {
                    matchFound = false;
                    break;
                }
            }
            if (matchFound) {
                count++;
            }
        }

        // Split the string
        string[] memory parts = new string[](count);
        uint partIndex = 0;
        uint start = 0;

        for (uint i = 0; i < strBytes.length - delimiterLength + 1; i++) {
            bool matchFound = true;
            for (uint j = 0; j < delimiterLength; j++) {
                if (strBytes[i + j] != delimiterBytes[j]) {
                    matchFound = false;
                    break;
                }
            }
            if (matchFound) {
                parts[partIndex] = substring(str, start, i);
                partIndex++;
                start = i + delimiterLength;
            }
        }
        parts[partIndex] = substring(str, start, strBytes.length);

        return parts;
    }

    function substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }

    function stripQuotes(string memory str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        if (strBytes.length >= 2 &&
            (strBytes[0] == '"' && strBytes[strBytes.length - 1] == '"') ||
            (strBytes[0] == "'" && strBytes[strBytes.length - 1] == "'")
        ) {
            bytes memory result = new bytes(strBytes.length - 2);
            for (uint i = 1; i < strBytes.length - 1; i++) {
                result[i - 1] = strBytes[i];
            }
            return string(result);
        }
        return str; // Return as is if not quoted
    }

    function parseInt(string memory str) internal pure returns (int256) {
        bytes memory strBytes = bytes(str);
        int256 result = 0;
        bool isNegative = false;
        uint i = 0;

        // Check for a negative sign
        if (strBytes.length > 0 && strBytes[0] == "-") {
            isNegative = true;
            i = 1;
        }

        for (; i < strBytes.length; i++) {
            require(strBytes[i] >= "0" && strBytes[i] <= "9", "Invalid integer string");
            result = result * 10 + (int256(uint256(uint8(strBytes[i])) - 48));
        }

        return isNegative ? -result : result;
    }

    function trimWhitespace(string memory str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        uint start = 0;
        uint end = strBytes.length;

        // Find the first non-whitespace character
        while (start < end && (strBytes[start] == 0x20)) {
            start++;
        }

        // Find the last non-whitespace character
        while (end > start && (strBytes[end - 1] == 0x20)) {
            end--;
        }

        bytes memory result = new bytes(end - start);
        for (uint i = start; i < end; i++) {
            result[i - start] = strBytes[i];
        }

        return string(result);
    }

    // ====================================================================================================
    // Utility functions
    // ====================================================================================================

    /**
     * @notice Creates a text message for the LLM.
     * @param role The role of the message sender ("system", "user", "assistant").
     * @param content The content of the message.
     * @return The created message.
     */
    function createTextMessage(string memory role, string memory content) internal pure returns (IOracle.Message memory) {
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
    function getDefaultOpenAiConfig() internal pure returns (IOracle.OpenAiRequest memory) {
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
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    /**
     *
     * @param _i The uint to convert to a string
     */
    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     *
     * @param _i The int to convert to a string
     */
    function int2str(int _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        bool negative = _i < 0;
        uint i = uint(negative ? -_i : _i);
        uint j = i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        if (negative) ++len;
        bytes memory bstr = new bytes(len);
        uint k = len;
        if (negative) {
            bstr[0] = '-';
        }
        while (i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(i - i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            i /= 10;
        }
        return string(bstr);
    }
}
