# Flash TETHER

**Academic / training project** — a Next.js demo of a time-limited TRC20-style token on the **Tron Nile testnet**.

The app lets a student pick a target Tron address, a display amount, and a duration. A backend route then calls an owner-only `flashMint` function on a custom smart contract. The contract stores a balance plus an expiry timestamp. After that timestamp, `balanceOf` returns `0` with no extra transaction.

> **This is not Tether, not USDT, and not money.**  
> It is a university training project. Do not use it to impersonate official tokens, fake proof of funds, or deceive anyone. Keep it on **Nile testnet** only.

---

## Table of contents

- [What this project is](#what-this-project-is)
- [What this project is not](#what-this-project-is-not)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
- [Smart contract](#smart-contract)
- [API reference](#api-reference)
- [Frontend](#frontend)
- [Nile testnet notes](#nile-testnet-notes)
- [Scripts](#scripts)
- [Safety notes before you push to GitHub](#safety-notes-before-you-push-to-github)
- [Author](#author)

---

## What this project is

A full-stack classroom demo that connects three layers:

1. **UI** — a single-page Next.js app for choosing amount, duration, and a Tron address
2. **API** — Next.js App Router routes that validate input and talk to Tron through TronWeb
3. **Contract** — a Solidity contract with a timestamp-gated `balanceOf` and a non-transferable token design

The learning goals are:

- How a TRC20-like interface (`name`, `symbol`, `decimals`, `balanceOf`) is structured
- How `block.timestamp` can gate a view function
- How a Next.js server route signs a contract call with a server-side private key
- How Tron addresses, base units (`10^6` decimals), and explorers fit together

## What this project is not

- Not official Tether / USDT
- Not a payment processor or exchange
- Not a mainnet product
- Not transferable value — `transfer` and `transferFrom` revert
- Not legal advice

If you publish this repo, treat it as **course source code**, not a service people should run against real funds.

---

## Features

- Amount tiers (50K / 100K / 500K / 1M display units) and durations from 1 hour to 1 year
- Tron address validation on the client and the server
- Direct mint through `POST /api/flash-mint` (no payment step in the current flow)
- Live countdown after a successful mint
- In-memory transaction history for the current Node process
- Optional TRX/USD price fetch from CoinGecko (used by leftover payment UI helpers)
- TronLink wallet hook (present in the codebase; the current mint path does not require it)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Framer Motion |
| Chain SDK | TronWeb 6 |
| Contract | Solidity `^0.8.0` |
| Network (intended) | Tron Nile testnet |
| Language | TypeScript |

---

## Architecture

```
Browser (React)
  │  configure amount + duration + address
  │  POST /api/flash-mint
  ▼
Next.js API route
  │  validate Tron address
  │  convert display amount → base units (× 10^6)
  │  TronWeb + owner private key
  ▼
Flash contract on Nile
  │  _raw[to]    = amount
  │  _expiry[to] = block.timestamp + duration
  │  balanceOf() returns 0 after expiry
  ▼
Response: tx hash, explorer URL, expiresAt
```

Mint state on the client is a small state machine in `useFlashGenerator`:

`configuring` → `minting` → `success` | `error`

---

## Repository structure

```
flash-thether/
├── contracts/
│   └── FlashTETHER.sol          # Time-gated, non-transferable token
├── public/                      # Static assets
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── flash-mint/      # POST — owner-signed mint
│   │   │   ├── transactions/    # GET  — last 20 in-memory mints
│   │   │   ├── trx-price/       # GET  — TRX/USD from CoinGecko
│   │   │   └── verify-payment/  # POST — leftover TRX payment check
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx             # Landing page composition
│   ├── components/              # Header, generator, status, FAQ, …
│   ├── hooks/
│   │   ├── useFlashGenerator.ts
│   │   ├── useTronWallet.ts
│   │   └── useTrxPrice.ts
│   └── lib/
│       ├── constants.ts         # Amounts, durations, network config
│       ├── contract.ts          # ABI
│       ├── tron.ts              # Server-only TronWeb helpers
│       ├── tx-store.ts          # In-memory history
│       └── utils.ts
├── DOCUMENTATION.md             # Longer internal notes
├── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** 18 or newer (20 LTS recommended)
- **npm** (this repo includes `package-lock.json`)
- A **Nile testnet** Tron address with test TRX
- A **TronGrid** API key from [the TronGrid dashboard](https://www.trongrid.io/dashboard)
- The educational contract deployed on **Nile**, with the same wallet as contract owner

Get Nile test TRX from the official faucet: [nileex.io](https://nileex.io/join/getJoinPage)

---

## Environment variables

Create `.env.local` in the project root. **Never commit this file.** `.gitignore` already ignores `.env*`.

```env
# Owner wallet private key — 64 hex chars, no 0x prefix
# Used only on the server to sign flashMint
TRON_PRIVATE_KEY=

# TronGrid key for RPC
TRONGRID_API_KEY=

# Deployed contract on Nile (starts with T, 34 chars)
FLASH_CONTRACT_ADDRESS=

# Optional — only needed if you revive the payment-verification flow
RECEIVER_ADDRESS=
NEXT_PUBLIC_RECEIVER_ADDRESS=
```

| Variable | Required for mint | Where it is used |
|---|---|---|
| `TRON_PRIVATE_KEY` | Yes | `src/lib/tron.ts` — server TronWeb instance |
| `TRONGRID_API_KEY` | Recommended | RPC headers |
| `FLASH_CONTRACT_ADDRESS` | Yes | `flashMint` target + API response |
| `RECEIVER_ADDRESS` | No (current flow) | Payment verification helper |
| `NEXT_PUBLIC_RECEIVER_ADDRESS` | No (current flow) | Browser display, if used |

The owner key must belong to the address that **deployed** the contract (`onlyOwner` on `flashMint`).

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/flash-thether.git
cd flash-thether
npm install
```

### 2. Point the app at Nile

In `src/lib/constants.ts`, `NILE_CONFIG` should use Nile endpoints, not mainnet:

```ts
export const NILE_CONFIG = {
  fullHost:     "https://nile.trongrid.io",
  solidityNode: "https://nile.trongrid.io",
  eventServer:  "https://nile.trongrid.io",
  tronscanBase: "https://nile.tronscan.org/#/transaction",
  faucet:       "https://nileex.io/join/getJoinPage",
  chainId:      "0xcd8690dc", // Nile
};
```

If those values still point at `https://api.trongrid.io`, change them before you run the project. This course repo is meant for testnet only.

### 3. Use a classroom token name

In `contracts/FlashTETHER.sol`, **do not keep official Tether branding**. For a university repo use a unique demo name and symbol, for example:

```solidity
string public name = "Flash Demo Token";
string public symbol = "FDEMO";
```

Also keep `TOKEN` in `src/lib/constants.ts` consistent with the contract.

### 4. Deploy the contract on Nile (optional if you already have an address)

1. Fund the owner wallet with Nile test TRX
2. Open [Nile TronIDE](https://nileide.tronscan.org)
3. Paste `contracts/FlashTETHER.sol`
4. Compile with Solidity 0.8+
5. Connect TronLink on **Nile** and deploy
6. Copy the contract address into `.env.local` as `FLASH_CONTRACT_ADDRESS`

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Try a mint

1. Enter a valid Nile Tron address (`T` + 33 more Base58 characters)
2. Pick an amount tier and a duration
3. Submit the generator form
4. Wait for the success panel: transaction hash, explorer link, countdown

Production-style run (after `npm run build`):

```bash
npm run build
npm start
```

---

## Smart contract

File: [`contracts/FlashTETHER.sol`](contracts/FlashTETHER.sol)

### Storage

| Mapping | Meaning |
|---|---|
| `_raw[address]` | Stored amount in base units |
| `_expiry[address]` | Unix time after which `balanceOf` is `0` |

### `balanceOf`

```solidity
function balanceOf(address account) public view returns (uint256) {
    if (block.timestamp > _expiry[account]) return 0;
    return _raw[account];
}
```

This is a `view` function. After expiry, readers see zero without a burn transaction.

### Amount math

TRC20-style tokens store the smallest unit. This contract uses **6 decimals**:

```
display amount × 10^6 = on-chain value

100_000 × 10^6 = 100_000_000_000
```

The API performs that conversion before calling `flashMint`.

### Function summary

| Function | Access | Role |
|---|---|---|
| `flashMint(to, amount, durationSeconds)` | Owner | Write balance + expiry |
| `burn(account)` | Owner | Clear a balance early |
| `transferOwnership(newOwner)` | Owner | Change owner |
| `balanceOf(account)` | Public | Balance, or `0` if expired |
| `rawBalanceOf(account)` | Public | Stored amount, ignore expiry |
| `getExpiry(account)` | Public | Expiry unix time |
| `timeRemaining(account)` | Public | Seconds left, or `0` |
| `totalSupply()` | Public | Always `0` in this demo |
| `transfer` / `transferFrom` | — | Revert (non-transferable) |
| `approve` | — | Returns `false` |

Non-transferable tokens are intentional: the demo is about **time-gated visibility**, not circulating supply.

---

## API reference

### `POST /api/flash-mint`

Creates a flash balance. No payment step in the current implementation.

**Request**

```json
{
  "targetAddress": "TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "flashAmount": 100000,
  "durationSeconds": 86400
}
```

**Success**

```json
{
  "success": true,
  "mintTxHash": "<txid>",
  "contractAddress": "T…",
  "tronscanUrl": "https://nile.tronscan.org/#/transaction/<txid>",
  "expiresAt": 1732319000000,
  "token": "TETHER"
}
```

**Errors**

- `400` — missing fields or invalid Tron address
- `500` — RPC / contract / missing env

### `GET /api/transactions`

Returns up to 20 recent mints from an **in-memory** store. History resets when the Node process restarts.

### `GET /api/trx-price`

Returns `{ usd, updatedAt }` from CoinGecko. On failure it falls back to `0.12`.

### `POST /api/verify-payment`

Legacy helper: checks a TRX transfer on TronGrid (recipient, amount, success). The live generator does not call this anymore.

---

## Frontend

The home page is composed in `src/app/page.tsx`:

| Component | Role |
|---|---|
| `Header` | Top navigation |
| `HeroSection` | Intro |
| `FlashGenerator` | Form: amount, duration, address |
| `FlashStatus` | Minting / success / error + countdown |
| `UseCases` | Stated classroom use cases |
| `HowItWorks` | Three-step explainer |
| `TransactionHistory` | Recent mints from `/api/transactions` |
| `FAQ` | Short Q&A |
| `Footer` | Footer |

Client hooks:

- `useFlashGenerator` — form state and mint request
- `useTrxPrice` — polls `/api/trx-price`
- `useTronWallet` — TronLink connect / send TRX (not required for the current mint path)

`src/lib/tron.ts` is **server-only**. Do not import it from client components; it loads the owner private key.

---

## Nile testnet notes

| Item | Value |
|---|---|
| RPC | `https://nile.trongrid.io` |
| Explorer | [nile.tronscan.org](https://nile.tronscan.org) |
| IDE | [nileide.tronscan.org](https://nileide.tronscan.org) |
| Faucet | [nileex.io](https://nileex.io/join/getJoinPage) |
| Address format | `T` + 33 Base58 characters |

Nile TRX has no real-world value. Never send mainnet TRX or mainnet private keys into this project.

The transaction list lives in `src/lib/tx-store.ts` as a process singleton. It is fine for a demo, not for a graded “production backend” claim unless you replace it with a database.

---

## Scripts

```bash
npm run dev      # development server (Turbopack)
npm run build    # production build
npm start        # serve the production build
npm run lint     # ESLint
```

---

## Safety notes before you push to GitHub

1. Confirm `.env.local` is not committed (`git status` should not list secrets).
2. Rotate any key that was ever pasted into chat, screenshots, or a public file.
3. Keep RPC and explorer URLs on **Nile**.
4. Rename the token away from official Tether / USDT marks before the repo is public.
5. State in the repo description that this is a course demo, not a financial product.

---

## Author

**Erfan Abedinpour** — university training project.

---

## License

Private course work unless you add a license file. If you make the repository public, add an explicit license (for example MIT) so others know how they may use the code.
