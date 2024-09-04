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

# Binance WebSocket setup for real-time price updates
binance_socket_url = "wss://stream.binance.com:9443/ws"
binance_symbols = [
    'btcusdt', 'ethusdt', 'bnbusdt', 'adausdt', 'linkusdt', 'solusdt', 'xrpusdt', 'dogeusdt', 'dotusdt', 'maticusdt'
]

# Store real-time prices from Binance WebSocket in a dictionary
real_time_prices = {symbol.upper(): None for symbol in binance_symbols}

# Global WebSocket object to allow proper shutdown
ws = None
stop_websocket_flag = False

# Function to handle WebSocket messages
def on_message(ws, message):
    data = json.loads(message)
    if 's' in data and 'c' in data:
        symbol = data['s'].upper()  # Keep the symbols in uppercase for consistency
        price = float(data['c'])  # Current price
        if symbol in real_time_prices:
            real_time_prices[symbol] = price
            print(f"Real-time {symbol} price from Binance: {price} USD")

def on_error(ws, error):
    print(f"Error in WebSocket: {error}")

def on_close(ws):
    print("WebSocket connection closed")

def on_open(ws):
    # Subscribe to the WebSocket ticker stream for selected symbols
    subscribe_message = {
        "method": "SUBSCRIBE",
        "params": [f"{symbol}@ticker" for symbol in binance_symbols],
        "id": 1
    }
    ws.send(json.dumps(subscribe_message))

# Function to start Binance WebSocket
def start_binance_websocket():
    global ws
    ws = websocket.WebSocketApp(binance_socket_url, on_message=on_message, on_error=on_error, on_close=on_close)
    ws.on_open = on_open
    while not stop_websocket_flag:
        ws.run_forever()
        time.sleep(1)  # Prevents CPU overload in case the WebSocket connection drops

# Upkeep intervals
price_update_interval = 15  # seconds
llm_update_interval = 20  # seconds
last_price_update_time = time.time()
last_llm_update_time = time.time()

# Function to update asset prices on Galadriel based on real-time data
def update_alpha_ensemble_asset_prices():
    try:
        # Remove the "USDT" part of the symbol before pushing on-chain
        assets = [symbol.replace('USDT', '') for symbol in real_time_prices.keys()]
        # Make sure prices correspond to the correct assets in the dictionary
        prices = [int(real_time_prices[symbol] * 1e8) if real_time_prices[symbol] is not None else 0 for symbol in real_time_prices.keys()]

        # Check if assets and prices are properly matched
        print(f"Assets: {assets}")
        print(f"Prices: {prices}")

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

# Function to update positions in AlphaEnsembleContract using LLM
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
    # Start WebSocket in a separate thread
    websocket_thread = threading.Thread(target=start_binance_websocket)
    websocket_thread.start()

    try:
        while True:
            # Check if upkeep is needed
            price_update_needed, llm_update_needed = check_upkeep()

            if price_update_needed and real_time_prices:
                # Update the AlphaEnsembleContract on Galadriel with the latest real-time prices from Binance
                update_alpha_ensemble_asset_prices()

                # Update the last price update time
                last_price_update_time = time.time()

            if llm_update_needed:
                # Start LLM process to update positions
                update_alpha_ensemble_llm_positions()

                last_llm_update_time = time.time()

            # Wait for a short period before checking again
            time.sleep(5)
    except KeyboardInterrupt:
        print("Received stop signal")
        stop_websocket_flag = True
        ws.close()
        websocket_thread.join()  # Ensure WebSocket thread is properly closed
        print("WebSocket closed and program stopped.")
