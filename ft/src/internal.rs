use near_sdk::{require};
use crate::*;

impl Contract {
	pub(crate) fn internal_deposit(&mut self, account_id: &AccountId, amount: Balance) {
    // Get the current balance of the account. If they're not registered, panic.
    let balance = self.internal_unwrap_balance_of(account_id);
    
    // Add the amount to the balance and insert the new balance into the accounts map
    if let Some(new_balance) = balance.checked_add(amount) {
			self.accounts.insert(account_id, &new_balance);
    } else {
			env::panic_str("Balance overflow");
    }
	}

	pub(crate) fn measure_bytes_for_longest_account_id(&mut self) {
		let initial_storage_usage = env::storage_usage();
		let tmp_account_id = AccountId::new_unchecked("a".repeat(64));
		self.accounts.insert(&tmp_account_id, &0u128);
		self.bytes_for_longest_account_id = env::storage_usage() - initial_storage_usage;
		self.accounts.remove(&tmp_account_id);
	}

	pub(crate) fn internal_register_account(&mut self, account_id: &AccountId) {
    if self.accounts.insert(account_id, &0).is_some() {
			env::panic_str("The account is already registered");
    }
	}

	pub(crate) fn internal_unwrap_balance_of(&self, account_id: &AccountId) -> Balance {
		match self.accounts.get(account_id) {
			Some(balance) => balance,
			None => {
				env::panic_str(format!("The account {} is not registered", &account_id).as_str())
			}
		}
	}
	
	pub(crate) fn internal_withdraw(&mut self, account_id: &AccountId, amount: Balance) {
    // Get the current balance of the account. If they're not registered, panic.
    let balance = self.internal_unwrap_balance_of(account_id);
    
    // Decrease the amount from the balance and insert the new balance into the accounts map
    if let Some(new_balance) = balance.checked_sub(amount) {
        self.accounts.insert(account_id, &new_balance);
    } else {
        env::panic_str("The account doesn't have enough balance");
    }
	}

	pub(crate) fn internal_transfer(
    &mut self,
    sender_id: &AccountId,
    receiver_id: &AccountId,
    amount: Balance,
    memo: Option<String>,
) {
    // Ensure the sender can't transfer to themselves
    require!(sender_id != receiver_id, "Sender and receiver should be different");
    // Ensure the sender can't transfer 0 tokens
    require!(amount > 0, "The amount should be a positive number");
    
    // Withdraw from the sender and deposit into the receiver
    self.internal_withdraw(sender_id, amount);
    self.internal_deposit(receiver_id, amount);
    
    // Emit a Transfer event
    FtTransfer {
        old_owner_id: sender_id,
        new_owner_id: receiver_id,
        amount: &U128(amount),
        memo: memo.as_deref(),
    }
    .emit();
	}
}