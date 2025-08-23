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

interface SecretRotationResult {
  value: string | undefined;
  source: "blue" | "green" | "fallback";
  secretName: string;
}

class SecretManagerClass {
  getSecret(
    secretName: string,
    fallback: string | undefined = undefined
  ): string | undefined {
    const result = this.resolveSecret(secretName);
    if (!result.value && fallback) {
      const fallbackResult = this.resolveSecret(fallback);
      if (fallbackResult.value) {
        return fallbackResult.value;
      }
    }
    return result.value;
  }

  private tryInfisical(): Record<string, string> | null {
    const infisicalAWSEnv = process.env.INFISICAL_AWS_ENV;
    if (!infisicalAWSEnv) {
      return null;
    }
    try {
      const infisical = JSON.parse(infisicalAWSEnv);
      return infisical;
    } catch (error) {
      return null;
    }
  }
  private getSecretFromEnv(secretName: string): string | undefined {
    const infisicalAWSEnv = this.tryInfisical();
    if (infisicalAWSEnv) {
      return infisicalAWSEnv[secretName];
    }
    return process.env[secretName];
  }

  private resolveSecret(secretName: string): SecretRotationResult {
    const blueKey = `${secretName}_BLUE`;
    const greenKey = `${secretName}_GREEN`;

    const blueValue = this.getSecretFromEnv(blueKey);
    const greenValue = this.getSecretFromEnv(greenKey);
    const activeColor = process.env.ACTIVE_SECRET_CYCLE?.toLowerCase();

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

  /**
   * Gets the current active secret cycle
   */
  getActiveSecretCycle(): "blue" | "green" | "none" {
    const activeColor = process.env.ACTIVE_SECRET_CYCLE?.toLowerCase();
    if (activeColor === "blue" || activeColor === "green") {
      return activeColor;
    }
    return "none";
  }
}

// Export singleton instance
export const SecretManager = new SecretManagerClass();
