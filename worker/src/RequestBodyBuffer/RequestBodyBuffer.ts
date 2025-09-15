import { Container, getContainer } from "@cloudflare/containers";

export class RequestBodyBuffer extends Container {
  defaultPort = 8000; // Port the container is listening on
  sleepAfter = "10m"; // Stop the instance if requests not sent for 10 minutes
}
