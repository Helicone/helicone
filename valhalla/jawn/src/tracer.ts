import tracer from "dd-trace";
tracer.init({
  // Enable HTTP size tracking only (no body capture)
  plugins: {
    http: {
      enabled: true,
      hooks: {
        request: (span, req) => {
          span.setTag('http.request.size', parseInt(req.headers['content-length'] as string) || 0);
        },
        response: (span, res) => {
          span.setTag('http.response.size', parseInt(res.headers['content-length'] as string) || 0);
        }
      }
    },
    https: {
      enabled: true,
      hooks: {
        request: (span, req) => {
          span.setTag('http.request.size', req.headers['content-length'] || 0);
        },
        response: (span, res) => {
          span.setTag('http.response.size', res.headers['content-length'] || 0);
        }
      }
    }
  }
}); // Enhanced for Universal Service Monitoring + size tracking
export default tracer;
