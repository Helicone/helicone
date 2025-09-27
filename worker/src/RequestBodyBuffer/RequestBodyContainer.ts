import { Container } from "@cloudflare/containers";

export class RequestBodyBufferContainer extends Container {
  defaultPort = 8000; // Port the container is listening on
  sleepAfter = "10m"; // Stop the instance if requests not sent for 10 minutes
}
