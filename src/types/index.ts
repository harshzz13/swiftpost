// Core types for the SwiftPost Backend

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export type ServiceType = 
  | 'Parcel Drop-off' 
  | 'Banking Services' 
  | 'General Inquiry' 
  | 'Document Verification';

export interface TokenRequest {
  serviceType: ServiceType;
}

export interface TokenResponse {
  tokenNumber: string;
  queuePosition: number;
  estimatedWaitTime: number;
  serviceType: string;
}

export interface QueueStatistics {
  totalTokensToday: number;
  tokensInQueue: number;
  averageWaitTime: number;
  activeCounters: number;
  inactiveCounters: number;
}

// Re-export Prisma types
export { TokenStatus, CounterStatus, Token, Counter } from '@prisma/client';