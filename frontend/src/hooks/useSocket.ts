import { useEffect, useRef, useState } from 'react';

// Disabled WebSocket hook to prevent connection spam in development
export function useSocket() {
  const [isConnected] = useState(false);
  const [connectionError] = useState<string | null>(null);

  const connect = () => {
    // No-op - WebSocket disabled
  };

  const disconnect = () => {
    // No-op - WebSocket disabled
  };

  const cleanup = () => {
    // No-op - WebSocket disabled
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    // No-op - WebSocket disabled
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    // No-op - WebSocket disabled
  };

  const emit = (event: string, data?: any) => {
    // No-op - WebSocket disabled
  };

  return { 
    on, 
    off, 
    emit, 
    connect, 
    disconnect,
    cleanup,
    isConnected, 
    connectionError 
  };
}