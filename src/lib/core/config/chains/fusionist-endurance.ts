import { defineChain } from 'viem';

export const fusionistEndurance = defineChain({
	id: 648,
	name: 'Fusionist Endurance',
	nativeCurrency: {
		decimals: 18,
		name: 'ACE',
		symbol: 'ACE'
	},
	rpcUrls: {
		default: {
			http: ['https://rpc-endurance.fusionist.io']
		},
		public: {
			http: ['https://rpc-endurance.fusionist.io']
		}
	},
	blockExplorers: {
		default: {
			name: 'Fusionist Explorer',
			url: 'https://explorer-endurance.fusionist.io'
		}
	},
	testnet: true
});
