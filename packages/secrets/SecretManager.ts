/**
 * SecretManager handles blue-green rotation of sensitive environment variables.
 *
 * For each secret, it expects:
 * - {SECRET_NAME}_BLUE: The blue version of the secret
 * - {SECRET_NAME}_GREEN: The green version of the secret
 *
 * A single environment variable controls which cycle is active:
 * - ACTIVE_SECRET_CYCLE: Either "blue" or "green" to indicate which is active for all secrets
 *
 * If rotation variables don't exist, it falls back to the original environment variable.
 */

const KNOWN_SECRET_DICTIONARIES = ["JAWN_DATABASE_CONNECTIONS"];

interface SecretRotationResult {
  value: string | undefined;
  source: "blue" | "green" | "fallback";
  secretName: string;
}

export class SecretManagerClass {
  private envLookupFunctions: ((key: string) => string | undefined)[] = [];

  constructor(envLookupFunctions: ((key: string) => string | undefined)[]) {
    this.envLookupFunctions = envLookupFunctions;
  }

  getSecret(
    secretName: string,
    fallback: string | undefined = undefined
  ): string | undefined {
    for (const func of this.envLookupFunctions) {
      const result = func(secretName);
      if (result) {
        return result;
      }
    }
    const result = this.resolveSecret(secretName);
    if (!result.value && fallback) {
      const fallbackResult = this.resolveSecret(fallback);
      if (fallbackResult.value) {
        return fallbackResult.value;
      }
    }
    return result.value;
  }

  private tryKnownDictionaries(secretName: string): string | null {
    for (const dictionary of KNOWN_SECRET_DICTIONARIES) {
      const dictionaryEnv = process.env?.[dictionary];
      if (dictionaryEnv) {
        try {
          const dictionaryObject = JSON.parse(dictionaryEnv);
          if (dictionaryObject[secretName]) {
            return dictionaryObject[secretName];
          }
        } catch (error) {
          return null;
        }
      }
    }
    return null;
  }
  private getSecretFromEnv(secretName: string): string | undefined {
    const knownDictionarySecret = this.tryKnownDictionaries(secretName);
    if (knownDictionarySecret !== null) {
      return knownDictionarySecret;
    }
    return process.env[secretName];
  }

  private resolveSecret(secretName: string): SecretRotationResult {
    const blueKey = `${secretName}_BLUE`;
    const greenKey = `${secretName}_GREEN`;

    const blueValue = this.getSecretFromEnv(blueKey);
    const greenValue = this.getSecretFromEnv(greenKey);
    const activeColor = this.getSecretFromEnv(
      "ACTIVE_SECRET_CYCLE"
    )?.toLowerCase();

    // If rotation variables don't exist, fall back to original
    if (!blueValue || !greenValue || !activeColor) {
      return {
        value: this.getSecretFromEnv(secretName),
        source: "fallback",
        secretName,
      };
    }

    // Validate active color
    if (activeColor !== "blue" && activeColor !== "green") {
      console.warn(
        `SecretManager: Invalid ACTIVE_SECRET_CYCLE value '${activeColor}', falling back to original`
      );
      return {
        value: this.getSecretFromEnv(secretName),
        source: "fallback",
        secretName,
      };
    }

    const activeValue = activeColor === "blue" ? blueValue : greenValue;

    return {
      value: activeValue,
      source: activeColor as "blue" | "green",
      secretName,
    };
  }
}

// Export singleton instance
export const SecretManager = new SecretManagerClass();
