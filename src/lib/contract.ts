// FlashTETHER contract ABI + typed call wrappers
// Nile testnet only

export const FLASH_TETHER_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "address", name: "account", type: "address" },
    ],
    name: "FlashBurned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "address", name: "to",        type: "address" },
      { indexed: false, internalType: "uint256", name: "amount",    type: "uint256" },
      { indexed: false, internalType: "uint256", name: "expiresAt", type: "uint256" },
    ],
    name: "FlashMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  internalType: "address", name: "from",  type: "address" },
      { indexed: true,  internalType: "address", name: "to",    type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to",              type: "address" },
      { internalType: "uint256", name: "amount",          type: "uint256" },
      { internalType: "uint256", name: "durationSeconds", type: "uint256" },
    ],
    name: "flashMint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getExpiry",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "timeRemaining",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "pure",
    type: "function",
  },
] as const;

export type FlashMintParams = {
  targetAddress: string;
  amount: bigint;        // in token base units (amount * 10^6)
  durationSeconds: number;
};
