import { InspectorOAuthClientProvider } from "./auth";

describe("InspectorOAuthClientProvider state parameter", () => {
  const serverUrl = "https://example.com";
  let provider: InspectorOAuthClientProvider;

  beforeEach(() => {
    provider = new InspectorOAuthClientProvider(serverUrl);
    sessionStorage.clear();
  });

  it("generates, stores, and retrieves state", () => {
    const state = provider.generateAndStoreState();
    expect(state).toBeDefined();
    expect(state).toEqual(provider.getState());
    expect(state).toHaveLength(32);
  });

  it("clears state from sessionStorage", () => {
    provider.generateAndStoreState();
    provider.clearState();
    expect(provider.getState()).toBeNull();
  });

  it("generates a new state each time", () => {
    const state1 = provider.generateAndStoreState();
    provider.clearState();
    const state2 = provider.generateAndStoreState();
    expect(state1).not.toEqual(state2);
  });
});
