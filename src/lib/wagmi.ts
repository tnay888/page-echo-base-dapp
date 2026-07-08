"use client";

import { Attribution } from "ox/erc8021";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

export const supportedChains = [base, baseSepolia] as const;

const configuredBuilderCode = process.env.NEXT_PUBLIC_BUILDER_CODE?.trim();

export const builderCode =
  configuredBuilderCode && !configuredBuilderCode.includes("replace_with")
    ? configuredBuilderCode
    : "bc_je5w29ky";

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    baseAccount({
      appName: "Page Echo",
    }),
    injected(),
  ],
  dataSuffix: builderCode
    ? Attribution.toDataSuffix({ codes: [builderCode] })
    : undefined,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
