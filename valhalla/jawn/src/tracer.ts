import tracer from "dd-trace";

tracer.init({
  // Enable HTTP size tracking only (no body capture)
  plugins: {
    http: {
      enabled: true,
      hooks: {
        request: (span: any, req: any) => {
          span.setTag(
            "http.request.size",
            parseInt(req.headers["content-length"] as string) || 0
          );
        },
        response: (span: any, res: any) => {
          span.setTag(
            "http.response.size",
            parseInt(res.headers["content-length"] as string) || 0
          );
        },
      },
    },
    https: {
      enabled: true,
      hooks: {
        request: (span: any, req: any) => {
          span.setTag(
            "http.request.size",
            parseInt(req.headers["content-length"] as string) || 0
          );
        },
        response: (span: any, res: any) => {
          span.setTag(
            "http.response.size",
            parseInt(res.headers["content-length"] as string) || 0
          );
        },
      },
    },
  } as any,
}); // Enhanced for Universal Service Monitoring + size tracking

// Disable WebSocket plugin to prevent crash loop with WebSocket connections
// See: https://github.com/DataDog/dd-trace-js/issues/2827
// @ts-ignore - ws plugin exists but not in type definitions
tracer.use('ws', { enabled: false });

export default tracer;
