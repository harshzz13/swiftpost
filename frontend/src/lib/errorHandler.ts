// Global error handler to prevent console spam
class ErrorThrottler {
  private errorCounts = new Map<string, { count: number; lastTime: number }>();
  private readonly maxErrors = 3; // Reduced from 5
  private readonly timeWindow = 30000; // Reduced to 30 seconds

  shouldLogError(errorMessage: string): boolean {
    // Don't throttle important errors
    if (this.isImportantError(errorMessage)) {
      return true;
    }

    const now = Date.now();
    const errorKey = this.getErrorKey(errorMessage);
    
    const existing = this.errorCounts.get(errorKey);
    
    if (!existing) {
      this.errorCounts.set(errorKey, { count: 1, lastTime: now });
      return true;
    }
    
    // Reset count if time window has passed
    if (now - existing.lastTime > this.timeWindow) {
      this.errorCounts.set(errorKey, { count: 1, lastTime: now });
      return true;
    }
    
    // Increment count
    existing.count++;
    existing.lastTime = now;
    
    // Only log if under the limit
    if (existing.count <= this.maxErrors) {
      return true;
    }
    
    // Log a warning about throttling on the next error after limit
    if (existing.count === this.maxErrors + 1) {
      console.warn(`🔇 Error throttled: "${errorKey}..." (${this.maxErrors} similar errors in 30s)`);
    }
    
    return false;
  }

  private isImportantError(errorMessage: string): boolean {
    const importantPatterns = [
      'TypeError',
      'ReferenceError', 
      'SyntaxError',
      'Cannot delete counter with active tokens',
      'Service temporarily unavailable'
    ];
    
    return importantPatterns.some(pattern => 
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private getErrorKey(errorMessage: string): string {
    // Create a more specific key for better grouping
    const message = errorMessage.substring(0, 150);
    
    // Group similar network/timeout errors
    if (message.includes('timeout') || message.includes('slow')) {
      return 'network-timeout';
    }
    if (message.includes('WebSocket') || message.includes('socket.io') || message.includes('ws://')) {
      return 'websocket-connection';
    }
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'network-fetch';
    }
    
    return message;
  }
}

const errorThrottler = new ErrorThrottler();

// Override console.error to throttle repeated errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const errorMessage = args.join(' ');
  
  // Completely suppress WebSocket errors
  if (errorMessage.includes('WebSocket') || 
      errorMessage.includes('socket.io') || 
      errorMessage.includes('ws://') ||
      errorMessage.includes('CLOSING or CLOSED state')) {
    return; // Don't log at all
  }
  
  // Don't throttle if it's a single argument that's an Error object with important info
  if (args.length === 1 && args[0] instanceof Error) {
    originalConsoleError.apply(console, args);
    return;
  }
  
  if (errorThrottler.shouldLogError(errorMessage)) {
    originalConsoleError.apply(console, args);
  }
};

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  if (error instanceof Error) {
    // Don't log network errors as unhandled rejections
    if (error.message.includes('Failed to fetch') || 
        error.message.includes('NetworkError') ||
        error.message.includes('timeout')) {
      event.preventDefault(); // Prevent default browser handling
      return;
    }
  }
  console.error('Unhandled promise rejection:', error);
});

// Handle global errors
window.addEventListener('error', (event) => {
  // Don't log script loading errors from extensions or other sources
  if (event.filename && !event.filename.includes(window.location.origin)) {
    event.preventDefault();
    return;
  }
  console.error('Global error:', event.error || event.message);
});

export { errorThrottler };