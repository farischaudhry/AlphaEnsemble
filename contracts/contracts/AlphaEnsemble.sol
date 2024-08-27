// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IOracle.sol";

contract AlphaEnsemble {

    struct Agent {
        int256 pnl; // Profit and Loss
        mapping(string => uint256) positions; // Position of each asset (TICKER => POSITION)
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
    uint256 public lastUpdateTime; // Timestamp of last update

    address public oracleAddress;

    event PositionsUpdated(uint indexed agentID, string[] assets, int256[] positions);
    event AgentRunCreated(uint indexed agentId, uint indexed runId);

    constructor(address _oracleAddress, uint256 numAgents) {
        oracleAddress = _oracleAddress; // Set the oracle address during contract deployment
        initializeAgents(numAgents); // Initialize the fixed number of agents
    }

    /**
     * @notice Initialize the fixed number of agents
     * @param numAgents Number of agents to initialize
     */
    function initializeAgents(uint256 numAgents) private {
        // Add an agent to the agents array
        for (uint256 i = 0; i < numAgents; i++) {
            agents.push();
        }
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

        emit AgentRunCreated(agentId, agentRunCount);

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
     * @notice Ensures the caller is the oracle contract.
     */
    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only Oracle can call this function");
        _;
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
}
