// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IOracle.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Agent is ReentrancyGuard {
    address public oracleAddress;
    address public owner;
    uint256 public agentId;
    int256 public totalPnl;

    mapping(string => int256) public positions; // Maps asset to its position (e.g., "BTC" => 10)
    mapping(string => uint256) public longCostBasis; // Maps asset to cost basis for long positions
    mapping(string => uint256) public shortCostBasis; // Maps asset to cost basis for short positions
    mapping(string => uint256) public prices; // Locally stored asset prices
    string[] public assetKeys;
    string public strategyDetails;
    IOracle.Message public message;

    // Events
    event PositionsUpdated(uint indexed agentId, string[] assets, int256[] positions);
    event PnLUpdated(uint indexed agentId, int256 pnl);
    event OracleResponseCallback(uint indexed agentId, string response, string errorMessage);

    constructor(address _oracleAddress, uint256 _agentId, string memory _strategyDetails, string[] memory _assetKeys) {
        oracleAddress = _oracleAddress;
        agentId = _agentId;
        strategyDetails = _strategyDetails;
        owner = msg.sender;
        assetKeys = _assetKeys;
    }

    // ====================================================================================================
    // Getters and setters
    // ====================================================================================================

    /**
     * @notice Store the asset prices in the agent contract (sent from the main contract).
     * @param assets Array of asset tickers
     * @param newPrices Array of corresponding prices
     */
    function storePrices(string[] memory assets, uint256[] memory newPrices) public onlyOwner {
        require(assets.length == newPrices.length, "Mismatched arrays");

        for (uint i = 0; i < assets.length; i++) {
            string memory asset = assets[i];
            uint256 newPrice = newPrices[i];
            prices[asset] = newPrice; // Store prices locally

            // Recalculate PnL for the asset based on the new price
            int256 currentPosition = positions[asset];
            if (currentPosition != 0) {
                if (currentPosition > 0) { // Long position
                    totalPnl += currentPosition * int256(newPrice - longCostBasis[asset]);
                } else { // Short position
                    totalPnl += currentPosition * int256(shortCostBasis[asset] - newPrice);
                }
            }
        }

        // Emit updated PnL event after recalculating
        emit PnLUpdated(agentId, totalPnl);
    }

    // Set positions and handle PnL updates, prices are fetched locally
    function setPositions(string[] memory assets, int256[] memory newPositions) internal {
        require(assets.length == newPositions.length, "Mismatched arrays");

        for (uint i = 0; i < assets.length; i++) {
            string memory asset = assets[i];
            int256 newPosition = newPositions[i];
            int256 currentPosition = positions[asset];
            uint256 currentPrice = prices[asset]; // Fetch the price stored in the agent's prices mapping

            // If the new position is zero (closing position), calculate PnL and reset positions
            if (newPosition == 0) {
                if (currentPosition != 0) {
                    // Realize PnL and reset position
                    totalPnl += currentPosition > 0
                        ? currentPosition * int256(currentPrice - longCostBasis[asset])
                        : currentPosition * int256(shortCostBasis[asset] - currentPrice);

                    positions[asset] = 0;
                    longCostBasis[asset] = 0;
                    shortCostBasis[asset] = 0;
                }
            } else if ((currentPosition > 0 && newPosition < 0) || (currentPosition < 0 && newPosition > 0)) {
                // If switching direction, realize the PnL of the existing position and set new direction
                totalPnl += currentPosition > 0
                    ? currentPosition * int256(currentPrice - longCostBasis[asset])
                    : currentPosition * int256(shortCostBasis[asset] - currentPrice);

                positions[asset] = newPosition;
                if (newPosition > 0) {
                    longCostBasis[asset] = currentPrice;
                    shortCostBasis[asset] = 0;
                } else {
                    shortCostBasis[asset] = currentPrice;
                    longCostBasis[asset] = 0;
                }
            } else {
                // If the direction remains the same, update cost basis
                if (newPosition > 0) {
                    uint256 oldCost = longCostBasis[asset] * uint256(currentPosition);
                    uint256 newCost = currentPrice * uint256(newPosition);
                    longCostBasis[asset] = (oldCost + newCost) / uint256(newPosition);
                } else {
                    uint256 oldCost = shortCostBasis[asset] * uint256(-currentPosition);
                    uint256 newCost = currentPrice * uint256(-newPosition);
                    shortCostBasis[asset] = (oldCost + newCost) / uint256(-newPosition);
                }
                positions[asset] = newPosition;
            }
        }

        // Emit the PositionsUpdated event after positions are set
        emit PositionsUpdated(agentId, assets, newPositions);
        emit PnLUpdated(agentId, totalPnl);
    }

    function getPositions() public view returns (string[] memory assets, int256[] memory currentPositions) {
        uint256 length = assetKeys.length;
        assets = new string[](length);
        currentPositions = new int256[](length);

        for (uint256 i = 0; i < length; i++) {
            string memory asset = assetKeys[i];
            assets[i] = asset;
            currentPositions[i] = positions[asset];
        }
    }

    function getPosition(string memory asset) public view returns (int256) {
        return positions[asset];
    }

    function getPnl() public view returns (int256) {
        return totalPnl;
    }

    function getStrategyDetails() public view returns (string memory) {
        return strategyDetails;
    }

    function setOracleAddress(address _oracleAddress) public onlyOwner {
        oracleAddress = _oracleAddress;
    }

    function setStrategyDetails(string memory _strategyDetails) public onlyOwner {
        strategyDetails = _strategyDetails;
    }

    // ====================================================================================================
    // Modifiers
    // ====================================================================================================

    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only oracle can call this function");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // ====================================================================================================
    // LLM interaction functions
    // ====================================================================================================

    // Start agent run by calling LLM through oracle
    function startAgentRun(string memory query) public nonReentrant onlyOwner {
        message = createTextMessage("user", query);
        IOracle(oracleAddress).createOpenAiLlmCall(agentId, getDefaultOpenAiConfig());
    }

    // Callback for oracle response
    function onOracleOpenAiLlmResponse(
        uint /*runId*/,
        IOracle.OpenAiResponse memory response,
        string memory errorMessage
    ) public onlyOracle {
        emit OracleResponseCallback(agentId, response.content, errorMessage);

        if (bytes(errorMessage).length > 0) {
            return;
        }

        // Update positions based on LLM response
        updateAgentPositionsFromLLMResponse(response.content);
    }

    // Updates agent positions based on the LLM response
    function updateAgentPositionsFromLLMResponse(string memory llmResponse) internal {
        // Parsing the LLM response which is expected to be in the form {"BTC/USD": 10, "ETH/USD": -5, ...}

        bytes memory responseBytes = bytes(llmResponse);
        require(responseBytes.length > 2, "Invalid LLM response format");
        bytes memory trimmedResponse = new bytes(responseBytes.length - 2);

        for (uint i = 1; i < responseBytes.length - 1; i++) {
            trimmedResponse[i - 1] = responseBytes[i];
        }

        string[] memory keyValuePairs = splitString(string(trimmedResponse), ",");
        string[] memory assets = new string[](keyValuePairs.length);
        int256[] memory positionsArray = new int256[](keyValuePairs.length);

        for (uint i = 0; i < keyValuePairs.length; i++) {
            string[] memory pair = splitString(keyValuePairs[i], ":");
            require(pair.length == 2, "Invalid key-value pair format in LLM response");

            string memory asset = stripQuotes(trimWhitespace(pair[0]));
            string memory positionStr = stripQuotes(trimWhitespace(pair[1]));

            int256 position = parseInt(positionStr);
            assets[i] = asset;
            positionsArray[i] = position;
        }

        // Update the agent's positions and emit events
        setPositions(assets, positionsArray);
    }

    function createTextMessage(string memory role, string memory content) private pure returns (IOracle.Message memory) {
        IOracle.Message memory newMessage = IOracle.Message({
            role: role,
            content: new IOracle.Content[](1)
        });
        newMessage.content[0].contentType = "text";
        newMessage.content[0].value = content;
        return newMessage;
    }

    /**
     * @notice Provides the message history to the oracle
     */
    function getMessageHistory (
        uint /* agentId */
    ) public view returns (IOracle.Message[] memory) {
        IOracle.Message[] memory messages = new IOracle.Message[](1);
        messages[0] = message;
        return messages;
    }

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
            toolChoice: "",
            user: ""
        });
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
}
