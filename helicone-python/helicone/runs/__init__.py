from dataclasses import dataclass, field, asdict
from enum import Enum, auto
from uuid import uuid4
from typing import Optional

from helicone.requester import Requests


@dataclass(kw_only=True)
class HeliconeTaskConfig:
    parent_task_id: Optional[str] = None
    name: Optional[str] = None
    description: str = ""
    custom_properties: dict[str, str] = field(default_factory=dict)


@dataclass(kw_only=True)
class HeliconeTask(HeliconeTaskConfig):
    run: "HeliconeJob"
    id: str = field(default_factory=lambda: str(uuid4()))
    requester: Requests = field(default_factory=Requests)

    def to_dict(self):
        return {
            "id": self.id,
            "run": self.run.id,
            "parentTaskId": self.parent_task_id,
            "name": self.name,
            "description": self.description,
            "customProperties": self.custom_properties,
        }

    def __post_init__(self):
        self.requester.post(
            "/task",
            json=self.to_dict(),
        )

    def create_child_task(self, config: HeliconeTaskConfig) -> "HeliconeTask":
        task_data = asdict(config)
        task_data["parent_task_id"] = self.id
        return HeliconeTask(run=self.run, **task_data)


class HeliconeRunStatus(Enum):
    PENDING = auto()
    RUNNING = auto()
    SUCCESS = auto()
    FAILED = auto()
    CANCELLED = auto()


@dataclass
class HeliconeJob:
    name: str
    description: str = ""
    custom_properties: dict[str, str] = field(default_factory=dict)
    timeout_seconds: int = 60
    status: HeliconeRunStatus = HeliconeRunStatus.PENDING
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
            "/run",
            json=self.to_dict()
        )

    def _is_completed(self) -> bool:
        return self.status == HeliconeRunStatus.SUCCESS or self.status == HeliconeRunStatus.FAILED

    def _error_if_completed(self):
        if (self._is_completed()):
            raise Exception(
                "Cannot create a task on a run that has completed")

    def create_task(self, config: HeliconeTaskConfig) -> HeliconeTask:
        self._error_if_completed()
        task_data = asdict(config)
        return HeliconeTask(run=self, **task_data)

    def set_status(self, status: HeliconeRunStatus):
        self._error_if_completed()
        self.requester.patch(
            f"/run/{self.id}/status",
            json={
                "status": status.name
            }
        )
        self.status = status

    def success(self):
        self.set_status(HeliconeRunStatus.SUCCESS)

    def fail(self):
        self.set_status(HeliconeRunStatus.FAILED)

    def cancel(self):
        self.set_status(HeliconeRunStatus.CANCELLED)
