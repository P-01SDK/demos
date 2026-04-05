# Protocol 01 — SDK Demos

Privacy infrastructure for Solana. Try it yourself.

## Setup

```bash
npm init -y
npm install @protocol-01/zk-sdk
```

## Demos

| File | Use Case | Run |
|------|----------|-----|
| `demo.js` | Shield, Transfer, Verify | `node demo.js` |
| `demo-subscription.js` | Private recurring payments | `node demo-subscription.js` |
| `demo-payroll.js` | Confidential payroll (3 employees) | `node demo-payroll.js` |
| `demo-airdrop.js` | Stealth airdrop (5 recipients) | `node demo-airdrop.js` |
| `demo-otc.js` | Private OTC desk (whale swap) | `node demo-otc.js` |

## What each demo proves

- **Real cryptography** — Poseidon hashing, Merkle trees, nullifiers
- **Unlinkable payments** — each transaction uses unique commitments
- **Zero data exposure** — amounts, senders, receivers all hidden
- **Verifiable** — recompute any commitment to prove correctness

## Links

- npm: [@protocol-01/zk-sdk](https://www.npmjs.com/package/@protocol-01/zk-sdk)
- Site: [protocol-01.dev](https://protocol-01.dev)
- Twitter: [@Protocol01_](https://x.com/Protocol01_)
