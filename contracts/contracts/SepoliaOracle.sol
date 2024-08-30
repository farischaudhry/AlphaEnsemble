// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IPriceFeed {
    function latestAnswer() external view returns (int256);
}

contract USDPriceOracle {
    // Mapping to store prices of assets in USD
    mapping(string => int256) public prices;

    // Mapping of asset names to their respective contract addresses
    mapping(string => address) public priceFeeds;

    // List of asset names for iteration
    string[] public assets;

    constructor() {
        // Initialize the price feed contract addresses
        priceFeeds["AUD/USD"] = 0xB0C712f98daE15264c8E26132BCC91C40aD4d5F9;
        priceFeeds["BTC/USD"] = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43;
        priceFeeds["CSPX/USD"] = 0x4b531A318B0e44B549F3b2f824721b3D0d51930A;
        priceFeeds["CZK/USD"] = 0xC32f0A9D70A34B9E7377C10FDAd88512596f61EA;
        priceFeeds["DAI/USD"] = 0x14866185B1962B63C3Ea9E03Bc1da838bab34C19;
        priceFeeds["ETH/USD"] = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
        priceFeeds["EUR/USD"] = 0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910;
        priceFeeds["FORTH/USD"] = 0x070bF128E88A4520b3EfA65AB1e4Eb6F0F9E6632;
        priceFeeds["GBP/USD"] = 0x91FAB41F5f3bE955963a986366edAcff1aaeaa83;
        priceFeeds["GHO/USD"] = 0x635A86F9fdD16Ff09A0701C305D3a845F1758b8E;
        priceFeeds["IB01/USD"] = 0xB677bfBc9B09a3469695f40477d05bc9BcB15F50;
        priceFeeds["IBTA/USD"] = 0x5c13b249846540F81c093Bc342b5d963a7518145;
        priceFeeds["JPY/USD"] = 0x8A6af2B75F23831ADc973ce6288e5329F63D86c6;
        priceFeeds["LINK/USD"] = 0xc59E3633BAAC79493d908e63626716e204A45EdF;
        priceFeeds["SNX/USD"] = 0xc0F82A46033b8BdBA4Bb0B0e28Bc2006F64355bC;
        priceFeeds["SUSDE/USD"] = 0x6f7be09227d98Ce1Df812d5Bc745c0c775507E92;
        priceFeeds["USDC/USD"] = 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E;
        priceFeeds["USDE/USD"] = 0x55ec7c3ed0d7CB5DF4d3d8bfEd2ecaf28b4638fb;
        priceFeeds["WSTETH/USD"] = 0xaaabb530434B0EeAAc9A42E25dbC6A22D7bE218E;
        priceFeeds["XAU/USD"] = 0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea;

        // Populate the asset list
        assets.push("AUD/USD");
        assets.push("BTC/USD");
        assets.push("CSPX/USD");
        assets.push("CZK/USD");
        assets.push("DAI/USD");
        assets.push("ETH/USD");
        assets.push("EUR/USD");
        assets.push("FORTH/USD");
        assets.push("GBP/USD");
        assets.push("GHO/USD");
        assets.push("IB01/USD");
        assets.push("IBTA/USD");
        assets.push("JPY/USD");
        assets.push("LINK/USD");
        assets.push("SNX/USD");
        assets.push("SUSDE/USD");
        assets.push("USDC/USD");
        assets.push("USDE/USD");
        assets.push("WSTETH/USD");
        assets.push("XAU/USD");
    }

    // Function to update the prices for all assets
    function updatePrices() public {
        for (uint256 i = 0; i < assets.length; i++) {
            string memory asset = assets[i];
            address feedAddress = priceFeeds[asset];
            require(feedAddress != address(0), "Price feed not set for this asset");

            IPriceFeed priceFeed = IPriceFeed(feedAddress);
            int256 latestPrice = priceFeed.latestAnswer();
            require(latestPrice > 0, "Invalid price");

            prices[asset] = latestPrice;
        }
    }

    // Function to get the price of a specific asset
    function getPrice(string memory asset) public view returns (int256) {
        return prices[asset];
    }

    // Function to get the list of assets
    function getAssets() public view returns (string[] memory) {
        return assets;
    }
}
