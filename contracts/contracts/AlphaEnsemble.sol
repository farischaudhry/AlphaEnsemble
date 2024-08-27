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
}
