/// <reference types="vite/client" />

// Global constants defined at build time
declare const __ROUTE_MESSAGING_ENABLED__: boolean;

interface MetaMaskProvider {
  isMetaMask?: boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

interface Window {
  ethereum?: MetaMaskProvider;
}
