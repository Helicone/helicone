from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.context import attach, set_value

from traceloop.sdk import Traceloop

from typing import Optional
import os

from ._constants import SUPPORTED_INSTRUMENTS


class HeliconeAsyncLogger:
    base_url: str
    api_key: str
    _logging_enabled: bool = True
    exporter: OTLPSpanExporter

    def __init__(
        self,
        api_key: str | None = None,
        base_url: Optional[str] = "https://api.helicone.ai/v1/trace/log-python",
    ) -> None:
        if api_key is None:
            api_key = os.getenv("HELICONE_API_KEY")
        if api_key is None:
            raise Exception(
                "The Helicone API Key must be set either by passing api_key to the class or by setting the HELICONE_API_KEY environment variable."
            )
        self.api_key = api_key

        self.base_url = base_url

    def init(self) -> None:
        self.exporter = OTLPSpanExporter(
            endpoint=self.base_url,
            headers={"Authorization": f"Bearer {self.api_key}"},
        )

        os.environ["TRACELOOP_TRACE_CONTENT"] = "true"

        Traceloop.init(
            exporter=self.exporter,
            disable_batch=True,
            should_enrich_metrics=False,
            instruments=SUPPORTED_INSTRUMENTS,
        )
        self._logging_enabled = True

    def disable_content_tracing(self) -> None:
        os.environ["TRACELOOP_TRACE_CONTENT"] = "false"

    def enable_content_tracing(self) -> None:
        os.environ["TRACELOOP_TRACE_CONTENT"] = "true"

    def set_properties(self, properties: dict) -> None:
        Traceloop.set_association_properties(properties)

    def disable_logging(self) -> None:
        """
        Completely disables all logging by shutting down the Traceloop SDK.
        After calling this method, no more traces will be sent to Helicone.
        To resume logging, call enable_logging() again.
        """
        if self._logging_enabled:
            if self.exporter:
                self.exporter.shutdown()
            self._logging_enabled = False

    def enable_logging(self) -> None:
        """
        Re-enables logging if it was previously disabled.
        This reinitializes the Traceloop SDK with a fresh exporter instance.
        """
        if not self._logging_enabled:
            # Create a new exporter instance
            self.exporter.__init__(endpoint=self.base_url, headers={
                                   "Authorization": f"Bearer {self.api_key}"})
