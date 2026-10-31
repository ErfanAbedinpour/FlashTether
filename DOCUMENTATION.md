# FlashTether Lab — Technical Documentation

**Version:** 0.1.0  
**Status:** Academic / training project  
**Intended network:** Tron Nile testnet  
**Author:** Erfan Abedinpour  
**Last updated:** 31 October 2026

This document matches the current codebase (direct mint, no payment modal). For a shorter setup guide, see [README.md](README.md).

> This is **not** official Tether / USDT and **not** money. It is a classroom demo of a time-gated, non-transferable TRC20-style token. Do not use it to impersonate official tokens or deceive anyone.

---

## 1. Overview

Flash TETHER is a Next.js app plus a custom Solidity contract. Each address can hold a **time-limited balance**. After the expiry timestamp, `balanceOf` returns `0` with no burn transaction. Expiry is checked on-chain inside the view function.

The live UI mints **directly**. The user picks an address, an amount tier, and a duration. The browser calls `POST /api/flash-mint`. The server signs `flashMint` with the contract-owner key. There is no payment confirmation step anymore.

`PaymentModal` has been removed. Payment helpers still exist in the repo (`/api/verify-payment`, `verifyTrxPayment`, `PAYMENT_SLIPPAGE`) but the generator does not call them.

---

## 2. System architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Next.js frontend                      │
│  Header · Hero · Generator / Status · UseCases            │
│  HowItWorks · TransactionHistory · FAQ · Footer           │
│                                                           │
│  useFlashGenerator: configuring → minting → success|error │
└────────────────────────────┬─────────────────────────────┘
                             │ POST /api/flash-mint
                             ▼
┌──────────────────────────────────────────────────────────┐
│                   Next.js API (server)                    │
│  1. Validate JSON + Tron address                          │
│  2. display amount × 10^6 → base units                    │
│  3. TronWeb.contract.flashMint().send()                   │
│  4. Append in-memory txStore                              │
│  5. Return mintTxHash, explorer URL, expiresAt, token     │
└────────────────────────────┬─────────────────────────────┘
                             │ owner private key (server only)
                             ▼
┌──────────────────────────────────────────────────────────┐
│              Contract (file: FlashTETHER.sol)             │
│  _raw[to]    = amount                                     │
│  _expiry[to] = block.timestamp + durationSeconds          │
│  balanceOf() → 0 if block.timestamp > _expiry[account]    │
└──────────────────────────────────────────────────────────┘
```

Server Tron helpers live in `src/lib/tron.ts` and must not be imported from client components (they load `TRON_PRIVATE_KEY`).

---

## 3. Smart contract

**File:** `contracts/FlashTETHER.sol`  
**Solidity:** `^0.8.0`  
**Declared contract name in source:** `FlashUSDT`  
**Error prefix used in requires:** `FlashTETHER:`

For a public course repo, use a unique demo `name` / `symbol` (not official Tether marks). Keep `TOKEN` in `src/lib/constants.ts` consistent with the contract.

### 3.1 Storage

```solidity
mapping(address => uint256) private _raw;     // stored balance (base units)
mapping(address => uint256) private _expiry;  // unix timestamp
address public owner;
```

Each address has two values:

- `_raw` — stored amount in base units (6 decimals)
- `_expiry` — unix time after which `balanceOf` is treated as zero

The constructor sets `owner = msg.sender` (the deploying wallet). That same key must be `TRON_PRIVATE_KEY` on the server.

### 3.2 `flashMint`

```solidity
function flashMint(
    address to,
    uint256 amount,
    uint256 durationSeconds
) external onlyOwner {
    require(to != address(0), "FlashTETHER: mint to zero address");
    require(amount > 0, "FlashTETHER: amount must be > 0");
    require(durationSeconds > 0, "FlashTETHER: duration must be > 0");

    _raw[to]    = amount;
    _expiry[to] = block.timestamp + durationSeconds;

    emit Transfer(address(0), to, amount);
    emit FlashMinted(to, amount, _expiry[to]);
}
```

A new mint **overwrites** any previous `_raw` / `_expiry` for that address.

The backend sends this with `feeLimit: 100_000_000` (100 TRX fee cap, in sun).

The comment above `flashMint` in the Solidity file still says “after payment is confirmed”. That is leftover. The app no longer waits for payment.

### 3.3 `balanceOf`

```solidity
function balanceOf(address account) public view returns (uint256) {
    if (block.timestamp > _expiry[account]) return 0;
    return _raw[account];
}
```

- Past expiry → `0`
- Otherwise → `_raw[account]`
- `view` only — no gas for the reader, no burn tx

`rawBalanceOf` returns `_raw` even after expiry (diagnostics). `getExpiry` and `timeRemaining` expose the clock.

### 3.4 TRC20-style surface

Wallets and explorers that support custom tokens typically read:

| Function | Role in this demo |
|---|---|
| `name()` / `symbol()` / `decimals()` | Metadata (6 decimals) |
| `balanceOf(address)` | Time-gated balance |
| `transfer` / `transferFrom` | Revert — non-transferable |
| `approve` | Returns `false` |
| `allowance` | Returns `0` |
| `totalSupply` | Always `0` |

The contract is identified by its **address**, not by the name string. Tokens cannot be sent to someone else.

### 3.5 Events

| Event | When |
|---|---|
| `Transfer(from, to, value)` | Mint (`from = 0`) or burn (`to = 0`) |
| `FlashMinted(to, amount, expiresAt)` | After a successful mint |
| `FlashBurned(account)` | Owner early burn |
| `OwnershipTransferred(previous, next)` | Owner change |

### 3.6 Function reference

| Function | Access | Description |
|---|---|---|
| `flashMint(to, amount, durationSeconds)` | Owner | Write balance + expiry |
| `burn(account)` | Owner | Zero `_raw` and `_expiry` before expiry |
| `transferOwnership(newOwner)` | Owner | Change owner (rejects zero address) |
| `balanceOf(account)` | Public | Balance, or `0` if expired |
| `rawBalanceOf(account)` | Public | Stored amount, ignore expiry |
| `getExpiry(account)` | Public | Expiry unix time (`0` if never set) |
| `timeRemaining(account)` | Public | Seconds left, or `0` |
| `totalSupply()` | Public | Always `0` |
| `transfer` / `transferFrom` | — | Revert (`tokens are non-transferable`) |
| `approve` | — | Returns `false` |
| `allowance` | — | Returns `0` |

---

## 4. Current mint flow

```
1. User opens the generator (default: 100K tier, 24 hours)
2. Enters a Tron address, picks amount + duration
3. Client POST /api/flash-mint
   {
     targetAddress,
     flashAmount,        // display units, e.g. 100000
     durationSeconds     // e.g. 86400
   }
