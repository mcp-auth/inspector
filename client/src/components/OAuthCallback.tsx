import { useEffect, useRef } from "react";
import {
  InspectorOAuthClientProvider,
  getAuthParamsFromSessionStorage,
  getClientInformationFromSessionStorage,
} from "../lib/auth";
import { SESSION_KEYS } from "../lib/constants";
import { auth } from "@modelcontextprotocol/sdk/client/auth.js";
import { useToast } from "@/hooks/use-toast.ts";
import {
  generateOAuthErrorDescription,
  parseOAuthCallbackParams,
} from "@/utils/oauthUtils.ts";

interface OAuthCallbackProps {
  onConnect: (serverUrl: string) => void;
}

const OAuthCallback = ({ onConnect }: OAuthCallbackProps) => {
  const { toast } = useToast();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Skip if we've already processed this callback
      if (hasProcessedRef.current) {
        return;
      }
      hasProcessedRef.current = true;

      const notifyError = (description: string) =>
        void toast({
          title: "OAuth Authorization Error",
          description,
          variant: "destructive",
        });

      const params = parseOAuthCallbackParams(window.location.search);
      // Extract state from query params
      const urlParams = new URLSearchParams(window.location.search);
      const returnedState = urlParams.get("state");
      if (!params.successful) {
        return notifyError(generateOAuthErrorDescription(params));
      }

      const serverUrl = sessionStorage.getItem(SESSION_KEYS.SERVER_URL);
      if (!serverUrl) {
        return notifyError("Missing Server URL");
      }

      // Validate state parameter
      const serverAuthProvider = new InspectorOAuthClientProvider(
        serverUrl,
        undefined,
        undefined,
      );
      const expectedState = serverAuthProvider.getState();
      serverAuthProvider.clearState(); // Always clear after checking
      if (!returnedState || !expectedState || returnedState !== expectedState) {
        return notifyError(
          "Invalid or missing OAuth state parameter. Please try logging in again.",
        );
      }

      const clientInformation =
        await getClientInformationFromSessionStorage(serverUrl);

      const authParams = getAuthParamsFromSessionStorage(serverUrl);

      let result;
      try {
        // Create an auth provider with the current server URL
        const serverAuthProvider = new InspectorOAuthClientProvider(
          serverUrl,
          clientInformation,
          authParams,
        );

        result = await auth(serverAuthProvider, {
          serverUrl,
          authorizationCode: params.code,
        });
      } catch (error) {
        console.error("OAuth callback error:", error);
        return notifyError(`Unexpected error occurred: ${error}`);
      }

      if (result !== "AUTHORIZED") {
        return notifyError(
          `Expected to be authorized after providing auth code, got: ${result}`,
        );
      }

      // Finally, trigger auto-connect
      toast({
        title: "Success",
        description: "Successfully authenticated with OAuth",
        variant: "default",
      });
      onConnect(serverUrl);
    };

    handleCallback().finally(() => {
      window.history.replaceState({}, document.title, "/");
    });
  }, [toast, onConnect]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-500">Processing OAuth callback...</p>
    </div>
  );
};

export default OAuthCallback;
