import time
import json
from web3 import Web3
from pathlib import Path
import os
from dotenv import load_dotenv

# Load environment variables from frontend/.env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../frontend/.env.local'))

# Initialize a Web3 instance for Sepolia testnet (to read prices)
sepolia_rpc_url = "https://rpc.ankr.com/eth_sepolia"
sepolia_web3 = Web3(Web3.HTTPProvider(sepolia_rpc_url))

# Initialize a Web3 instance for Galadriel testnet (to interact with AlphaEnsembleContract)
galadriel_rpc_url = "https://devnet.galadriel.com/"
galadriel_web3 = Web3(Web3.HTTPProvider(galadriel_rpc_url))

# Simplified ABI for the AggregatorV3Interface (for latestRoundData function)
aggregator_v3_interface_abi = [
    {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
            {"internalType": "uint80", "name": "roundId", "type": "uint80"},
            {"internalType": "int256", "name": "answer", "type": "int256"},
            {"internalType": "uint256", "name": "startedAt", "type": "uint256"},
            {"internalType": "uint256", "name": "updatedAt", "type": "uint256"},
            {"internalType": "uint80", "name": "answeredInRound", "type": "uint80"},
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

# Mapping of asset names to their respective contract addresses on Sepolia Chainlink price feeds
price_feeds = {
    "AUD/USD": "0xB0C712f98daE15264c8E26132BCC91C40aD4d5F9",
    "BTC/USD": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    "CSPX/USD": "0x4b531A318B0e44B549F3b2f824721b3D0d51930A",
    "CZK/USD": "0xC32f0A9D70A34B9E7377C10FDAd88512596f61EA",
    "DAI/USD": "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",
    "ETH/USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    "EUR/USD": "0x1a81afB8146aeFfCFc5E50e8479e826E7D55b910",
    "FORTH/USD": "0x070bF128E88A4520b3EfA65AB1e4Eb6F0F9E6632",
    "GBP/USD": "0x91FAB41F5f3bE955963a986366edAcff1aaeaa83",
    "GHO/USD": "0x635A86F9fdD16Ff09A0701C305D3a845F1758b8E",
    "IB01/USD": "0xB677bfBc9B09a3469695f40477d05bc9BcB15F50",
    "IBTA/USD": "0x5c13b249846540F81c093Bc342b5d963a7518145",
    "JPY/USD": "0x8A6af2B75F23831ADc973ce6288e5329F63D86c6",
    "LINK/USD": "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    "SNX/USD": "0xc0F82A46033b8BdBA4Bb0B0e28Bc2006F64355bC",
    "SUSDE/USD": "0x6f7be09227d98Ce1Df812d5Bc745c0c775507E92",
    "USDC/USD": "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
    "USDE/USD": "0x55ec7c3ed0d7CB5DF4d3d8bfEd2ecaf28b4638fb",
    "WSTETH/USD": "0xaaabb530434B0EeAAc9A42E25dbC6A22D7bE218E",
    "XAU/USD": "0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea"
}

# Load the ABI for AlphaEnsembleContract from the JSON file
with open(os.path.join(os.path.dirname(__file__), "../frontend/contracts/AlphaEnsembleABI.json")) as f:
    alpha_ensemble_abi = f.read()

alpha_ensemble_address = os.getenv('NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS')

# Create the contract instance for AlphaEnsembleContract on Galadriel
alpha_ensemble_contract = galadriel_web3.eth.contract(address=alpha_ensemble_address, abi=alpha_ensemble_abi)

private_key = os.getenv('NEXT_PUBLIC_PRIVATE_KEY_GALADRIEL')
account = galadriel_web3.eth.account.from_key(private_key)
chain_id = 696969  # Galadriel testnet chain ID

# Upkeep intervals
price_update_interval = 15  # seconds
llm_update_interval = 30  # 5 minutes
last_price_update_time = time.time()
last_llm_update_time = time.time()

def fetch_latest_prices():
    assets = []
    prices = []
    for asset, address in price_feeds.items():
        try:
            # Create contract instance for the price feed on Sepolia
            price_feed_contract = sepolia_web3.eth.contract(address=address, abi=aggregator_v3_interface_abi)

            # Call latestRoundData to get the latest price
            latest_data = price_feed_contract.functions.latestRoundData().call()

            # Extract the price (adjust for decimals if necessary)
            price = latest_data[1] / 1e8  # Assuming 8 decimal places as typical for Chainlink price feeds

            # Store the asset and price in the lists
            assets.append(asset)
            prices.append(int(price * 1e8))

            # Print the price
            print(f"Latest {asset} price from Sepolia: {price} USD")
        except Exception as e:
            print(f"Failed to fetch price for {asset} from Sepolia: {e}")

    return assets, prices

def update_alpha_ensemble_asset_prices(assets, prices):
    try:
        txn = alpha_ensemble_contract.functions.updateAssetPricesManual(assets, prices).build_transaction({
            'chainId': chain_id,
            'gas': 1000000,
            'gasPrice': galadriel_web3.eth.gas_price,
            'nonce': galadriel_web3.eth.get_transaction_count(account.address),
        })

        signed_txn = galadriel_web3.eth.account.sign_transaction(txn, private_key=private_key)
        tx_hash = galadriel_web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = galadriel_web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Updated prices on AlphaEnsembleContract with Tx: {tx_hash.hex()}, Status: {receipt['status']}")
    except Exception as e:
        print(f"Failed to update prices in AlphaEnsembleContract on Galadriel: {e}")

def update_alpha_ensemble_llm_positions():
    try:
        txn = alpha_ensemble_contract.functions.updatePositions().build_transaction({
            'chainId': chain_id,
            'gas': 15000000,
            'gasPrice': galadriel_web3.eth.gas_price,
            'nonce': galadriel_web3.eth.get_transaction_count(account.address),
        })

        signed_txn = galadriel_web3.eth.account.sign_transaction(txn, private_key=private_key)
        tx_hash = galadriel_web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = galadriel_web3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Updated LLM positions on AlphaEnsembleContract with Tx: {tx_hash.hex()}, Status: {receipt['status']}")
        print(f"Gas used: {receipt['gasUsed']}")
    except Exception as e:
        print(f"Failed to update LLM positions in AlphaEnsembleContract on Galadriel: {e}")

def check_upkeep():
    current_time = time.time()
    price_update_needed = (current_time - last_price_update_time) > price_update_interval
    llm_update_needed = (current_time - last_llm_update_time) > llm_update_interval
    return price_update_needed, llm_update_needed

if __name__ == "__main__":
    while True:
        # Check if upkeep is needed
        price_update_needed, llm_update_needed = check_upkeep()

        if price_update_needed:
            # Fetch the latest prices for all assets from Sepolia
            assets, prices = fetch_latest_prices()

            # Update the AlphaEnsembleContract on Galadriel with the latest prices
            update_alpha_ensemble_asset_prices(assets, prices)

            # Update the last price update time
            last_price_update_time = time.time()

        if llm_update_needed:
            # Start LLM process to update positions
            update_alpha_ensemble_llm_positions()

            last_llm_update_time = time.time()

        # Wait for a short period before checking again
        time.sleep(5)