4. API validates fields and address
   /^T[A-HJ-NP-Za-km-z1-9]{33}$/
5. amountBaseUnits = flashAmount × 10^6
6. callFlashMint() via TronWeb + owner key
7. txStore.add({ txHash: "direct-<timestamp>", mintTxHash, … })
8. JSON: success, mintTxHash, contractAddress, tronscanUrl, expiresAt, token
9. UI switches to FlashStatus (countdown + explorer link)
```

Notes:

- `expiresAt` in the API is `Date.now() + durationSeconds * 1000` on the **server clock**, not `getExpiry()` from the chain.
- History `txHash` is a local id (`direct-<ms>`), not a payment transaction.
- Address check is Base58 (no `0`, `O`, `I`, `l`), not a generic `[A-Za-z0-9]` class.

---

## 5. Token amount calculation

```
display amount × 10^decimals = on-chain value
decimals = 6

    50,000 × 10^6 =      50,000,000,000
   100,000 × 10^6 =     100,000,000,000
   500,000 × 10^6 =     500,000,000,000
 1,000,000 × 10^6 =   1,000,000,000,000
```

The API does this conversion. The contract stores base units only.

---

## 6. Expiry

```
Mint block.timestamp = 1_729_727_000
durationSeconds      = 2_592_000          (30 days)
_expiry              = 1_732_319_000

Later balanceOf():
  timestamp 1_730_000_000  → still inside window → returns _raw
  timestamp 1_732_400_000  → past _expiry        → returns 0
