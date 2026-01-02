const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface Token {
  tokenNumber: string;
  serviceType: string;
  status: 'WAITING' | 'SERVING' | 'COMPLETED';
  queuePosition: number;
  estimatedWaitTime: number;
  counter?: number | null;
  createdAt: string;
  calledAt?: string | null;
  completedAt?: string | null;
}

export interface Counter {
  id: number;
  number: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  tokens?: Token[];
}

export interface QueueStats {
  totalTokensToday: number;
  tokensInQueue: number;
  averageWaitTime: number;
  activeCounters: number;
  inactiveCounters: number;
}

class ApiService {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly maxFailures = 3;
  private readonly resetTimeout = 60000; // 1 minute

  private isCircuitOpen(): boolean {
    if (this.failureCount >= this.maxFailures) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure < this.resetTimeout) {
        return true; // Circuit is open, reject requests
      } else {
        // Reset circuit breaker
        this.failureCount = 0;
        return false;
      }
    }
    return false;
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  private recordSuccess(): void {
    this.failureCount = 0;
  }

  private async request<T>(endpoint: string, options?: RequestInit, retries = 1): Promise<APIResponse<T>> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new Error('Service temporarily unavailable - too many failures');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15 seconds

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = 'Request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        const error = new Error(errorMessage) as Error & { status: number };
        error.status = response.status;
        
        // Don't count 4xx errors as failures for circuit breaker
        if (response.status >= 500) {
          this.recordFailure();
        }
        
        throw error;
      }

      const data = await response.json();
      this.recordSuccess(); // Reset failure count on success
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          this.recordFailure();
          throw new Error('Request timeout - server may be slow or unavailable');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          this.recordFailure();
          
          // Only retry network errors once and not if circuit is about to open
          if (retries > 0 && this.failureCount < this.maxFailures - 1) {
            console.log(`Retrying request to ${endpoint}, ${retries} attempts left`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return this.request(endpoint, options, retries - 1);
          }
          throw new Error('Network error - please check if the server is running at ' + API_BASE_URL);
        }
      }
      
      // Don't log expected errors like 404s or circuit breaker errors
      if (!(error as any)?.status || ((error as any).status >= 500 && !(error as Error).message.includes('temporarily unavailable'))) {
        console.error('API request failed:', error);
      }
      throw error;
    }
  }

  // Token endpoints
  async generateToken(serviceType: string): Promise<APIResponse<Token>> {
    return this.request<Token>('/tokens', {
      method: 'POST',
      body: JSON.stringify({ serviceType }),
    });
  }

  async getTokenStatus(tokenNumber: string): Promise<APIResponse<Token>> {
    return this.request<Token>(`/tokens/${tokenNumber}`);
  }

  async getWaitingTokens(): Promise<APIResponse<Token[]>> {
    return this.request<Token[]>('/tokens/queue/waiting');
  }

  async callNextToken(counterId: number): Promise<APIResponse<Token>> {
    return this.request<Token>('/tokens/call-next', {
      method: 'POST',
      body: JSON.stringify({ counterId }),
    });
  }

  async completeToken(tokenNumber: string): Promise<APIResponse<Token>> {
    return this.request<Token>(`/tokens/${tokenNumber}/complete`, {
      method: 'POST',
    });
  }

  // Counter endpoints
  async getCounters(): Promise<APIResponse<Counter[]>> {
    return this.request<Counter[]>('/counters');
  }

  async createCounter(number: number): Promise<APIResponse<Counter>> {
    return this.request<Counter>('/counters', {
      method: 'POST',
      body: JSON.stringify({ number }),
    });
  }

  async updateCounterStatus(id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<APIResponse<Counter>> {
    return this.request<Counter>(`/counters/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteCounter(id: number): Promise<APIResponse<any>> {
    return this.request(`/counters/${id}`, {
      method: 'DELETE',
    });
  }

  // Stats endpoints
  async getStats(): Promise<APIResponse<QueueStats>> {
    return this.request<QueueStats>('/stats');
  }

  async getServiceStats(): Promise<APIResponse<any[]>> {
    return this.request('/stats/services');
  }

  async getHourlyStats(): Promise<APIResponse<any[]>> {
    return this.request('/stats/hourly');
  }
}

export const apiService = new ApiService();