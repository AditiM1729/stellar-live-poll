#!/bin/bash
# deploy.sh — Deploy and initialize the StellarPoll Soroban contract
# Prerequisites: stellar CLI installed, Rust + wasm32 target installed
#
# Install stellar CLI:  cargo install --locked stellar-cli
# Add wasm target:      rustup target add wasm32-unknown-unknown

set -e

echo "🚀 Building Soroban contract..."
cd contracts/poll
cargo build --target wasm32-unknown-unknown --release
cd ../..

WASM_PATH="contracts/poll/target/wasm32-unknown-unknown/release/poll_contract.wasm"

echo "📦 Deploying to Stellar Testnet..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source "$SECRET_KEY" \
  --network testnet 2>&1 | tail -1)

echo "✅ Deployed! Contract ID: $CONTRACT_ID"

echo "🔧 Initializing poll..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$SECRET_KEY" \
  --network testnet \
  -- initialize \
  --admin "$PUBLIC_KEY" \
  --question "What is the most important Stellar use case in 2025?" \
  --option_a "Cross-border Payments" \
  --option_b "RWA Tokenization" \
  --option_c "DeFi Protocols" \
  --option_d "NFT Platforms"

echo "✅ Poll initialized!"
echo ""
echo "👉 Add this to your .env file:"
echo "VITE_CONTRACT_ID=$CONTRACT_ID"
echo ""
echo "📋 Save this contract ID for your README submission:"
echo "$CONTRACT_ID"
