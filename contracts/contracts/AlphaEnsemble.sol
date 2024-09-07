// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./Agent.sol"; // The Agent contract
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AlphaEnsemble is KeeperCompatibleInterface, ReentrancyGuard {
    address public oracleAddress;
    address public owner;
    uint8 public nextAgentId = 0;

    // Array to store agent contract addresses
    address[] public agentContracts;

    // Mapping from asset ticker (e.g., "BTC", "ETH") to the Chainlink price feed contract address and prices
    mapping(string => address) public priceFeeds;
    mapping(string => uint256) public assetPrices;

    // Array of asset tickers
    string[] public assetKeys = ['BTC', 'ETH', 'BNB', 'ADA', 'LINK', 'SOL', 'XRP', 'DOGE', 'DOT', 'MATIC'];

    // Event to emit when an agent is deployed
    event AgentContractDeployed(address agentContractAddress);
    event AgentRunStarted(uint indexed agentID, string query);

    // Events to emit when prices or positions are updated
    event AssetPricesUpdated(string[] assets, uint256[] prices);
    event PositionsUpdated(uint indexed agentID, string[] assets, int256[] positions);
    event PnLUpdated(uint indexed agentID, int256 pnl);

    constructor(address _oracleAddress) {
        oracleAddress = _oracleAddress; // Oracle address for LLM calls
        owner = msg.sender; // Owner of the contract
    }

    /**
     * @notice Deploy a new agent contract and initialize it with strategy details.
     * @param strategyDetails A string containing custom strategy requirements for the agent.
     */
    function deployAgent(string memory strategyDetails) public onlyOwner nonReentrant {
        Agent newAgent = new Agent(oracleAddress, nextAgentId, strategyDetails, assetKeys); // Deploy a new agent
        agentContracts.push(address(newAgent)); // Store the agent's contract address
        emit AgentContractDeployed(address(newAgent)); // Emit event for the frontend
        nextAgentId++; // Increment the agent ID for the next deployment
    }

    /**
     * @notice Update the prices of assets manually.
     * @param assets Array of asset tickers (e.g., ["BTC", "ETH"])
     * @param prices Array of new prices for each asset
     */
    function updateAssetPricesManual(string[] memory assets, uint256[] memory prices) public onlyOwner nonReentrant {
        require(assets.length == prices.length, "Assets and prices arrays must have the same length");

        for (uint256 i = 0; i < assets.length; i++) {
            string memory asset = assets[i];
            uint256 price = prices[i];
            assetPrices[asset] = price;
        }

        // Emit event for the frontend
        emit AssetPricesUpdated(assets, prices);

        // Send the new prices to all agents
        updateAllAgentPrices();
    }

    /**
     * @notice Send the new prices to all agent contracts so they can store them.
     */
    function updateAllAgentPrices() internal {
        for (uint256 i = 0; i < agentContracts.length; i++) {
            Agent agent = Agent(agentContracts[i]);

            // Send the updated prices to the agent contracts
            uint256[] memory prices = new uint256[](assetKeys.length);
            for (uint256 j = 0; j < assetKeys.length; j++) {
                prices[j] = assetPrices[assetKeys[j]];
            }

            agent.storePrices(assetKeys, prices); // Each agent now stores the prices
        }
    }

    /**
     * @notice Call this function to start a new LLM run for all agents.
     */
    function startAllAgentRuns() public nonReentrant onlyOwner {
        for (uint256 i = 0; i < agentContracts.length; i++) {
            Agent agent = Agent(agentContracts[i]);

            // Generate the LLM query for the agent
            string memory query = generateLLMQuery(i);

            agent.startAgentRun(query); // Generate LLM query and start agent run
            emit AgentRunStarted(i, query); // Emit event for the frontend
        }
    }

    function generateLLMQuery(uint256 agentId) internal view returns (string memory) {
        // Start with the specific agent's information
        string memory query = "You are an AI agent tasked with optimizing asset positions for a financial portfolio in a setting where you can see all other agent's positions and PnL. You may take positions between -10 and 10, including fractional values. Provide the new positions for each asset in the format: {'BTC': <position>, 'ETH': <position} for every asset available. Return no other information. You are agent ";
        query = string(abi.encodePacked(query, uint2str(agentId), ". Your current positions are: "));

        Agent currAgent = Agent(agentContracts[agentId]);
        for (uint256 i = 0; i < assetKeys.length; i++) {
            string memory asset = assetKeys[i];
            int256 position = currAgent.getPosition(asset);
            query = string(abi.encodePacked(query, asset, "=", int2str(position), "; "));
        }

        // Add information about other agents
        query = string(abi.encodePacked(query, " Other agents' positions and total PnL: "));
        for (uint256 j = 0; j < agentContracts.length; j++) {
            if (j != agentId) {  // Exclude the current agent's own info
                Agent agent = Agent(agentContracts[j]);
                query = string(abi.encodePacked(query, "Agent ", uint2str(j), " - PnL: ", int2str(agent.getPnl()), "; Positions: "));
                for (uint256 k = 0; k < assetKeys.length; k++) {
                    string memory asset = assetKeys[k];
                    int256 otherPosition = agent.getPosition(asset);
                    query = string(abi.encodePacked(query, asset, "=", int2str(otherPosition), "; "));
                }
                query = string(abi.encodePacked(query, " "));
            }
        }

        // Include current asset prices
        query = string(abi.encodePacked(query, " Current asset prices: "));
        for (uint256 i = 0; i < assetKeys.length; i++) {
            string memory asset = assetKeys[i];
            uint256 currentPrice = assetPrices[asset];
            query = string(abi.encodePacked(query, asset, "=", uint2str(currentPrice), "; "));
        }

        // Append the custom strategy details if they exist (otherwise, use the default message)
        string memory strategyDetails = currAgent.getStrategyDetails();
        if (bytes(strategyDetails).length > 0) {
            query = string(abi.encodePacked(query, " ", strategyDetails));
        } else {
            // Default message for optimizing PnL and avoiding similar positions
            query = string(abi.encodePacked(query, " Avoid choosing identical positions to other agents. Note that rebalancing will only occur every few minutes, so plan accordingly. Optimize for maximum PnL while minimizing transaction costs and keeping a diverse portfolio. Trade based on the information known of other agents. Return the new positions now to maximize PnL."));
        }

        return query;
    }

    // =================================================================================================
    // Getters and setters
    // =================================================================================================

    /**
     * @notice Get the addresses of all deployed agent contracts.
     * @return An array of agent contract addresses.
     */
    function getAgentContracts() public view returns (address[] memory) {
        return agentContracts;
    }

    /**
     * @notice Sets the Chainlink price feed contract address for an asset.
     * @param asset Asset ticker (e.g., "BTC", "ETH").
     * @param feedAddress The Chainlink price feed contract address.
     */
    function setPriceFeed(string memory asset, address feedAddress) public onlyOwner {
        priceFeeds[asset] = feedAddress;
    }

    /**
     * @notice Sets the Oracle address for LLM calls.
     * @param _oracleAddress The Oracle contract address.
     */
    function setOracleAddress(address _oracleAddress) public onlyOwner {
        oracleAddress = _oracleAddress;
        for (uint256 i = 0; i < agentContracts.length; i++) {
            Agent agent = Agent(agentContracts[i]);
            agent.setOracleAddress(_oracleAddress);
        }
    }

    /**
     *
     * @param agentId The ID of the agent to set the strategy details for
     * @param strategyDetails The strategy details to set for the agent's LLM query
     */
    function setStrategyDetails(uint8 agentId, string memory strategyDetails) public onlyOwner {
        Agent agent = Agent(agentContracts[agentId]);
        agent.setStrategyDetails(strategyDetails);
    }

    // =================================================================================================
    // Keeper-related functions
    // =================================================================================================
    uint256 public priceUpdateInterval = 15 seconds;
    uint256 public llmUpdateInterval = 5 minutes;
    uint256 public lastPriceUpdateTime;
    uint256 public lastLlmUpdateTime;

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        bool priceUpdateNeeded = (block.timestamp - lastPriceUpdateTime) > priceUpdateInterval;
        bool llmUpdateNeeded = (block.timestamp - lastLlmUpdateTime) > llmUpdateInterval;

        upkeepNeeded = llmUpdateNeeded || priceUpdateNeeded;
        performData = abi.encode(priceUpdateNeeded, llmUpdateNeeded);
    }

    /**
     * @notice Perform the upkeep
     * @param performData Data passed by the Keeper-compatible system
     */
    function performUpkeep(bytes calldata performData) external {
        (bool priceUpdateNeeded, bool llmUpdateNeeded) = abi.decode(performData, (bool, bool));

        if (priceUpdateNeeded) {
            updateAssetPricesFromChainlink();
            lastPriceUpdateTime = block.timestamp;
        }

        if (llmUpdateNeeded) {
            startAllAgentRuns();
            lastLlmUpdateTime = block.timestamp;
        }
    }

    /**
     * @notice Fetches and updates asset prices using Chainlink.
     */
    function updateAssetPricesFromChainlink() public nonReentrant {
        string[] memory assets = new string[](assetKeys.length);
        uint256[] memory prices = new uint256[](assetKeys.length);

        for (uint256 i = 0; i < assetKeys.length; i++) {
            string memory asset = assetKeys[i];
            AggregatorV3Interface priceFeed = AggregatorV3Interface(priceFeeds[asset]);
            (, int256 price,,,) = priceFeed.latestRoundData();
            require(price > 0, "Invalid price retrieved");
            uint256 adjustedPrice = uint256(price);
            assetPrices[asset] = adjustedPrice;
            prices[i] = adjustedPrice;
            assets[i] = asset;
        }

        // Emit event for frontend and update positions for all agents
        emit AssetPricesUpdated(assets, prices);
    }

    // =================================================================================================
    // Utility functions
    // =================================================================================================

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
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bstr[k] = bytes1(temp);
            _i /= 10;
        }
        return string(bstr);
    }

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
            k = k - 1;
            uint8 temp = (48 + uint8(i - i / 10 * 10));
            bstr[k] = bytes1(temp);
            i /= 10;
        }
        return string(bstr);
    }

    // =================================================================================================
    // Modifiers
    // =================================================================================================

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
}
