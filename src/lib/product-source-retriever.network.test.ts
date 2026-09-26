import {
  createPinnedLookup,
  createProductSourceRetriever,
  type ProductSourceNetworkDependencies,
} from "@/lib/product-source-retriever";

function response(
  body: string,
  init: ResponseInit = {}
): Response {
  const headers = new Headers(init.headers);
  const status = init.status ?? 200;
  const encoded = new Uint8Array(Buffer.from(body, "utf8"));

  let consumed = false;

  const reader = {
    async read() {
      if (consumed) {
        return {
          done: true,
          value: undefined,
        };
      }

      consumed = true;

      return {
        done: false,
        value: encoded,
      };
    },

    releaseLock() {},
  };

  return {
    status,
    ok: status >= 200 && status < 300,
    headers,
    body: {
      getReader() {
        return reader;
      },
    },
  } as unknown as Response;
}

function network(
  lookup: ProductSourceNetworkDependencies["lookup"],
  fetchImpl: ProductSourceNetworkDependencies["fetch"]
): ProductSourceNetworkDependencies {
  return {
    lookup,
    fetch: fetchImpl,
  };
}

describe("createPinnedLookup", () => {
  it("returns only the prevalidated address for connection-time lookup", () => {
    const lookup = createPinnedLookup([
      {
        address: "93.184.216.34",
        family: 4,
      },
    ]);

    const callback = jest.fn();

    lookup(
      "rebound.example",
      {},
      callback
    );

    expect(callback).toHaveBeenCalledWith(
      null,
      "93.184.216.34",
      4
    );
  });

  it("returns only the complete prevalidated set when all addresses are requested", () => {
    const lookup = createPinnedLookup([
      {
        address: "93.184.216.34",
        family: 4,
      },
      {
        address: "2606:2800:220:1:248:1893:25c8:1946",
        family: 6,
      },
    ]);

    const callback = jest.fn();

    lookup(
      "rebound.example",
      { all: true },
      callback
    );

    expect(callback).toHaveBeenCalledWith(
      null,
      [
        {
          address: "93.184.216.34",
          family: 4,
        },
        {
          address:
            "2606:2800:220:1:248:1893:25c8:1946",
          family: 6,
        },
      ]
    );
  });

  it("fails closed when no validated address is available to pin", () => {
    expect(() =>
      createPinnedLookup([])
    ).toThrow("PINNED_ADDRESS_SET_EMPTY");
  });
});

describe("createProductSourceRetriever", () => {
  it("retrieves an eligible public HTTPS text source", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response("<html>Product</html>", {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      })
    );

    const retriever = createProductSourceRetriever({
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
        ],
        fetchMock as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual(
      expect.objectContaining({
        status: "AVAILABLE",
        requestedUrl: "https://example.com/product",
        finalUrl: "https://example.com/product",
        contentType: "text/html",
        content: "<html>Product</html>",
      })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/product",
      expect.objectContaining({
        method: "GET",
        redirect: "manual",
      })
    );
  });

  it("rejects a hostname resolving to a private address before fetch", async () => {
    const fetchMock = jest.fn();

    const retriever = createProductSourceRetriever({
      network: network(
        async () => [
          {
            address: "10.0.0.5",
            family: 4,
          },
        ],
        fetchMock as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "FAILED",
      reason: "UNSAFE_SOURCE_ADDRESS",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when any DNS answer is private", async () => {
    const fetchMock = jest.fn();

    const retriever = createProductSourceRetriever({
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
          {
            address: "192.168.1.10",
            family: 4,
          },
        ],
        fetchMock as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "FAILED",
      reason: "UNSAFE_SOURCE_ADDRESS",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("revalidates a redirect destination before following it", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        response("", {
          status: 302,
          headers: {
            location: "https://internal.example/product",
          },
        })
      );

    const lookupMock = jest.fn(
      async (hostname: string) => {
        if (hostname === "example.com") {
          return [
            {
              address: "93.184.216.34",
              family: 4,
            },
          ];
        }

        return [
          {
            address: "10.0.0.7",
            family: 4,
          },
        ];
      }
    );

    const retriever = createProductSourceRetriever({
      network: network(
        lookupMock,
        fetchMock as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "FAILED",
      reason: "UNSAFE_SOURCE_ADDRESS",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an explicitly ineligible redirect destination", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response("", {
        status: 302,
        headers: {
          location: "http://example.com/insecure",
        },
      })
    );

    const retriever = createProductSourceRetriever({
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
        ],
        fetchMock as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "FAILED",
      reason:
        "Source redirected to an ineligible destination.",
    });
  });

  it("rejects an ineligible content type", async () => {
    const retriever = createProductSourceRetriever({
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
        ],
        jest.fn().mockResolvedValue(
          response("binary", {
            status: 200,
            headers: {
              "content-type": "application/octet-stream",
            },
          })
        ) as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "UNAVAILABLE",
      reason:
        "Source content type is not eligible for product research.",
    });
  });

  it("rejects content exceeding the configured byte limit", async () => {
    const retriever = createProductSourceRetriever({
      maxBytes: 5,
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
        ],
        jest.fn().mockResolvedValue(
          response("123456", {
            status: 200,
            headers: {
              "content-type": "text/plain",
            },
          })
        ) as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "FAILED",
      reason: "SOURCE_TOO_LARGE",
    });
  });

  it("enforces the redirect limit", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      response("", {
        status: 302,
        headers: {
          location: "/next",
        },
      })
    );

    const retriever = createProductSourceRetriever({
      maxRedirects: 1,
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
        ],
        fetchMock as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "FAILED",
      reason:
        "Source exceeded the permitted redirect limit.",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("contains caller abort without throwing", async () => {
    const controller = new AbortController();
    controller.abort();

    const fetchMock = jest.fn();

    const retriever = createProductSourceRetriever({
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
        ],
        fetchMock as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product",
      controller.signal
    );

    expect(result).toEqual({
      status: "FAILED",
      reason: "Source retrieval was aborted.",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("contains timeout without throwing", async () => {
    const retriever = createProductSourceRetriever({
      timeoutMs: 10,
      network: network(
        async () => [
          {
            address: "93.184.216.34",
            family: 4,
          },
        ],
        ((_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => {
                const error = new Error("aborted");
                error.name = "AbortError";
                reject(error);
              },
              { once: true }
            );
          })) as typeof fetch
      ),
    });

    const result = await retriever.retrieve(
      "https://example.com/product"
    );

    expect(result).toEqual({
      status: "FAILED",
      reason: "Source retrieval timed out.",
    });
  });
});
