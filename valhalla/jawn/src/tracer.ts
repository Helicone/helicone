import tracer from "dd-trace";
tracer.init({
  // Enable HTTP size tracking only (no body capture)
  plugins: {
    http: {
      enabled: true,
      hooks: {
        request: (span: any, req: any) => {
          span.setTag('http.request.size', parseInt(req.headers['content-length'] as string) || 0);
        },
        response: (span: any, res: any) => {
          span.setTag('http.response.size', parseInt(res.headers['content-length'] as string) || 0);
        }
      }
    },
    https: {
      enabled: true,
      hooks: {
        request: (span: any, req: any) => {
          span.setTag('http.request.size', parseInt(req.headers['content-length'] as string) || 0);
        },
        response: (span: any, res: any) => {
          span.setTag('http.response.size', parseInt(res.headers['content-length'] as string) || 0);
        }
      }
    }
  } as any
}); // Enhanced for Universal Service Monitoring + size tracking
export default tracer;
