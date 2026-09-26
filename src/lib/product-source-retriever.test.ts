import {
  validateProductSourceUrl,
} from "@/lib/product-source-retriever";

describe("validateProductSourceUrl", () => {
  test.each([
    "http://example.com/product",
    "https://localhost/product",
    "https://shop.localhost/product",
    "https://127.0.0.1/product",
    "https://10.0.0.1/product",
    "https://172.16.0.1/product",
    "https://172.31.255.255/product",
    "https://192.168.1.1/product",
    "https://169.254.169.254/latest/meta-data",
    "https://0.0.0.0/product",
    "https://[::1]/product",
    "https://[::ffff:127.0.0.1]/product",
    "https://[::ffff:10.0.0.1]/product",
    "https://[::ffff:169.254.169.254]/latest/meta-data",
    "https://user:password@example.com/product",
    "https://example.com:8443/product",
    "not-a-url",
  ])("rejects unsafe source URL %s", (url) => {
    expect(validateProductSourceUrl(url)).toBeNull();
  });

  test.each([
    "https://example.com/product",
    "https://manufacturer.example/products/123",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/example",
  ])("accepts syntactically eligible public HTTPS URL %s", (url) => {
    expect(validateProductSourceUrl(url)?.toString()).toBe(url);
  });
});
