import { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import {
  OAuthClientInformationSchema,
  OAuthClientInformation,
  OAuthTokens,
  OAuthTokensSchema,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { SESSION_KEYS, getServerSpecificKey } from "./constants";

export const getClientInformationFromSessionStorage = async (
  serverUrl: string,
) => {
  const key = getServerSpecificKey(SESSION_KEYS.CLIENT_INFORMATION, serverUrl);
  const value = sessionStorage.getItem(key);
  if (!value) {
    return undefined;
  }

  return await OAuthClientInformationSchema.parseAsync(JSON.parse(value));
};

export const getAuthParamsFromSessionStorage = (serverUrl: string) => {
  const key = getServerSpecificKey(SESSION_KEYS.OAUTH_PARAMS, serverUrl);
  const value = sessionStorage.getItem(key);
  if (!value) {
    return undefined;
  }
  return JSON.parse(value);
};

export class InspectorOAuthClientProvider implements OAuthClientProvider {
  constructor(
    private serverUrl: string,
    clientInformation?: OAuthClientInformation,
    oauthParams?: Record<string, string>,
  ) {
    // Save the server URL to session storage
    sessionStorage.setItem(SESSION_KEYS.SERVER_URL, serverUrl);

    // Save the client information to session storage if provided
    if (clientInformation) {
      this.saveClientInformation(clientInformation);
    }

    if (oauthParams) {
      this.saveAuthParams(oauthParams);
    }
  }

  get redirectUrl() {
    return window.location.origin + "/oauth/callback";
  }

  get clientMetadata() {
    return {
      redirect_uris: [this.redirectUrl],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      client_name: "MCP Inspector",
      client_uri: "https://github.com/modelcontextprotocol/inspector",
    };
  }

  async clientInformation() {
    return await getClientInformationFromSessionStorage(this.serverUrl);
  }

  saveClientInformation(clientInformation: OAuthClientInformation) {
    const key = getServerSpecificKey(
      SESSION_KEYS.CLIENT_INFORMATION,
      this.serverUrl,
    );
    sessionStorage.setItem(key, JSON.stringify(clientInformation));
  }

  authParams() {
    return getAuthParamsFromSessionStorage(this.serverUrl);
  }

  saveAuthParams(authParams: Record<string, string>) {
    const key = getServerSpecificKey(SESSION_KEYS.OAUTH_PARAMS, this.serverUrl);
    sessionStorage.setItem(key, JSON.stringify(authParams));
  }

  async tokens() {
    const key = getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl);
    const tokens = sessionStorage.getItem(key);
    if (!tokens) {
      return undefined;
    }

    return await OAuthTokensSchema.parseAsync(JSON.parse(tokens));
  }

  saveTokens(tokens: OAuthTokens) {
    const key = getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl);
    sessionStorage.setItem(key, JSON.stringify(tokens));
  }

  redirectToAuthorization(authorizationUrl: URL) {
    const authParams = this.authParams();
    console.log("authParams", authParams);
    if (authParams) {
      Object.entries(authParams).forEach(([key, value]) => {
        authorizationUrl.searchParams.set(key, value as string);
      });
    }
    window.location.href = authorizationUrl.href;
  }

  saveCodeVerifier(codeVerifier: string) {
    const key = getServerSpecificKey(
      SESSION_KEYS.CODE_VERIFIER,
      this.serverUrl,
    );
    sessionStorage.setItem(key, codeVerifier);
  }

  codeVerifier() {
    const key = getServerSpecificKey(
      SESSION_KEYS.CODE_VERIFIER,
      this.serverUrl,
    );
    const verifier = sessionStorage.getItem(key);
    if (!verifier) {
      throw new Error("No code verifier saved for session");
    }

    return verifier;
  }

  clear() {
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.CLIENT_INFORMATION, this.serverUrl),
    );
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.TOKENS, this.serverUrl),
    );
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.CODE_VERIFIER, this.serverUrl),
    );
    sessionStorage.removeItem(
      getServerSpecificKey(SESSION_KEYS.OAUTH_PARAMS, this.serverUrl),
    );
  }
}
