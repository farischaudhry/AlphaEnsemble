// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockV3Aggregator {
    function latestRoundData()
        external
        view
        returns (
            uint80,
            int256,
            uint256,
            uint256,
            uint80
        )
    {
        // Generate a pseudo-random number using block.timestamp and block.prevrandao
        int256 randomPrice = int256(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % 1000000);
        return (0, 1, block.timestamp, block.timestamp, 0);
    }
}
