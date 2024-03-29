[![Tests](https://github.com/charonAMM/incentiveToken/actions/workflows/tests.yml/badge.svg)](https://github.com/charonAMM/incentiveToken/actions/workflows/tests.ymli)

# charon incentive token

<b>Charon</b> is a privacy enabled cross-chain automated market maker (PECCAMM). This is the code for an incentive token to initiate network effects across the system and align motives in a giveen charon system.  It works by minting a token every month via an auction.  Fees from the auction are sent to charon fee contract for distribution for support of liquidity, user rewards, and oracle payments.  The token generates fees from the connected charonAMM contracts on each network. Note this is not a governance token and does not control any features in the system; holders simply get fees. A new charon incentive token is needed upon each redeploy of the system. 

For more information, check out the tokenomics [whitepaper](https://github.com/charonAMM/writings/blob/main/Charon%20Tokenomics.pdf)

## setting up and testing

```sh
npm i
npx hardhat compile
npx hardhat test
```

## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3