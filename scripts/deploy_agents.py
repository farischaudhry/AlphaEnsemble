import time
import json
from web3 import Web3
from pathlib import Path
import os
from dotenv import load_dotenv
import websocket
import threading

# Load environment variables from frontend/.env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../frontend/.env.local'))

# Initialize a Web3 instance for Galadriel testnet (to interact with AlphaEnsembleContract)
galadriel_rpc_url = "https://devnet.galadriel.com/"
galadriel_web3 = Web3(Web3.HTTPProvider(galadriel_rpc_url))

# Load the ABI for AlphaEnsembleContract from the JSON file
with open(os.path.join(os.path.dirname(__file__), "../frontend/contracts/AlphaEnsembleABI.json")) as f:
    alpha_ensemble_abi = f.read()

alpha_ensemble_address = os.getenv('NEXT_PUBLIC_ALPHA_ENSEMBLE_ADDRESS')
alpha_ensemble_contract = galadriel_web3.eth.contract(address=alpha_ensemble_address, abi=alpha_ensemble_abi)

private_key = os.getenv('NEXT_PUBLIC_PRIVATE_KEY_GALADRIEL')
account = galadriel_web3.eth.account.from_key(private_key)
chain_id = 696969  # Galadriel testnet chain ID

# Function to deploy 5 agents
def deploy_agents(num_agents=5):
    try:
        for i in range(num_agents):
            strategy_details = f"Strategy for Agent {i+1}"
            txn = alpha_ensemble_contract.functions.deployAgent(strategy_details).build_transaction({
                'chainId': chain_id,
                'gas': 3000000,  # Estimate the gas needed for deployment
                'gasPrice': galadriel_web3.eth.gas_price,
                'nonce': galadriel_web3.eth.get_transaction_count(account.address),
            })

            signed_txn = galadriel_web3.eth.account.sign_transaction(txn, private_key=private_key)
            tx_hash = galadriel_web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            receipt = galadriel_web3.eth.wait_for_transaction_receipt(tx_hash)

            print(f"Deployed Agent {i+1} with Tx: {tx_hash.hex()}, Status: {receipt['status']}")
            time.sleep(10)  # Sleep to avoid nonce issues (optional)
    except Exception as e:
        print(f"Failed to deploy agents: {e}")

def set_oracle_address(address):
    try:
        txn = alpha_ensemble_contract.functions.setOracleAddress(address).build_transaction({
            'chainId': chain_id,
            'gas': 3000000,  # Estimate the gas needed for deployment
            'gasPrice': galadriel_web3.eth.gas_price,
            'nonce': galadriel_web3.eth.get_transaction_count(account.address),
        })

        signed_txn = galadriel_web3.eth.account.sign_transaction(txn, private_key=private_key)
        tx_hash = galadriel_web3.eth.send_raw_transaction(signed_txn.rawTransaction)
        receipt = galadriel_web3.eth.wait_for_transaction_receipt(tx_hash)

        print(f"Set Oracle Address with Tx: {tx_hash.hex()}, Status: {receipt['status']}")
    except Exception as e:
        print(f"Failed to set Oracle address: {e}")

if __name__ == "__main__":
    # Deploy 5 agents
    deploy_agents(num_agents=5)

    # Set Oracle address
    set_oracle_address("0x0352b37E5680E324E804B5A6e1AddF0A064E201D")
    pass
