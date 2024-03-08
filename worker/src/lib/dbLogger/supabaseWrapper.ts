import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  GenericSchema,
  SupabaseClientOptions,
} from "@supabase/supabase-js/dist/module/lib/types";

export async function measureExecutionTime<T>(
  promise: Promise<T>,
  operationName: string = "Operation"
): Promise<T> {
  const start = performance.now();
  try {
    const result = await promise;
    const end = performance.now();
    console.log(`${operationName} took ${end - start} ms`);
    return result;
  } catch (error) {
    const end = performance.now();
    console.log(`${operationName} failed after ${end - start} ms`);
    throw error;
  }
}

// export default class TimedSupabaseClient<
//   Database = any,
//   SchemaName extends string & keyof Database = "public" extends keyof Database
//     ? "public"
//     : string & keyof Database,
//   Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
//     ? Database[SchemaName]
//     : any
// > extends SupabaseClient<Database, SchemaName> {
//   constructor(
//     supabaseUrl: string,
//     supabaseKey: string,
//     options?: SupabaseClientOptions<SchemaName>
//   ) {
//     super(supabaseUrl, supabaseKey, options);
//     this.initTiming();
//   }

//   private wrapAllMethods() {
//     const methodsToWrap = ["select", "insert", "update", "delete"]; // Add all methods you want to wrap

//     methodsToWrap.forEach((method) => {
//       const originalMethod = this.from.prototype[method];
//       this.from.prototype[method] = (...args) => {
//         const start = performance.now();
//         const promise = originalMethod.apply(this, args);

//         promise
//           .then(() => {
//             const end = performance.now();
//             this.logToDatadog(`${method} method execution time`, end - start);
//           })
//           .catch(() => {
//             const end = performance.now();
//             this.logToDatadog(
//               `${method} method execution time (failed)`,
//               end - start
//             );
//           });

//         return promise;
//       };
//     });
//   }
// }
