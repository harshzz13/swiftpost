// Core types for the SwiftPost Backend

// Define enums manually to match Prisma schema exactly
export const TokenStatus = {
  WAITING: 'WAITING',
  SERVING: 'SERVING',
  COMPLETED: 'COMPLETED'
} as const;

export const CounterStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
} as const;

// Create type aliases from the const objects
export type TokenStatus = typeof TokenStatus[keyof typeof TokenStatus];
export type CounterStatus = typeof CounterStatus[keyof typeof CounterStatus];

// Define model types based on Prisma schema
export interface Token {
  id: number;
  tokenNumber: string;
  serviceType: string;
  status: TokenStatus;
  queuePosition: number | null;
  counterId: number | null;
  createdAt: Date;
  calledAt: Date | null;
  completedAt: Date | null;
}

export interface Counter {
  id: number;
  number: number;
  status: CounterStatus;
  createdAt: Date;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string; // Changed from Date to string since JSON serializes dates as strings
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
  serviceType: ServiceType; // Changed from string to ServiceType for type safety
}

export interface QueueStatistics {
  totalTokensToday: number;
  tokensInQueue: number;
  averageWaitTime: number;
  activeCounters: number;
  inactiveCounters: number;
}

// Alias for consistency with service classes
export type QueueStats = QueueStatistics;

export interface ServiceStats {
  serviceType: string;
  totalToday: number;
  waiting: number;
  serving: number;
  completed: number;
}

export interface HourlyStats {
  hour: number;
  tokensGenerated: number;
  tokensCompleted: number;
}

// Extended Token interface with computed fields for API responses
export interface TokenWithDetails {
  tokenNumber: string;
  serviceType: ServiceType;
  status: TokenStatus;
  queuePosition: number;
  estimatedWaitTime: number;
  counter?: number | null;
  createdAt: string;
  calledAt?: string | null;
  completedAt?: string | null;
}