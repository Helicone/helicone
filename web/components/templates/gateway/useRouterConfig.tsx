import { useState, useEffect } from "react";
import yaml from "js-yaml";
import { RouterConfigFormState } from "./RouterConfigForm";

export const useRouterConfig = (initialConfig?: any) => {
  const [state, setState] = useState<RouterConfigFormState>({
    // Load balance configuration
    loadBalance: {
      type: "model-latency",
      inner: ["openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"],
    },

    // Cache configuration
    enableCache: false,
    cacheDirective: "max-age=3600, max-stale=1800",
    cacheBuckets: "10",
    cacheSeed: "unique-cache-seed",

    // Rate limiting configuration
    enableRateLimit: false,
    rateLimitCapacity: "1000",
    rateLimitRefillFrequency: "10s",

    // Retries configuration
    enableRetries: false,
    retryStrategy: "constant",
    constantDelay: "100ms",
    constantMaxRetries: "2",
    exponentialMinDelay: "100ms",
    exponentialMaxDelay: "30s",
    exponentialMaxRetries: "2",
    exponentialFactor: "2.0",

    // Load balance configuration (for create mode)
    loadBalanceConfig: {},
  });

  // Parse config object and set form values
  const parseConfigToForm = (configObj: any) => {
    const newState: RouterConfigFormState = {
      // Load balance configuration
      loadBalance: {
        type: "model-latency",
        inner: ["openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"],
      },

      // Cache configuration
      enableCache: false,
      cacheDirective: "max-age=3600, max-stale=1800",
      cacheBuckets: "10",
      cacheSeed: "unique-cache-seed",

      // Rate limiting configuration
      enableRateLimit: false,
      rateLimitCapacity: "1000",
      rateLimitRefillFrequency: "10s",

      // Retries configuration
      enableRetries: false,
      retryStrategy: "constant",
      constantDelay: "100ms",
      constantMaxRetries: "2",
      exponentialMinDelay: "100ms",
      exponentialMaxDelay: "30s",
      exponentialMaxRetries: "2",
      exponentialFactor: "2.0",
    };

    if (configObj["load-balance"]) {
      // newState.loadBalanceConfig = configObj["load-balance"] as Record<
      //   string,
      //   unknown
      // >;

      // Parse load balance configuration
      const loadBalance = configObj["load-balance"];
      if ("chat" in loadBalance && loadBalance.chat) {
        const chatConfig = loadBalance.chat;
        const strategy = chatConfig.strategy || "model-latency";

        if (strategy === "model-latency") {
          newState.loadBalance = {
            type: "model-latency",
            inner: chatConfig.models || [
              "openai/gpt-4o-mini",
              "anthropic/claude-3-5-sonnet",
            ],
          };
        } else if (strategy === "model-weighted") {
          newState.loadBalance = {
            type: "model-weighted",
            inner: chatConfig.models || [],
          };
        } else if (strategy === "provider-weighted") {
          newState.loadBalance = {
            type: "provider-weighted",
            inner: chatConfig.providers || [],
          };
        } else if (strategy === "provider-latency") {
          newState.loadBalance = {
            type: "provider-latency",
            inner: chatConfig.providers || [],
          };
        } else {
          newState.loadBalance = {
            type: "model-latency",
            inner: ["openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"],
          };
        }
      }
    }

    // Cache configuration
    if (configObj.cache) {
      newState.enableCache = true;
      newState.cacheDirective =
        configObj.cache.directive || "max-age=3600, max-stale=1800";
      newState.cacheBuckets = String(configObj.cache.buckets || 10);
      newState.cacheSeed = configObj.cache.seed || "unique-cache-seed";
    }

    // Rate limiting configuration
    if (configObj["rate-limit"]?.["per-api-key"]) {
      newState.enableRateLimit = true;
      newState.rateLimitCapacity = String(
        configObj["rate-limit"]["per-api-key"].capacity || 1000,
      );
      newState.rateLimitRefillFrequency =
        configObj["rate-limit"]["per-api-key"]["refill-frequency"] || "10s";
    }

    // Retries configuration
    if (configObj.retries) {
      newState.enableRetries = true;
      const strategy = configObj.retries.strategy || "constant";
      newState.retryStrategy = strategy;

      if (strategy === "constant") {
        newState.constantDelay = configObj.retries.delay || "100ms";
        newState.constantMaxRetries = String(
          configObj.retries["max-retries"] || 2,
        );
      } else if (strategy === "exponential") {
        newState.exponentialMinDelay =
          configObj.retries["min-delay"] || "100ms";
        newState.exponentialMaxDelay = configObj.retries["max-delay"] || "30s";
        newState.exponentialMaxRetries = String(
          configObj.retries["max-retries"] || 2,
        );
        newState.exponentialFactor = String(configObj.retries.factor || 2.0);
      }
    }

    setState(newState);
  };

  // Generate config object from form state
  const generateConfig = () => {
    const configObj: Record<string, unknown> = {};

    // Load balancing configuration (always included for create mode)
    const chatConfig: Record<string, unknown> = {
      strategy: state.loadBalance.type, // Use the type as the strategy
    };

    switch (state.loadBalance.type) {
      case "model-latency":
        chatConfig.models = state.loadBalance.inner;
        break;
      case "model-weighted":
        chatConfig.models = state.loadBalance.inner;
        break;
      case "provider-weighted":
        chatConfig.providers = state.loadBalance.inner;
        break;
      case "provider-latency":
        chatConfig.providers = state.loadBalance.inner;
        break;
    }

    configObj["load-balance"] = {
      chat: chatConfig,
    };

    // Cache configuration
    if (state.enableCache) {
      configObj.cache = {
        directive: state.cacheDirective,
        buckets: parseInt(state.cacheBuckets),
        seed: state.cacheSeed,
      };
    }

    // Rate limiting configuration
    if (state.enableRateLimit) {
      configObj["rate-limit"] = {
        "per-api-key": {
          capacity: parseInt(state.rateLimitCapacity),
          "refill-frequency": state.rateLimitRefillFrequency,
        },
      };
    }

    // Retries configuration
    if (state.enableRetries) {
      const retryConfig: Record<string, unknown> = {
        strategy: state.retryStrategy,
      };

      if (state.retryStrategy === "constant") {
        if (state.constantDelay) retryConfig.delay = state.constantDelay;
        if (state.constantMaxRetries)
          retryConfig["max-retries"] = parseInt(state.constantMaxRetries);
      } else if (state.retryStrategy === "exponential") {
        if (state.exponentialMinDelay)
          retryConfig["min-delay"] = state.exponentialMinDelay;
        if (state.exponentialMaxDelay)
          retryConfig["max-delay"] = state.exponentialMaxDelay;
        if (state.exponentialMaxRetries)
          retryConfig["max-retries"] = parseInt(state.exponentialMaxRetries);
        if (state.exponentialFactor)
          retryConfig.factor = parseFloat(state.exponentialFactor);
      }

      configObj.retries = retryConfig;
    }

    return configObj;
  };

  // Generate YAML string from form state
  const generateYaml = () => {
    const configObj = generateConfig();
    return yaml.dump(configObj);
  };

  // Initialize from existing config
  useEffect(() => {
    if (initialConfig) {
      parseConfigToForm(initialConfig);
    }
  }, [initialConfig]);

  return {
    state,
    setState,
    parseConfigToForm,
    generateConfig,
    generateYaml,
  };
};
