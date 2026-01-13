import { DurableObject } from "cloudflare:workers";

/**
 * Token Bucket Rate Limiter Durable Object
 *
 * Implements a token bucket algorithm for rate limiting with the following properties:
 * - capacity: Maximum tokens (quota from policy)
 * - refillRate: tokens per second = capacity / windowSeconds
 * - Lazy refill: tokens are computed on demand, not via background timers
 *
 * Key design decisions:
 * - Uses Durable Object storage for state persistence
 * - Single-threaded execution per DO instance ensures atomic operations
 * - State is stored as a single JSON object for efficiency
 * - Policy changes are detected and handled gracefully
 *
 * Keying strategy (handled by client):
 * - Format: `tb:<ownerId>:<segmentType>:<segmentValue>:<unit>`
 * - Examples:
 *   - `tb:org123:global:request`
 *   - `tb:org123:user:user456:request`
 *   - `tb:org123:prop:organization:org789:cents`
 */

export interface TokenBucketRequest {
  /** Maximum tokens (requests or cents) */
  capacity: number;
  /** Time window in seconds (min 60) */
  windowSeconds: number;
  /** Unit type for consumption */
  unit: "request" | "cents";
  /** Cost to consume (1 for requests, actual cost for cents) */
  cost: number;
  /** Policy string for change detection */
  policyString: string;
  /** If true, only check without consuming */
  checkOnly?: boolean;
}

export interface TokenBucketResponse {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current limit (capacity) */
  limit: number;
  /** Remaining tokens after this request */
  remaining: number;
  /** Seconds until bucket is full (for rate limit headers) */
  resetSeconds: number;
  /** The policy string echoed back */
  policy: string;
}

interface TokenBucketState {
  /** Current token count */
  tokens: number;
  /** Timestamp of last refill in ms */
  lastRefillMs: number;
  /** Capacity at last operation (for policy change detection) */
  capacity: number;
  /** Window seconds at last operation */
  windowSeconds: number;
  /** Unit at last operation */
  unit: "request" | "cents";
  /** Hash of last policy for change detection */
  policyHash: string;
}

const STORAGE_KEY = "bucket_state";

