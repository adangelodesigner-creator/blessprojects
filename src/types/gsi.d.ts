declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
      }

      interface TokenResponse {
        access_token?: string;
        expires_in?: number;
        error?: string;
      }

      class TokenClient {
        callback: (response: TokenResponse) => void;
        constructor(config: TokenClientConfig);
        requestAccessToken(opt?: { prompt?: string }): void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
      function revoke(token: string, done: () => void): void;
    }
  }
}

interface Window {
  google?: typeof google;
}
