// near api js
import { providers } from 'near-api-js';

import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupModal } from "@near-wallet-selector/modal-ui";
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';

import LedgerIconUrl from '@near-wallet-selector/ledger/assets/ledger-icon.png';
import MyNearIconUrl from '@near-wallet-selector/my-near-wallet/assets/my-near-wallet-icon.png';



const THIRTY_TGAS = '30000000000000';
const NO_DEPOSIT = '0';

export class Wallet {
	walletSelector: any;
	wallet: any;
	network: any;
	createAccessKeyFor: any;
	accountId: any;

	constructor({ createAccessKeyFor = undefined, network = 'testnet' }) {
    // Login to a wallet passing a contractId will create a local
    // key, so the user skips signing non-payable transactions.
    // Omitting the accountId will result in the user being
    // asked to sign all transactions.
    this.createAccessKeyFor = createAccessKeyFor
    this.network = network
  }

	async startUp() {
		this.walletSelector = await setupWalletSelector({
			network: this.network,
			modules: [setupMyNearWallet({ iconUrl: MyNearIconUrl })]
		})

		const isSignedIn = this.walletSelector.isSignedIn();

		if (isSignedIn) {
			this.wallet = await this.walletSelector.wallet();
			this.accountId = this.walletSelector.store.getState().accounts[0].accountId;
		}

		return isSignedIn;
	}

	// Sign-in method
  signIn() {
    const description = '연결할 지갑을 선택해주세요.';
    const modal = setupModal(this.walletSelector, { contractId: this.createAccessKeyFor, description });
    modal.show();
  }

	// Sign-out method
  signOut() {
    this.wallet.signOut();
    this.wallet = this.accountId = this.createAccessKeyFor = null;
    window.location.replace(window.location.origin + window.location.pathname);
  }


	// Make a read-only call to retrieve information from the network
  async viewMethod({ contractId, method, args = {} }: {
		contractId: any,
		method: any,
		args: any,
	}) {
    const { network } = this.walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    let res = await provider.query({
      request_type: 'call_function',
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
		// @ts-ignore
    return JSON.parse(Buffer.from(res.result).toString());
  }

  // Call a method that changes the contract's state
  async callMethod({ contractId, method, args = {}, gas = THIRTY_TGAS, deposit = NO_DEPOSIT }: {
		contractId: any,
		method: any,
		args: any,
		gas: any,
		deposit: any
	}) {
    // Sign a transaction with the "FunctionCall" action
    const outcome = await this.wallet.signAndSendTransaction({
      signerId: this.accountId,
      receiverId: contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: method,
            args,
            gas,
            deposit,
          },
        },
      ],
    });

    return providers.getTransactionLastResult(outcome)
  }

  // Get transaction result from the network
  async getTransactionResult(txhash: any) {
    const { network } = this.walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    // Retrieve transaction result from the network
    const transaction = await provider.txStatus(txhash, 'unnused');
    return providers.getTransactionLastResult(transaction);
  }
}
