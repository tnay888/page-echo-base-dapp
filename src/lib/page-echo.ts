import type { Address } from "viem";

export const MAX_BOOK_LENGTH = 48;
export const MAX_PAGE_LENGTH = 18;
export const MAX_MOOD_LENGTH = 18;
export const MAX_NOTE_LENGTH = 220;

export const pageEchoAbi = [
  {
    type: "event",
    name: "NoteSaved",
    inputs: [
      { name: "noteId", type: "uint256", indexed: true },
      { name: "reader", type: "address", indexed: true },
      { name: "book", type: "string", indexed: false },
      { name: "pageRef", type: "string", indexed: false },
      { name: "mood", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "saveNote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "book", type: "string" },
      { name: "pageRef", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "noteId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getNote",
    stateMutability: "view",
    inputs: [{ name: "noteId", type: "uint256" }],
    outputs: [
      { name: "reader", type: "address" },
      { name: "book", type: "string" },
      { name: "pageRef", type: "string" },
      { name: "mood", type: "string" },
      { name: "note", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextNoteId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

function isAddressLike(value?: string) {
  return Boolean(value && /^0x[a-fA-F0-9]{40}$/.test(value));
}

const configuredPageEchoContractAddress =
  process.env.NEXT_PUBLIC_PAGE_ECHO_CONTRACT_ADDRESS?.trim();

export const pageEchoContractAddress = isAddressLike(
  configuredPageEchoContractAddress,
)
  ? (configuredPageEchoContractAddress as Address)
  : undefined;
