import { isIP } from "node:net";
import { TextDecoder } from "node:util";

export type ProductSourceRetrieval =
  | {
      status: "AVAILABLE";
      requestedUrl: string;
      finalUrl: string;
      retrievedAt: string;
      contentType: string;
      content: string;
    }
  | {
      status: "UNAVAILABLE" | "FAILED";
      reason: string;
    };

export interface ProductSourceRetriever {
  retrieve(
    sourceUrl: string,
    signal?: AbortSignal
  ): Promise<ProductSourceRetrieval>;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);

  if (
    parts.length !== 4 ||
    parts.some(
      (part) =>
        !Number.isInteger(part) ||
        part < 0 ||
        part > 255
    )
  ) {
    return false;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname
    .toLocaleLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "");

  const mappedIpv4DottedMatch = normalized.match(
    /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/
  );

  if (
    mappedIpv4DottedMatch &&
    isPrivateIpv4(mappedIpv4DottedMatch[1])
  ) {
    return true;
  }

  const mappedIpv4HexMatch = normalized.match(
    /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/
  );

  if (mappedIpv4HexMatch) {
    const high = parseInt(mappedIpv4HexMatch[1], 16);
    const low = parseInt(mappedIpv4HexMatch[2], 16);

    const mappedIpv4 = [
      high >> 8,
      high & 0xff,
      low >> 8,
      low & 0xff,
    ].join(".");

    if (isPrivateIpv4(mappedIpv4)) {
      return true;
    }
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

/**
 * Syntactic first-line policy for externally discovered product-source URLs.
 *
 * IMPORTANT:
 * This is not the complete SSRF defence. A network retriever must additionally
 * resolve hostnames and reject private/reserved addresses before connecting,
 * then revalidate every redirect destination.
 */
export function validateProductSourceUrl(
  value: string
): URL | null {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.port
  ) {
    return null;
  }

  const hostname = parsed.hostname.toLocaleLowerCase();

  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost")
  ) {
    return null;
  }

  const ipVersion = isIP(
    hostname.replace(/^\[/, "").replace(/\]$/, "")
  );

  if (
    (ipVersion === 4 && isPrivateIpv4(hostname)) ||
    (ipVersion === 6 && isPrivateIpv6(hostname))
  ) {
    return null;
  }

  return parsed;
}

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_BYTES = 1_000_000;
const DEFAULT_MAX_REDIRECTS = 5;

const ALLOWED_CONTENT_TYPES = [
  "text/html",
  "text/plain",
  "application/json",
  "application/ld+json",
] as const;

type DnsAddress = {
  address: string;
  family: number;
};

export type ProductSourceNetworkDependencies = {
  lookup: (
    hostname: string
  ) => Promise<DnsAddress[]>;
  fetch: typeof fetch;
};

export type ProductSourceRetrieverOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  network?: ProductSourceNetworkDependencies;
};

function isUnsafeResolvedAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) {
    return isPrivateIpv4(address);
  }

  if (version === 6) {
    return isPrivateIpv6(address);
  }

  return true;
}

async function defaultLookup(
  hostname: string
): Promise<DnsAddress[]> {
  const { promises: dns } = await import("node:dns");

  return dns.lookup(hostname, {
    all: true,
    verbatim: true,
  });
}

async function resolvePublicAddresses(
  url: URL,
  lookup: ProductSourceNetworkDependencies["lookup"]
): Promise<DnsAddress[]> {
  const literalHostname = url.hostname
    .replace(/^\[/, "")
    .replace(/\]$/, "");

  const literalVersion = isIP(literalHostname);

  if (literalVersion !== 0) {
    if (isUnsafeResolvedAddress(literalHostname)) {
      throw new Error("UNSAFE_SOURCE_ADDRESS");
    }

    return [
      {
        address: literalHostname,
        family: literalVersion,
      },
    ];
  }

  const addresses = await lookup(url.hostname);

  if (
    addresses.length === 0 ||
    addresses.some(
      ({ address, family }) =>
        (family !== 4 && family !== 6) ||
        isIP(address) !== family ||
        isUnsafeResolvedAddress(address)
    )
  ) {
    throw new Error("UNSAFE_SOURCE_ADDRESS");
  }

  return addresses;
}

export function createPinnedLookup(
  addresses: readonly DnsAddress[]
) {
  if (addresses.length === 0) {
    throw new Error("PINNED_ADDRESS_SET_EMPTY");
  }

  let nextAddressIndex = 0;

  return (
    _hostname: string,
    options: unknown,
    callback: (...args: any[]) => void
  ): void => {
    const wantsAll =
      typeof options === "object" &&
      options !== null &&
      "all" in options &&
      (options as { all?: boolean }).all === true;

    if (wantsAll) {
      callback(
        null,
        addresses.map(({ address, family }) => ({
          address,
          family,
        }))
      );
      return;
    }

    const selected =
      addresses[
        nextAddressIndex % addresses.length
      ];

    nextAddressIndex += 1;

    callback(
      null,
      selected.address,
      selected.family
    );
  };
}

type PinnedFetchResult = {
  response: Response;
  close: () => Promise<void>;
};

