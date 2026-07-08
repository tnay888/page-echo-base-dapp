"use client";

import {
  Bookmark,
  BookOpen,
  Library,
  Loader2,
  Search,
  Sparkles,
  Stamp,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  MAX_BOOK_LENGTH,
  MAX_MOOD_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_PAGE_LENGTH,
  pageEchoAbi,
  pageEchoContractAddress,
} from "@/lib/page-echo";

const MOODS = ["Marked", "Curious", "Heavy", "Bright"] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return "--";
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid book")) return "Book needs 1 to 48 characters.";
  if (error.message.includes("Invalid page")) return "Page needs 1 to 18 characters.";
  if (error.message.includes("Invalid mood")) return "Choose a short mood.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 220 characters.";
  return error.message;
}

function ReadingCard({
  book,
  pageRef,
  mood,
  note,
  reader,
  createdAt,
}: {
  book: string;
  pageRef: string;
  mood: string;
  note: string;
  reader?: Address;
  createdAt?: bigint;
}) {
  const accent =
    mood === "Bright"
      ? "border-[#d7892f] bg-[#fff0bf] text-[#5b3717]"
      : mood === "Heavy"
        ? "border-[#3d4a63] bg-[#dbe2ea] text-[#253047]"
        : mood === "Curious"
          ? "border-[#3f7f74] bg-[#dff5ec] text-[#1d5149]"
          : "border-[#b95d44] bg-[#ffe0d4] text-[#6f2d1c]";

  return (
    <article className="relative overflow-hidden rounded-[8px] border-2 border-[#493525] bg-[#f8edd8] p-5 text-[#2a2118] shadow-[0_28px_90px_rgba(58,38,20,0.2)] sm:p-7">
      <div className="absolute left-0 top-0 h-full w-7 bg-[#b95d44]" />
      <div className="absolute right-8 top-8 grid h-24 w-24 place-items-center rounded-full border-4 border-[#493525] text-[#b95d44] opacity-80">
        <Stamp className="h-12 w-12" />
      </div>
      <div className="relative pl-3">
        <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#7a5437]">
          Page Echo
        </p>
        <h2 className="mt-4 max-w-3xl break-words text-5xl font-black leading-none sm:text-7xl">
          {book || "Untitled book"}
        </h2>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border-2 border-[#493525] bg-[#493525] px-4 py-2 text-sm font-black text-[#f8edd8]">
            Page {pageRef || "--"}
          </span>
          <span className={`rounded-full border-2 px-4 py-2 text-sm font-black ${accent}`}>
            {mood}
          </span>
        </div>

        <section className="mt-8 rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#b95d44]" />
            <h3 className="text-xl font-black">Reading note</h3>
          </div>
          <p className="mt-4 min-h-[230px] whitespace-pre-wrap text-2xl font-bold leading-10">
            {note || "Write the thought before the page closes."}
          </p>
        </section>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
              Reader
            </p>
            <p className="mt-2 text-xl font-black">{shortAddress(reader)}</p>
          </div>
          <div className="rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] p-4">
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
              Saved
            </p>
            <p className="mt-2 text-xl font-black">{formatDate(createdAt)}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PageEchoApp() {
  const [noteIdInput, setNoteIdInput] = useState("1");
  const [book, setBook] = useState("The Invisible Library");
  const [pageRef, setPageRef] = useState("128");
  const [mood, setMood] = useState<(typeof MOODS)[number]>("Marked");
  const [note, setNote] = useState(
    "A small sentence can turn a whole room. This page felt like a door left open on purpose.",
  );
  const [status, setStatus] = useState("Save a reading note on Base.");
  const [lastAction, setLastAction] = useState<"create" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContractAsync,
    isPending: writing,
  } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  const selectedConnector =
    connectors.find((connector) => connector.id === "injected") ??
    connectors.find((connector) => connector.id === "baseAccount") ??
    connectors[0];
  const parsedNoteId = BigInt(Math.max(1, Number(noteIdInput || "1")));

  const noteQuery = useReadContract({
    abi: pageEchoAbi,
    address: pageEchoContractAddress,
    functionName: "getNote",
    args: [parsedNoteId],
    query: {
      enabled: Boolean(pageEchoContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: pageEchoAbi,
    address: pageEchoContractAddress,
    functionName: "nextNoteId",
    query: {
      enabled: Boolean(pageEchoContractAddress),
      refetchInterval: 12000,
    },
  });

  const tuple = noteQuery.data as
    | readonly [Address, string, string, string, string, bigint]
    | undefined;

  const liveNote = useMemo(
    () =>
      tuple
        ? {
            reader: tuple[0],
            book: tuple[1],
            pageRef: tuple[2],
            mood: tuple[3],
            note: tuple[4],
            createdAt: tuple[5],
          }
        : undefined,
    [tuple],
  );

  const totalNotes = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    book.trim().length > 0 &&
    book.trim().length <= MAX_BOOK_LENGTH &&
    pageRef.trim().length > 0 &&
    pageRef.trim().length <= MAX_PAGE_LENGTH &&
    mood.trim().length > 0 &&
    mood.trim().length <= MAX_MOOD_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH;

  const createBlocker = !pageEchoContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_PAGE_ECHO_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill book, page, mood, and note."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "create") return;

    void totalQuery.refetch();
    void noteQuery.refetch();

    const logs = parseEventLogs({
      abi: pageEchoAbi,
      logs: receipt.logs,
      eventName: "NoteSaved",
    });
    const noteId = logs[0]?.args.noteId;

    window.setTimeout(() => {
      if (noteId) setNoteIdInput(noteId.toString());
      setStatus(
        noteId
          ? `Page Echo #${noteId.toString()} saved on Base.`
          : "Page Echo saved on Base. Load the newest Note ID.",
      );
    }, 0);
  }, [lastAction, noteQuery, receipt, totalQuery]);

  async function connectWallet() {
    const connectorQueue = [
      connectors.find((connector) => connector.id === "injected"),
      connectors.find((connector) => connector.id === "baseAccount"),
      selectedConnector,
    ]
      .filter((connector): connector is NonNullable<typeof selectedConnector> =>
        Boolean(connector),
      )
      .filter(
        (connector, index, queue) =>
          queue.findIndex((item) => item.id === connector.id) === index,
      );

    if (connectorQueue.length === 0) {
      setStatus("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }

    let lastError: unknown;
    setStatus("Opening wallet connection...");

    for (const connector of connectorQueue) {
      try {
        await connectAsync({ connector });
        setStatus("Wallet connected. Save a reading note when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }

    setStatus(friendlyError(lastError));
  }

  async function saveNote() {
    const contractAddress = pageEchoContractAddress;

    if (createBlocker) {
      setStatus(createBlocker);
      return;
    }

    if (!contractAddress) {
      setStatus("Contract not deployed yet. Run npm run deploy:contract first.");
      return;
    }

    try {
      setLastAction("create");
      setStatus("Confirm your reading note in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: pageEchoAbi,
        functionName: "saveNote",
        args: [book.trim(), pageRef.trim(), mood.trim(), note.trim()],
        chainId: base.id,
      });
      setStatus("Reading note sent. Waiting for Base confirmation...");
    } catch (error) {
      setStatus(friendlyError(error));
    }
  }

  const previewBook = liveNote?.book || book;
  const previewPage = liveNote?.pageRef || pageRef;
  const previewMood = liveNote?.mood || mood;
  const previewNote = liveNote?.note ?? note;

  return (
    <main className="min-h-screen bg-[#eee1c8] text-[#2a2118]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[390px_minmax(0,1fr)] lg:px-6">
        <aside className="rounded-[8px] border-2 border-[#493525] bg-[#f8edd8] p-4 shadow-[0_20px_80px_rgba(58,38,20,0.16)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[#7a5437]">
                Page Echo
              </p>
              <h1 className="mt-2 text-4xl font-black leading-none">
                Save a page note.
              </h1>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] border-2 border-[#493525] bg-[#ffe0d4]">
              <Bookmark className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] p-3">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
                Notes
              </p>
              <p className="mt-2 text-3xl font-black">{totalNotes}</p>
            </div>
            <div className="rounded-[8px] border-2 border-[#493525] bg-[#493525] p-3 text-[#f8edd8]">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#f0c99e]">
                Chain
              </p>
              <p className="mt-2 text-xl font-black">Base</p>
            </div>
          </div>

          <section className="mt-4 rounded-[8px] border-2 border-[#493525] bg-[#fff1d2] p-4">
            <h2 className="text-xl font-black">New note</h2>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
                  Book
                </span>
                <input
                  value={book}
                  onChange={(event) => setBook(event.target.value)}
                  maxLength={MAX_BOOK_LENGTH}
                  className="mt-1 w-full rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] px-3 py-3 font-black outline-none"
                />
              </label>

              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
                  Page
                </span>
                <input
                  value={pageRef}
                  onChange={(event) => setPageRef(event.target.value)}
                  maxLength={MAX_PAGE_LENGTH}
                  className="mt-1 w-full rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] px-3 py-3 font-bold outline-none"
                />
              </label>

              <div>
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
                  Mood
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {MOODS.map((value) => (
                    <button
                      key={value}
                      className={`rounded-[8px] border-2 px-2 py-3 text-sm font-black ${
                        value === mood
                          ? "border-[#493525] bg-[#493525] text-[#f8edd8]"
                          : "border-[#493525] bg-[#fff8e9]"
                      }`}
                      onClick={() => setMood(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
                  Note
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={MAX_NOTE_LENGTH}
                  rows={5}
                  className="mt-1 w-full rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] px-3 py-3 text-sm font-bold leading-6 outline-none"
                />
              </label>
            </div>
          </section>

          <div className="mt-4 space-y-3">
            {isConnected && chainId !== base.id ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-[#493525] bg-[#ffe0d4] px-4 py-3 font-black disabled:opacity-60"
                disabled={switching}
                onClick={() => switchChain({ chainId: base.id })}
              >
                {switching ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Switch to Base
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#b95d44] px-4 py-3 font-black text-[#fff8e9] disabled:opacity-60"
                disabled={writing || confirming}
                onClick={saveNote}
              >
                {writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Save Page Note
              </button>
            )}

            {isConnected ? (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] px-4 py-3 font-black"
                onClick={disconnectWallet}
              >
                {shortAddress(address)}
              </button>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] px-4 py-3 font-black disabled:opacity-60"
                disabled={!selectedConnector || connecting}
                onClick={connectWallet}
              >
                {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                Connect wallet
              </button>
            )}

            <p className="rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] px-3 py-3 text-sm font-bold leading-6">
              {status}
            </p>
            {hash ? (
              <a
                className="block rounded-[8px] border-2 border-[#493525] bg-[#493525] px-3 py-3 text-xs font-black leading-5 text-[#f8edd8] underline"
                href={`https://basescan.org/tx/${hash}`}
                rel="noreferrer"
                target="_blank"
              >
                View transaction on BaseScan
              </a>
            ) : null}
            {createBlocker && isConnected ? (
              <p className="rounded-[8px] border-2 border-[#493525] bg-[#fff1d2] px-3 py-3 text-xs font-bold leading-5">
                {createBlocker}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="grid gap-4">
          <ReadingCard
            book={previewBook}
            pageRef={previewPage}
            mood={previewMood}
            note={previewNote}
            reader={liveNote?.reader}
            createdAt={liveNote?.createdAt}
          />

          <div className="grid gap-4 xl:grid-cols-[330px_minmax(0,1fr)]">
            <div className="rounded-[8px] border-2 border-[#493525] bg-[#f8edd8] p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                <h2 className="text-2xl font-black">Load note</h2>
              </div>
              <label className="mt-4 block">
                <span className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
                  Note ID
                </span>
                <input
                  value={noteIdInput}
                  onChange={(event) =>
                    setNoteIdInput(event.target.value.replace(/\D/g, ""))
                  }
                  className="mt-1 w-full rounded-[8px] border-2 border-[#493525] bg-[#fff8e9] px-3 py-3 text-2xl font-black outline-none"
                />
              </label>
            </div>

            <div className="rounded-[8px] border-2 border-[#493525] bg-[#f8edd8] p-4">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-[#7a5437]">
                What it does
              </p>
              <p className="mt-3 max-w-xl text-sm font-bold leading-6">
                Page Echo saves a reading note with book, page, mood, reader
                wallet, and timestamp on Base.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#493525] bg-[#fff8e9] px-3 py-2 text-xs font-black">
                  <Library className="h-4 w-4 text-[#b95d44]" /> Reading note
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#493525] bg-[#fff8e9] px-3 py-2 text-xs font-black">
                  <Bookmark className="h-4 w-4 text-[#b95d44]" /> Page marker
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
