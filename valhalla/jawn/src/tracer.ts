import tracer from "dd-trace";
// tracer.init(); // DISABLED - was causing high egress costs to Datadog
export default tracer;
