// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./interfaces/IOracle.sol";

contract AlphaEnsemble {

    struct Agent {
        // Profit and Loss
        int256 pnl;
        // Position of each asset (TICKER => POSITION)
        mapping(string => uint256) positions;
    }

    Agent[] public agents;
    uint256 public lastUpdateTime;

    address public oracleAddress;

    event PositionsUpdated(uint indexed agentID, string[] assets, int256[] positions)

    // Constructor
    constructor(address _oracleAddress, uint256 numAgents) {
        oracleAddress = _oracleAddress;  // Set the oracle address during contract deployment
        initializeAgents(numAgents);  // Initialize the fixed number of agents
    }

    function initializeAgents(uint256 numAgents) private {
        for (uint256 i = 0; i < numAgents; i++) {
            agents.push(); // Add an agent to the agents array
        }
    }
}
