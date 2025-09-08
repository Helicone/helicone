import tracer from "../tracer";

type TraceConfig = {
  name?: string;
  resource?: string;
  type?: string;
  tags?: Record<string, unknown>;
  onStart?: (ctx: { args: unknown[]; that: any }) => Record<string, unknown> | void;
  onSuccess?: (ctx: { args: unknown[]; that: any; result: unknown }) => Record<string, unknown> | void;
  onError?: (ctx: { args: unknown[]; that: any; error: unknown }) => Record<string, unknown> | void;
};

export function Trace(configOrName?: string | TraceConfig) {
  return function (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const that = this as any;
      const className = that?.constructor?.name ?? "UnknownClass";
      const cfg: TraceConfig =
        typeof configOrName === "string"
          ? { name: configOrName }
          : configOrName ?? {};

      const spanName = cfg.name ?? `${className}.${String(propertyKey)}`;
      const span = tracer.startSpan(spanName);
      if (cfg.resource) span.setTag("resource.name", cfg.resource);
      if (cfg.type) span.setTag("span.type", cfg.type);
      if (cfg.tags) {
        for (const [k, v] of Object.entries(cfg.tags)) {
          span.setTag(k, v as any);
        }
      }

      try {
        const startTags = cfg.onStart?.({ args, that });
        if (startTags) {
          for (const [k, v] of Object.entries(startTags)) {
            span.setTag(k, v as any);
          }
        }

        const maybePromise = original.apply(this, args);
        if (maybePromise && typeof maybePromise.then === "function") {
          return (maybePromise as Promise<unknown>)
            .then((result) => {
              const successTags = cfg.onSuccess?.({ args, that, result });
              if (successTags) {
                for (const [k, v] of Object.entries(successTags)) {
                  span.setTag(k, v as any);
                }
              }
              return result;
            })
            .catch((error) => {
              span.setTag("error", true);
              span.setTag("error.message", error instanceof Error ? error.message : String(error));
              const errorTags = cfg.onError?.({ args, that, error });
              if (errorTags) {
                for (const [k, v] of Object.entries(errorTags)) {
                  span.setTag(k, v as any);
                }
              }
              throw error;
            })
            .finally(() => {
              span.finish();
            });
        } else {
          const result = maybePromise;
          const successTags = cfg.onSuccess?.({ args, that, result });
          if (successTags) {
            for (const [k, v] of Object.entries(successTags)) {
              span.setTag(k, v as any);
            }
          }
          span.finish();
          return result;
        }
      } catch (error) {
        span.setTag("error", true);
        span.setTag("error.message", error instanceof Error ? error.message : String(error));
        const errorTags = cfg.onError?.({ args, that, error });
        if (errorTags) {
          for (const [k, v] of Object.entries(errorTags)) {
            span.setTag(k, v as any);
          }
        }
        span.finish();
        throw error;
      }
    };

    return descriptor;
  };
}


