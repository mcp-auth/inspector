import { InspectorOAuthClientProvider } from "./auth";

describe("OAuth /authorize URL includes state parameter", () => {
  const serverUrl = "https://example.com";
  let provider: InspectorOAuthClientProvider;

  // Suppress console.log for this test suite
  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  beforeEach(() => {
    provider = new InspectorOAuthClientProvider(serverUrl);
    sessionStorage.clear();
  });

  it("includes state parameter in the authorization URL", () => {
    // Mock window.location.href using Object.defineProperty
    const originalLocation = window.location;

    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });

    const url = new URL("https://authserver.com/authorize");
    provider.redirectToAuthorization(url);

    // Check that the URL contains the state parameter
    expect(window.location.href).toContain("state=");
    const stateInUrl = new URL(window.location.href).searchParams.get("state");
    expect(stateInUrl).toBeDefined();
    expect(stateInUrl!.length).toBeGreaterThan(0);

    // Restore window.location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
  });
});
