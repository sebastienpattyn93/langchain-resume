// Simple in-memory rate limiter for API endpoints

interface RateLimitRecord {
  minuteRequests: number;
  hourRequests: number;
  lastMinuteReset: number;
  lastHourReset: number;
}

interface RateLimitResult {
  allowed: boolean;
  limitType?: 'minute' | 'hour';
  resetTime?: number;
  message?: string;
}

class RateLimiter {
  private ipRecords: Map<string, RateLimitRecord> = new Map();
  private readonly minuteLimit: number;
  private readonly hourLimit: number;
  private readonly minuteMs = 60 * 1000; // 1 minute in milliseconds
  private readonly hourMs = 60 * 60 * 1000; // 1 hour in milliseconds

  constructor(minuteLimit: number = 15, hourLimit: number = 60) {
    this.minuteLimit = minuteLimit;
    this.hourLimit = hourLimit;
  }

  checkLimit(ip: string): RateLimitResult {
    const now = Date.now();
    
    // Get or create record for this IP
    if (!this.ipRecords.has(ip)) {
      this.ipRecords.set(ip, {
        minuteRequests: 0,
        hourRequests: 0,
        lastMinuteReset: now,
        lastHourReset: now
      });
    }
    
    const record = this.ipRecords.get(ip)!;
    
    // Check if we need to reset minute counter
    if (now - record.lastMinuteReset > this.minuteMs) {
      record.minuteRequests = 0;
      record.lastMinuteReset = now;
    }
    
    // Check if we need to reset hour counter
    if (now - record.lastHourReset > this.hourMs) {
      record.hourRequests = 0;
      record.lastHourReset = now;
    }
    
    // Check minute limit
    if (record.minuteRequests >= this.minuteLimit) {
      const resetTime = record.lastMinuteReset + this.minuteMs;
      const waitSeconds = Math.ceil((resetTime - now) / 1000);
      
      return {
        allowed: false,
        limitType: 'minute',
        resetTime,
        message: `Rate limit exceeded. Please try again in ${waitSeconds} seconds.`
      };
    }
    
    // Check hour limit
    if (record.hourRequests >= this.hourLimit) {
      const resetTime = record.lastHourReset + this.hourMs;
      const waitMinutes = Math.ceil((resetTime - now) / (60 * 1000));
      
      return {
        allowed: false,
        limitType: 'hour',
        resetTime,
        message: `Hourly rate limit exceeded. Please try again in ${waitMinutes} minutes or contact me directly with your questions.`
      };
    }
    
    // Increment counters
    record.minuteRequests++;
    record.hourRequests++;
    
    // Update the record
    this.ipRecords.set(ip, record);
    
    return { allowed: true };
  }
  
  // For debugging or monitoring
  getStats(ip: string): RateLimitRecord | undefined {
    return this.ipRecords.get(ip);
  }
  
  // Clean up old records (call this periodically if needed)
  cleanup() {
    const now = Date.now();
    for (const [ip, record] of this.ipRecords.entries()) {
      if (now - record.lastHourReset > this.hourMs * 2) {
        this.ipRecords.delete(ip);
      }
    }
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;
