from dataclasses import dataclass, field, asdict
from enum import Enum, auto
from uuid import uuid4
from typing import Optional

from helicone.requester import Requests


class HeliconeStatus(Enum):
    PENDING = auto()
    RUNNING = auto()
    SUCCESS = auto()
    FAILED = auto()
    CANCELLED = auto()


@dataclass(kw_only=True)
class HeliconeNodeConfig:
    parent_job_id: Optional[str] = None
    name: Optional[str] = None
    description: str = ""
    custom_properties: dict[str, str] = field(default_factory=dict)


@dataclass(kw_only=True)
class HeliconeNode(HeliconeNodeConfig):
    job: "HeliconeJob"
    id: str = field(default_factory=lambda: str(uuid4()))
    status: HeliconeStatus = HeliconeStatus.PENDING
    requester: Requests = field(default_factory=Requests)

    def to_dict(self):
        return {
            "id": self.id,
            "job": self.job.id,
            "parentJobId": self.parent_job_id,
            "name": self.name,
            "description": self.description,
            "customProperties": self.custom_properties,
        }

    def __post_init__(self):
        self.requester.post(
            "/node",
            json=self.to_dict(),
        )

    def create_child_node(self, config: HeliconeNodeConfig) -> "HeliconeNode":
        task_data = asdict(config)
        task_data["parent_job_id"] = self.id
        return HeliconeNode(job=self.job, **task_data)

    def _is_completed(self) -> bool:
        return self.status == HeliconeStatus.SUCCESS or self.status == HeliconeStatus.FAILED

    def set_status(self, status: HeliconeNodeConfig):
        self.requester.patch(
            f"/node/{self.id}/status",
            json={
                "status": status.name
            }
        )
        self.status = status

    def success(self):
        self.set_status(HeliconeStatus.SUCCESS)

    def fail(self):
        self.set_status(HeliconeStatus.FAILED)

    def cancel(self):
        self.set_status(HeliconeStatus.CANCELLED)


@dataclass
class HeliconeJob:
    name: str
    description: str = ""
    custom_properties: dict[str, str] = field(default_factory=dict)
    timeout_seconds: int = 60
    status: HeliconeStatus = HeliconeStatus.PENDING
    requester: Requests = field(default_factory=Requests)
    id: str = field(default_factory=lambda: str(uuid4()))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "customProperties": self.custom_properties,
            "timeoutSeconds": self.timeout_seconds,
            "status": self.status.name
        }

    def __post_init__(self):
        self.requester.post(
            "/job",
            json=self.to_dict()
        )

    def _is_completed(self) -> bool:
        return self.status == HeliconeStatus.SUCCESS or self.status == HeliconeStatus.FAILED

    def create_node(self, config: HeliconeNodeConfig) -> HeliconeNode:
        task_data = asdict(config)
        return HeliconeNode(job=self, **task_data)

    def set_status(self, status: HeliconeStatus):
        self.requester.patch(
            f"/job/{self.id}/status",
            json={
                "status": status.name
            }
        )
        self.status = status

    def success(self):
        self.set_status(HeliconeStatus.SUCCESS)

    def fail(self):
        self.set_status(HeliconeStatus.FAILED)

    def cancel(self):
        self.set_status(HeliconeStatus.CANCELLED)
