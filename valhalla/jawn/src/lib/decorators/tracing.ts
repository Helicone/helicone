import tracer from "../../tracer";
import { isError, err, ok } from "../../packages/common/result";

type Tags = Record<string, string | number | boolean | undefined>;
type TagFactory = (ctx: { thisArg: any; args: any[] }) => Tags | undefined;

export function withActiveSpan() {
  try {
    return tracer.scope().active() || null;
  } catch {
    return null;
  }
}

export function Traced(name: string, baseTags?: Tags | TagFactory) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      return tracer.trace(name, async (span) => {
        const tags =
          typeof baseTags === "function" ? baseTags({ thisArg: this, args }) : baseTags;
        if (tags) {
          for (const [k, v] of Object.entries(tags)) {
            if (v !== undefined) span.setTag(k, v);
          }
        }
        try {
          const res = await original.apply(this, args);
          if (isError(res)) {
            const e = (res as any).error;
            span.setTag("error", true);
            span.setTag("error.type", e?.code || "unknown");
            span.setTag("error.message", e?.message);
          }
          return res;
        } catch (e) {
          span.setTag("error", true);
          span.setTag("error.type", "UNEXPECTED_ERROR");
          span.setTag("error.message", e instanceof Error ? e.message : String(e));
          throw e;
        }
      });
    };
    return descriptor;
  };
}

export function TracedController<TError extends { statusCode?: number; code?: string; message: string }>(
  name: string,
  options: {
    baseTags?: Tags | TagFactory;
    formatError: (e: TError) => string;
    successStatus?: number | ((res: any) => number);
  }
) {
  const { baseTags, formatError, successStatus = 200 } = options;
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      return tracer.trace(name, async (span) => {
        const tags =
          typeof baseTags === "function" ? baseTags({ thisArg: this, args }) : baseTags;
        if (tags) {
          for (const [k, v] of Object.entries(tags)) {
            if (v !== undefined) span.setTag(k, v);
          }
        }
        try {
          const res = await original.apply(this, args);
          if (isError(res)) {
            const e = (res as any).error as TError;
            span.setTag("error", true);
            span.setTag("error.type", e?.code || "unknown");
            span.setTag("error.message", e?.message);
            // "this" is the Controller instance from TSOA
            if (typeof (this as any).setStatus === "function") {
              (this as any).setStatus(e?.statusCode || 500);
            }
            return err(formatError(e));
          }
          const status =
            typeof successStatus === "function" ? successStatus(res) : successStatus;
          if (typeof (this as any).setStatus === "function") {
            (this as any).setStatus(status);
          }
          return res;
        } catch (e) {
          span.setTag("error", true);
          span.setTag("error.type", "UNEXPECTED_ERROR");
          span.setTag("error.message", e instanceof Error ? e.message : String(e));
          if (typeof (this as any).setStatus === "function") {
            (this as any).setStatus(500);
          }
          return err(formatError({ message: e instanceof Error ? e.message : String(e) } as TError));
        }
      });
    };
    return descriptor;
  };
}