```

The check runs on every `balanceOf` call. When a new block’s timestamp is greater than `_expiry`, readers see zero. No cron job, no owner burn required.

The success-screen countdown uses the API `expiresAt` (server time), so it can drift slightly from the on-chain timestamp.

---

## 7. Technical stack

| Layer | Current version / choice |
|---|---|
| App | Next.js **16.4.2** (App Router) |
| UI | React **19.3.0**, Tailwind CSS **4**, Framer Motion 14, Lucide |
| Language | TypeScript 5, path alias `@/*` → `src/*` |
| Chain SDK | TronWeb **6.5.1** |
| Contract | Solidity 0.8+, TVM |
| Token shape | TRC20-like views; transfers disabled |
| History | In-memory singleton (`tx-store.ts`) |
| Price | CoinGecko `simple/price?ids=tron` |
| Package name | `flash-thether` **0.1.0** |

---

## 8. Frontend

Home page: `src/app/page.tsx`. One `useFlashGenerator()` instance is shared by the form and the status panel.

| Stage | What is shown |
|---|---|
| `configuring` | `FlashGenerator` |
| `minting` / `success` / `error` | `FlashStatus` |

### 8.1 Components

| Component | Role |
|---|---|
| `Header` | Top bar |
| `HeroSection` | Intro + animated stats |
| `FlashGenerator` | Address, amount, duration, submit |
| `AmountSelector` | Tiers from `AMOUNT_TIERS` |
| `DurationSelector` | Options from `DURATION_OPTIONS` |
| `FlashStatus` | Spinner, error, or success + `HH:MM:SS` countdown |
| `UseCases` | Stated classroom use cases |
| `HowItWorks` | Three-step explainer (copy still mentions payment) |
| `TransactionHistory` | `GET /api/transactions` |
| `FAQ` | Short Q&A (some answers still mention payment) |
| `Footer` | Footer |
| `TronWalletButton` | TronLink UI (not required for current mint) |

`PaymentModal.tsx` is **deleted**.

### 8.2 Hooks

| Hook | Role |
|---|---|
| `useFlashGenerator` | Form state; `mint()` → `POST /api/flash-mint` |
| `useTrxPrice` | Polls `/api/trx-price` every `PRICE_REFRESH_MS` (30s) |
| `useTronWallet` | TronLink connect / send TRX (unused by the mint path) |

Defaults: **100K** tier (`AMOUNT_TIERS[1]`), **24 hours** (`DURATION_OPTIONS[3]`).

`FlashGenerator` still computes a USD/TRX display price from the selected tier’s `priceUSD`. That is leftover UI. Submit does not charge or wait for TRX.

### 8.3 Amount tiers

| id | Label | Display amount | `priceUSD` (display only) |
|---|---|---|---|
| `50k` | 50K TETHER | 50,000 | 50 |
| `100k` | 100K TETHER | 100,000 | 80 |
| `500k` | 500K TETHER | 500,000 | 190 |
| `1m` | 1M TETHER | 1,000,000 | 310 |

---

## 9. API endpoints

### `POST /api/flash-mint`

Direct owner-signed mint. No payment.

**Request**

```json
{
  "targetAddress": "TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "flashAmount": 100000,
  "durationSeconds": 86400
}
```

**Success (200)**

```json
{
  "success": true,
  "mintTxHash": "<txid>",
  "contractAddress": "T…",
  "tronscanUrl": "<NILE_CONFIG.tronscanBase>/<txid>",
  "expiresAt": 1732319000000,
  "token": "TETHER"
}
```

`token` is `TOKEN.symbol` from `src/lib/constants.ts` (currently `"TETHER"`).

**Errors**

| Status | `error` |
|---|---|
| 400 | `Missing targetAddress` |
| 400 | `Invalid flashAmount` |
| 400 | `Invalid durationSeconds` |
| 400 | `Invalid Tron address` |
| 500 | Message from TronWeb / missing env / contract revert |

### `GET /api/transactions`

Last **20** rows from `txStore`. Each row’s `status` is recomputed: `active` if `Date.now() <= expiresAt`, else `expired`. Store keeps at most **100** mints. Restarting Node clears history.

**Response**

```json
{
  "transactions": [
    {
      "txHash": "direct-1729727000000",
      "mintTxHash": "1580ccb5…",
      "targetAddress": "T…",
      "targetTruncated": "TDHtHB…Q2x4",
      "amount": 100000,
      "durationSeconds": 86400,
      "durationLabel": "1 Day",
      "timestamp": 1729727000000,
      "expiresAt": 1732319000000,
      "status": "active"
    }
  ]
}
```

### `GET /api/trx-price`

Live TRX/USD from CoinGecko.

**Success**

```json
{
  "usd": 0.12,
  "updatedAt": "2026-10-31T11:00:00.000Z"
}
```

On failure the route still returns **200** with `{ usd: 0.12, fallback: true, error }`.

### `POST /api/verify-payment` (unused by UI)

Leftover from the payment flow. Body: `txHash`, `expectedAmountSun`, `receiverAddress`. Checks TronGrid for a successful `TransferContract` to that receiver with amount ≥ expected × (1 − `PAYMENT_SLIPPAGE`) (5%).

---

## 10. Environment

Create `.env.local` (gitignored). Never commit keys.

```env
# Required for mint — owner wallet, 64 hex chars, no 0x
TRON_PRIVATE_KEY=

# Recommended — https://www.trongrid.io/dashboard
TRONGRID_API_KEY=

# Required for mint — deployed contract, T + 33 chars
FLASH_CONTRACT_ADDRESS=

# Leftover — only if you call /api/verify-payment
RECEIVER_ADDRESS=
NEXT_PUBLIC_RECEIVER_ADDRESS=
```

| Variable | Needed for current mint |
|---|---|
| `TRON_PRIVATE_KEY` | Yes |
| `TRONGRID_API_KEY` | Recommended |
| `FLASH_CONTRACT_ADDRESS` | Yes |
| `RECEIVER_ADDRESS` | No |
| `NEXT_PUBLIC_RECEIVER_ADDRESS` | No |

Missing `TRON_PRIVATE_KEY` throws `TRON_PRIVATE_KEY not set in .env.local`.  
Missing `FLASH_CONTRACT_ADDRESS` throws `FLASH_CONTRACT_ADDRESS not set`.

---

## 11. Durations

From `DURATION_OPTIONS` in `src/lib/constants.ts`:

| id | Label | Seconds |
|---|---|---|
| `1h` | 1 Hour | 3,600 |
| `6h` | 6 Hours | 21,600 |
| `12h` | 12 Hours | 43,200 |
| `24h` | 24 Hours | 86,400 |
| `3d` | 3 Days | 259,200 |
| `7d` | 7 Days | 604,800 |
| `14d` | 14 Days | 1,209,600 |
| `30d` | 30 Days | 2,592,000 |
| `60d` | 60 Days | 5,184,000 |
| `90d` | 90 Days | 7,776,000 |
| `180d` | 180 Days | 15,552,000 |
| `365d` | 1 Year | 31,536,000 |

---

## 12. Network config (known mismatch)

`src/lib/constants.ts` exports `NILE_CONFIG`, but the **current values are mainnet TronGrid URLs**:

```ts
fullHost:     "https://api.trongrid.io"
tronscanBase: "https://tronscan.org/#/transaction"
chainId:      "0x2b6653dc"   // mainnet
faucet:       ""
```

`src/lib/tron.ts` is commented “Nile testnet only” and the success UI labels the network **Tron Nile Testnet**.

For this course project, point `NILE_CONFIG` at Nile:

```ts
fullHost:     "https://nile.trongrid.io"
solidityNode: "https://nile.trongrid.io"
eventServer:  "https://nile.trongrid.io"
tronscanBase: "https://nile.tronscan.org/#/transaction"
faucet:       "https://nileex.io/join/getJoinPage"
chainId:      "0xcd8690dc"
```

Do not deploy or mint on mainnet for this assignment.

---

## 13. Running the project

```bash
npm install
# add .env.local
npm run dev      # http://localhost:3000
npm run build
npm start
npm run lint
```

**Nile contract (optional if you already have an address)**

1. Get test TRX: https://nileex.io/join/getJoinPage  
2. TronIDE: https://nileide.tronscan.org  
3. Compile `contracts/FlashTETHER.sol` (Solidity 0.8+)  
4. TronLink on **Nile** → deploy  
5. Put the address in `FLASH_CONTRACT_ADDRESS`

---

## 14. File map

```
contracts/FlashTETHER.sol
src/app/page.tsx
src/app/layout.tsx
src/app/api/flash-mint/route.ts
src/app/api/transactions/route.ts
src/app/api/trx-price/route.ts
src/app/api/verify-payment/route.ts    # leftover
src/hooks/useFlashGenerator.ts
src/hooks/useTrxPrice.ts
src/hooks/useTronWallet.ts             # leftover for mint
src/lib/constants.ts
src/lib/contract.ts                    # ABI
src/lib/tron.ts                        # server TronWeb
src/lib/tx-store.ts
src/lib/utils.ts
```

---

## 15. Leftover / stale copy in the UI

These are still in the tree but are **not** part of the current mint path:

| Item | State |
|---|---|
| `PaymentModal` | Removed |
| `/api/verify-payment` + `verifyTrxPayment` | Present, unused |
| `txStore.isPaymentUsed` / `markPaymentUsed` | Present, unused by flash-mint |
| `HowItWorks` step 02 “Pay in TRX” | Copy only |
| FAQ “after payment is confirmed” | Copy only |
| `FlashGenerator` USD/TRX price line | Display only |
| `useTronWallet` / `TronWalletButton` | Not required to mint |
| Solidity comment “after payment is confirmed” | Outdated |
| `NILE_CONFIG` mainnet hosts | Config bug vs Nile intent |

---

*This document describes the architecture, contract, APIs, and current mint path as of version 0.1.0.*
