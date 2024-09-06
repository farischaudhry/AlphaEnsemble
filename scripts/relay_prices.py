import os
import time
from web3 import Web3
from dotenv import load_dotenv

# Load environment variables from frontend/.env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../frontend/.env.local'))

# Initialize Web3 instances for Sepolia and Galadriel networks
sepolia_web3 = Web3(Web3.HTTPProvider(f"https://sepolia.infura.io/v3/{os.getenv('INFURA_PROJECT_ID')}"))
galadriel_web3 = Web3(Web3.HTTPProvider(os.getenv('GALADRIEL_RPC_URL')))

# Contract addresses and ABIs (replace with actual ABIs or paths to ABI files)
sepolia_oracle_address = Web3.to_checksum_address(os.getenv('NEXT_PUBLIC_USD_PRICE_ORACLE_ADDRESS'))
galadriel_receiver_address = Web3.to_checksum_address(os.getenv('NEXT_PUBLIC_GALADRIEL_PRICE_RECEIVER_ADDRESS'))

# Load the ABIs
with open(os.path.join(os.path.dirname(__file__), "USDPriceOracleABI.json")) as f:
    sepolia_oracle_abi = f.read()

with open(os.path.join(os.path.dirname(__file__), "GaladrielPriceReceiverABI.json")) as f:
    galadriel_receiver_abi = f.read()

# Initialize contract instances
sepolia_oracle = sepolia_web3.eth.contract(address=sepolia_oracle_address, abi=sepolia_oracle_abi)
galadriel_receiver = galadriel_web3.eth.contract(address=galadriel_receiver_address, abi=galadriel_receiver_abi)

# Private key and account for sending transactions on Galadriel
private_key = os.getenv('NEXT_PUBLIC_PRIVATE_KEY_GALADRIEL')
account = galadriel_web3.eth.account.from_key(private_key)

# Ensure GALADRIEL_CHAIN_ID is loaded correctly
galadriel_chain_id = os.getenv('GALADRIEL_CHAIN_ID')
if galadriel_chain_id is None:
    raise ValueError("GALADRIEL_CHAIN_ID environment variable is not set.")
chain_id = int(galadriel_chain_id)

def update_oracle_prices():
    try:
        # Assuming the oracle contract has an updatePrices function
        update_txn = sepolia_oracle.functions.updatePrices().build_transaction({
            'from': account.address,
            'gas': 300000,
            'gasPrice': sepolia_web3.eth.gas_price,
            'nonce': sepolia_web3.eth.get_transaction_count(account.address),
        })

        # Sign the transaction
        signed_update_txn = sepolia_web3.eth.account.sign_transaction(update_txn, private_key=private_key)

        # Send the transaction
        update_tx_hash = sepolia_web3.eth.send_raw_transaction(signed_update_txn.rawTransaction)

        # Wait for transaction receipt
        update_receipt = sepolia_web3.eth.wait_for_transaction_receipt(update_tx_hash)
        print(f"Oracle prices updated on Sepolia with Tx: {update_tx_hash.hex()}, Status: {update_receipt['status']}")

    except Exception as e:
        print(f"An error occurred while updating prices on Sepolia: {e}")

def relay_prices():
    assets = sepolia_oracle.functions.getAssets().call()

    for asset in assets:
        try:
            # Fetch price from Sepolia Oracle
            price = sepolia_oracle.functions.getPrice(asset).call()

            # Prepare transaction to update the price on Galadriel
            nonce = galadriel_web3.eth.get_transaction_count(account.address)
            txn = galadriel_receiver.functions.updatePrice(asset, price).build_transaction({
                'chainId': chain_id,  # Use the validated chain_id
                'gas': 200000,
                'gasPrice': galadriel_web3.eth.gas_price,
                'nonce': nonce,
            })

            # Sign the transaction
            signed_txn = galadriel_web3.eth.account.sign_transaction(txn, private_key=private_key)

            # Send the transaction
            tx_hash = galadriel_web3.eth.send_raw_transaction(signed_txn.rawTransaction)

            # Wait for transaction receipt
            receipt = galadriel_web3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"Updated {asset} price on Galadriel with Tx: {tx_hash.hex()}, Status: {receipt['status']}")
        except Exception as e:
            print(f"An error occurred while processing asset {asset}: {e}")

if __name__ == "__main__":
    # Permanent loop with a sleep interval
    try:
        while True:
            update_oracle_prices()  # First, update prices on Sepolia
            relay_prices()  # Then, relay those prices to Galadriel
            time.sleep(30)  # Sleep for 30 seconds before next update
    except KeyboardInterrupt:
        print("Script interrupted by user. Shutting down...")
    except Exception as e:
        print(f"An error occurred: {e}")
