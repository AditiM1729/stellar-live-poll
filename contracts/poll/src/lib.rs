//! StellarPoll — Soroban Smart Contract
//! 
//! A live on-chain poll contract that:
//!  - Stores a question and up to 4 options
//!  - Lets each wallet vote once
//!  - Emits events on every vote
//!  - Tracks vote counts per option
//!
//! Deploy to testnet with:
//!   stellar contract deploy --wasm target/wasm32-unknown-unknown/release/poll_contract.wasm \
//!     --source <YOUR_SECRET_KEY> --network testnet
//!
//! After deployment, initialize with:
//!   stellar contract invoke --id <CONTRACT_ID> --source <KEY> --network testnet \
//!     -- initialize \
//!     --question "What is the best Stellar use case?" \
//!     --option_a "Cross-border Payments" \
//!     --option_b "RWA Tokenization" \
//!     --option_c "DeFi Protocols" \
//!     --option_d "NFT Platforms"

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short,
    Address, Env, String, Map, log,
};

// ── Storage keys ─────────────────────────────────────────────────────────────
#[contracttype]
pub enum DataKey {
    Question,
    OptionA,
    OptionB,
    OptionC,
    OptionD,
    VoteCount,   // Map<u32, u32> — option index → count
    Voted,       // Map<Address, bool>
    Admin,
    Initialized,
}

// ── Contract ──────────────────────────────────────────────────────────────────
#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {

    /// Initialize the poll with a question and 4 options.
    /// Can only be called once by the deployer.
    pub fn initialize(
        env: Env,
        admin: Address,
        question: String,
        option_a: String,
        option_b: String,
        option_c: String,
        option_d: String,
    ) {
        // Prevent re-initialization
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Already initialized");
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Question, &question);
        env.storage().instance().set(&DataKey::OptionA, &option_a);
        env.storage().instance().set(&DataKey::OptionB, &option_b);
        env.storage().instance().set(&DataKey::OptionC, &option_c);
        env.storage().instance().set(&DataKey::OptionD, &option_d);

        // Initialize vote counts to 0
        let mut counts: Map<u32, u32> = Map::new(&env);
        counts.set(0u32, 0u32);
        counts.set(1u32, 0u32);
        counts.set(2u32, 0u32);
        counts.set(3u32, 0u32);
        env.storage().instance().set(&DataKey::VoteCount, &counts);

        // Voter registry
        let voted: Map<Address, bool> = Map::new(&env);
        env.storage().instance().set(&DataKey::Voted, &voted);

        env.storage().instance().set(&DataKey::Initialized, &true);

        // Emit init event
        env.events().publish(
            (symbol_short!("poll"), symbol_short!("init")),
            question,
        );
    }

    /// Cast a vote. Each address can vote exactly once.
    /// option_index: 0=A, 1=B, 2=C, 3=D
    pub fn vote(env: Env, voter: Address, option_index: u32) -> u32 {
        voter.require_auth();

        // Error: option out of range
        if option_index > 3 {
            panic!("Invalid option: must be 0–3");
        }

        // Error: already voted
        let mut voted: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&DataKey::Voted)
            .unwrap_or(Map::new(&env));

        if voted.get(voter.clone()).unwrap_or(false) {
            panic!("Already voted");
        }

        // Record vote
        let mut counts: Map<u32, u32> = env
            .storage()
            .instance()
            .get(&DataKey::VoteCount)
            .unwrap();

        let current = counts.get(option_index).unwrap_or(0u32);
        let new_count = current + 1;
        counts.set(option_index, new_count);
        env.storage().instance().set(&DataKey::VoteCount, &counts);

        // Mark voter
        voted.set(voter.clone(), true);
        env.storage().instance().set(&DataKey::Voted, &voted);

        // Emit vote event — frontend listens to this
        env.events().publish(
            (symbol_short!("poll"), symbol_short!("vote")),
            (voter, option_index, new_count),
        );

        log!(&env, "Vote cast: option={}, new_count={}", option_index, new_count);

        new_count
    }

    /// Read current vote counts for all options.
    pub fn get_results(env: Env) -> Map<u32, u32> {
        env.storage()
            .instance()
            .get(&DataKey::VoteCount)
            .unwrap_or(Map::new(&env))
    }

    /// Check if an address has already voted.
    pub fn has_voted(env: Env, voter: Address) -> bool {
        let voted: Map<Address, bool> = env
            .storage()
            .instance()
            .get(&DataKey::Voted)
            .unwrap_or(Map::new(&env));
        voted.get(voter).unwrap_or(false)
    }

    /// Get the poll question.
    pub fn get_question(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Question)
            .unwrap()
    }

    /// Get all option labels.
    pub fn get_options(env: Env) -> (String, String, String, String) {
        (
            env.storage().instance().get(&DataKey::OptionA).unwrap(),
            env.storage().instance().get(&DataKey::OptionB).unwrap(),
            env.storage().instance().get(&DataKey::OptionC).unwrap(),
            env.storage().instance().get(&DataKey::OptionD).unwrap(),
        )
    }
}
