// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract GaladrielPriceReceiver {
    // Mapping to store prices of assets in USD
    mapping(string => int256) public prices;

    // Event to log the updates
    event PriceUpdated(string asset, int256 price);

    // Function to update the prices for specific assets
    function updatePrice(string memory asset, int256 price) public {
        prices[asset] = price;
        emit PriceUpdated(asset, price);
    }

    // Function to get the price of a specific asset
    function getPrice(string memory asset) public view returns (int256) {
        return prices[asset];
    }
}
