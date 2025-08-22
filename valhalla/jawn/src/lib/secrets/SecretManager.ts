/**
 * SecretManager handles blue-green rotation of sensitive environment variables.
 * 
 * For each secret, it expects three environment variables:
 * - {SECRET_NAME}_BLUE: The blue version of the secret
 * - {SECRET_NAME}_GREEN: The green version of the secret  
 * - {SECRET_NAME}_ACTIVE: Either "blue" or "green" to indicate which is active
 * 
 * If rotation variables don't exist, it falls back to the original environment variable.
 */

export type RotatableSecret = 
  | 'SUPABASE_DATABASE_URL'
  | 'SUPABASE_SSL_CERT_CONTENTS' 
  | 'SUPABASE_CREDS'
  | 'CLICKHOUSE_CREDS'
  | 'CLOUDFLARE_API_TOKEN'
  | 'DATADOG_API_KEY'
  | 'REQUEST_CACHE_KEY'
  | 'STRIPE_SECRET_KEY';

interface SecretRotationResult {
  value: string | undefined;
  source: 'blue' | 'green' | 'fallback';
  secretName: string;
}

class SecretManagerClass {
  private cache = new Map<string, SecretRotationResult>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Gets the active version of a rotatable secret
   */
  getSecret(secretName: RotatableSecret): string | undefined {
    const cacheKey = secretName;
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.cache.get(cacheKey)!.value;
    }

    const result = this.resolveSecret(secretName);
    
    // Cache the result
    this.cache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);

    // Log rotation events for monitoring (but not the secret values)
    if (result.source !== 'fallback') {
      console.log(`SecretManager: Using ${result.source} version of ${secretName}`);
    }

    return result.value;
  }

  /**
   * Forces a refresh of cached secrets (useful for testing or manual rotation)
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  private resolveSecret(secretName: RotatableSecret): SecretRotationResult {
    const blueKey = `${secretName}_BLUE`;
    const greenKey = `${secretName}_GREEN`;
    const activeKey = `${secretName}_ACTIVE`;

    const blueValue = process.env[blueKey];
    const greenValue = process.env[greenKey];
    const activeColor = process.env[activeKey]?.toLowerCase();

    // If rotation variables don't exist, fall back to original
    if (!blueValue || !greenValue || !activeColor) {
      return {
        value: process.env[secretName],
        source: 'fallback',
        secretName
      };
    }

    // Validate active color
    if (activeColor !== 'blue' && activeColor !== 'green') {
      console.warn(`SecretManager: Invalid active color '${activeColor}' for ${secretName}, falling back to original`);
      return {
        value: process.env[secretName],
        source: 'fallback',
        secretName
      };
    }

    const activeValue = activeColor === 'blue' ? blueValue : greenValue;
    
    return {
      value: activeValue,
      source: activeColor as 'blue' | 'green',
      secretName
    };
  }

  /**
   * Gets rotation status for monitoring/debugging
   */
  getRotationStatus(): Record<RotatableSecret, { source: 'blue' | 'green' | 'fallback' }> {
    const secrets: RotatableSecret[] = [
      'SUPABASE_DATABASE_URL',
      'SUPABASE_SSL_CERT_CONTENTS', 
      'SUPABASE_CREDS',
      'CLICKHOUSE_CREDS',
      'CLOUDFLARE_API_TOKEN',
      'DATADOG_API_KEY',
      'REQUEST_CACHE_KEY',
      'STRIPE_SECRET_KEY'
    ];

    const status = {} as Record<RotatableSecret, { source: 'blue' | 'green' | 'fallback' }>;
    
    for (const secret of secrets) {
      const result = this.resolveSecret(secret);
      status[secret] = { source: result.source };
    }

    return status;
  }
}

// Export singleton instance
export const SecretManager = new SecretManagerClass();