export class TokenBucketRateLimiterDO extends DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
  }

  /**
   * Main entry point: consume tokens from the bucket
   *
   * Algorithm:
   * 1. Load current state
   * 2. Compute lazy refill based on elapsed time
   * 3. Check if we have enough tokens
   * 4. If allowed and not checkOnly, deduct tokens
   * 5. Persist state
   * 6. Return result with rate limit info
   */
  async consume(req: TokenBucketRequest): Promise<TokenBucketResponse> {
    // Validate inputs
    const validationError = this.validateRequest(req);
    if (validationError) {
      console.error(`[TokenBucket] Validation error: ${validationError}`);
      // Fail open on validation errors - allow the request but log
      return {
        allowed: true,
        limit: req.capacity,
        remaining: req.capacity,
        resetSeconds: 0,
        policy: req.policyString,
      };
    }

    const now = Date.now();
    const policyHash = this.hashPolicy(req.policyString);

    // Use blockConcurrencyWhile for atomic read-modify-write
    return await this.state.blockConcurrencyWhile(async () => {
      // Load existing state or initialize
      let bucketState = await this.loadState();

      // Handle policy changes or initialize new bucket
      if (!bucketState || bucketState.policyHash !== policyHash) {
        bucketState = this.handlePolicyChange(bucketState, req, policyHash, now);
      }

      // Compute lazy refill
      bucketState = this.refill(bucketState, req, now);

      // Check if we have enough tokens
      const cost = this.normalizeCost(req.cost);
      const hasCapacity = bucketState.tokens >= cost;

      // Deduct tokens if allowed and not check-only
      if (hasCapacity && !req.checkOnly) {
        bucketState.tokens = Math.max(0, bucketState.tokens - cost);
      }

      // Calculate remaining (after potential deduction)
      const remaining = Math.max(0, Math.floor(bucketState.tokens));

      // Calculate reset time (time until bucket is full)
      const refillRate = req.capacity / req.windowSeconds;
      const tokensNeeded = req.capacity - bucketState.tokens;
      const resetSeconds =
        tokensNeeded <= 0 ? 0 : Math.ceil(tokensNeeded / refillRate);

      // Persist state
      await this.saveState(bucketState);

      return {
        allowed: hasCapacity,
        limit: req.capacity,
        remaining,
        resetSeconds,
        policy: req.policyString,
      };
    });
  }

  /**
   * Get current bucket state (for debugging/monitoring)
   */
  async getState(): Promise<TokenBucketState | null> {
    return await this.loadState();
  }

  /**
   * Reset the bucket (for testing or manual intervention)
   */
  async reset(): Promise<void> {
    await this.state.storage.delete(STORAGE_KEY);
  }

  // --- Private methods ---

  private async loadState(): Promise<TokenBucketState | null> {
    const state = await this.state.storage.get<TokenBucketState>(STORAGE_KEY);
    return state ?? null;
  }

  private async saveState(state: TokenBucketState): Promise<void> {
    await this.state.storage.put(STORAGE_KEY, state);
  }

  /**
   * Handle policy changes:
   * - If policy changed, clamp tokens to new capacity
   * - If new bucket, initialize with full capacity
   */
  private handlePolicyChange(
    existing: TokenBucketState | null,
    req: TokenBucketRequest,
    policyHash: string,
    now: number
  ): TokenBucketState {
    if (!existing) {
      // New bucket: start with full capacity
      console.log(`[TokenBucket] Initializing new bucket with capacity ${req.capacity}`);
      return {
        tokens: req.capacity,
        lastRefillMs: now,
        capacity: req.capacity,
        windowSeconds: req.windowSeconds,
        unit: req.unit,
        policyHash,
      };
    }

    // Policy changed: preserve tokens but clamp to new capacity
    console.log(
      `[TokenBucket] Policy changed. Old: ${existing.capacity}/${existing.windowSeconds}s, New: ${req.capacity}/${req.windowSeconds}s`
    );

    return {
      tokens: Math.min(existing.tokens, req.capacity),
      lastRefillMs: now,
      capacity: req.capacity,
      windowSeconds: req.windowSeconds,
      unit: req.unit,
      policyHash,
    };
  }

  /**
   * Lazy refill: compute tokens based on elapsed time
   *
   * Formula: tokens = min(capacity, tokens + elapsedSeconds * refillRate)
   */
  private refill(
    state: TokenBucketState,
    req: TokenBucketRequest,
    now: number
  ): TokenBucketState {
    const elapsedMs = now - state.lastRefillMs;
    if (elapsedMs <= 0) {
      return state;
    }

    const elapsedSeconds = elapsedMs / 1000;
    const refillRate = req.capacity / req.windowSeconds; // tokens per second
    const tokensToAdd = elapsedSeconds * refillRate;

    return {
      ...state,
      tokens: Math.min(req.capacity, state.tokens + tokensToAdd),
      lastRefillMs: now,
    };
  }

  /**
   * Normalize cost to handle edge cases:
   * - Negative or NaN: treat as 0
   * - Very large: clamp to reasonable max
   */
  private normalizeCost(cost: number): number {
    if (typeof cost !== "number" || isNaN(cost) || cost < 0) {
      return 0;
    }
    // Clamp to prevent overflow (max 1 billion)
    return Math.min(cost, 1_000_000_000);
  }

  /**
   * Validate request parameters
   */
  private validateRequest(req: TokenBucketRequest): string | null {
    if (typeof req.capacity !== "number" || req.capacity <= 0) {
      return "capacity must be a positive number";
    }
    if (typeof req.windowSeconds !== "number" || req.windowSeconds < 60) {
      return "windowSeconds must be at least 60";
    }
    if (req.unit !== "request" && req.unit !== "cents") {
      return "unit must be 'request' or 'cents'";
    }
    if (typeof req.cost !== "number") {
      return "cost must be a number";
    }
    if (!req.policyString) {
      return "policyString is required";
    }
    return null;
  }

  /**
   * Simple hash for policy change detection
   */
  private hashPolicy(policy: string): string {
    // Simple hash for policy comparison
    let hash = 0;
    for (let i = 0; i < policy.length; i++) {
      const char = policy.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
}