async function fetchWithPinnedResolution(
  url: URL,
  addresses: DnsAddress[],
  signal: AbortSignal
): Promise<PinnedFetchResult> {
  const {
    Agent,
    buildConnector,
    fetch: undiciFetch,
  } = await import("undici");

  const connector = buildConnector({
    lookup: createPinnedLookup(addresses),
  });

  const dispatcher = new Agent({
    connect: connector,
  });

  try {
    const response = (await undiciFetch(
      url.toString(),
      {
        method: "GET",
        redirect: "manual",
        signal,
        headers: {
          accept:
            "text/html,text/plain,application/json,application/ld+json",
        },
        dispatcher,
      }
    )) as unknown as Response;

    return {
      response,
      close: async () => {
        await dispatcher.close();
      },
    };
  } catch (error) {
    await dispatcher.close();
    throw error;
  }
}

function isAllowedContentType(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const mime = value
    .split(";", 1)[0]
    .trim()
    .toLocaleLowerCase();

  return ALLOWED_CONTENT_TYPES.some(
    (allowed) => mime === allowed
  );
}

async function readBoundedText(
  response: Response,
  maxBytes: number
): Promise<string> {
  const declaredLength = Number(
    response.headers.get("content-length")
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maxBytes
  ) {
    throw new Error("SOURCE_TOO_LARGE");
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let content = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      bytesRead += value.byteLength;

      if (bytesRead > maxBytes) {
        throw new Error("SOURCE_TOO_LARGE");
      }

      content += decoder.decode(value, {
        stream: true,
      });
    }

    content += decoder.decode();
    return content;
  } finally {
    reader.releaseLock();
  }
}

export function createProductSourceRetriever(
  options: ProductSourceRetrieverOptions = {}
): ProductSourceRetriever {
  const timeoutMs =
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes =
    options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects =
    options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  const network: ProductSourceNetworkDependencies =
    options.network ?? {
      lookup: defaultLookup,
      fetch: globalThis.fetch,
    };

  return {
    async retrieve(
      sourceUrl: string,
      signal?: AbortSignal
    ): Promise<ProductSourceRetrieval> {
      const requestedUrl =
        validateProductSourceUrl(sourceUrl);

      if (!requestedUrl) {
        return {
          status: "FAILED",
          reason: "Source URL is not eligible for retrieval.",
        };
      }

      if (signal?.aborted) {
        return {
          status: "FAILED",
          reason: "Source retrieval was aborted.",
        };
      }

      const timeoutController = new AbortController();
      const timeout = setTimeout(
        () => timeoutController.abort(),
        timeoutMs
      );

      const abortFromCaller = () =>
        timeoutController.abort();

      signal?.addEventListener(
        "abort",
        abortFromCaller,
        { once: true }
      );

      try {
        let currentUrl = requestedUrl;

        for (
          let redirectCount = 0;
          redirectCount <= maxRedirects;
          redirectCount += 1
        ) {
          const resolvedAddresses =
            await resolvePublicAddresses(
              currentUrl,
              network.lookup
            );

          const pinnedFetch =
            options.network === undefined
              ? await fetchWithPinnedResolution(
                  currentUrl,
                  resolvedAddresses,
                  timeoutController.signal
                )
              : null;

          const response =
            pinnedFetch?.response ??
            (await network.fetch(
              currentUrl.toString(),
              {
                method: "GET",
                redirect: "manual",
                signal:
                  timeoutController.signal,
                headers: {
                  accept:
                    "text/html,text/plain,application/json,application/ld+json",
                },
              }
            ));

          const closePinnedFetch =
            pinnedFetch?.close ?? (async () => {});

          try {

          if (
            response.status >= 300 &&
            response.status < 400
          ) {
            const location =
              response.headers.get("location");

            if (!location) {
              return {
                status: "UNAVAILABLE",
                reason:
                  "Source redirect did not provide a destination.",
              };
            }

            if (redirectCount === maxRedirects) {
              return {
                status: "FAILED",
                reason:
                  "Source exceeded the permitted redirect limit.",
              };
            }

            const nextUrl = validateProductSourceUrl(
              new URL(
                location,
                currentUrl
              ).toString()
            );

            if (!nextUrl) {
              return {
                status: "FAILED",
                reason:
                  "Source redirected to an ineligible destination.",
              };
            }

            currentUrl = nextUrl;
            continue;
          }

          if (!response.ok) {
            return {
              status: "UNAVAILABLE",
              reason: `Source returned HTTP ${response.status}.`,
            };
          }

          const contentType =
            response.headers.get("content-type");

          if (!isAllowedContentType(contentType)) {
            return {
              status: "UNAVAILABLE",
              reason:
                "Source content type is not eligible for product research.",
            };
          }

          const content = await readBoundedText(
            response,
            maxBytes
          );

          return {
            status: "AVAILABLE",
            requestedUrl: requestedUrl.toString(),
            finalUrl: currentUrl.toString(),
            retrievedAt: new Date().toISOString(),
            contentType:
              contentType
                ?.split(";", 1)[0]
                .trim()
                .toLocaleLowerCase() ?? "",
            content,
          };
          } finally {
            await closePinnedFetch();
          }
        }

        return {
          status: "FAILED",
          reason:
            "Source exceeded the permitted redirect limit.",
        };
      } catch (error) {
        if (timeoutController.signal.aborted) {
          return {
            status: "FAILED",
            reason: signal?.aborted
              ? "Source retrieval was aborted."
              : "Source retrieval timed out.",
          };
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unknown source retrieval failure.";

        return {
          status: "FAILED",
          reason: message,
        };
      } finally {
        clearTimeout(timeout);

        signal?.removeEventListener(
          "abort",
          abortFromCaller
        );
      }
    },
  };
}
