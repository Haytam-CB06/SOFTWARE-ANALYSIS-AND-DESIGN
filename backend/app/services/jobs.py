from __future__ import annotations

import traceback
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Callable
from uuid import uuid4


_LOCK = Lock()
_JOBS: dict[str, dict[str, Any]] = {}


def create_job(kind: str) -> str:
    job_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat()
    with _LOCK:
        _JOBS[job_id] = {
            "id": job_id,
            "kind": kind,
            "status": "queued",
            "created_at": now,
            "started_at": None,
            "finished_at": None,
            "result": None,
            "error": None,
        }
    return job_id


def get_job(job_id: str) -> dict[str, Any] | None:
    with _LOCK:
        job = _JOBS.get(job_id)
        return dict(job) if job else None


def run_job(job_id: str, fn: Callable[[], Any]) -> None:
    with _LOCK:
        if job_id not in _JOBS:
            return
        _JOBS[job_id]["status"] = "running"
        _JOBS[job_id]["started_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = fn()
        with _LOCK:
            _JOBS[job_id]["status"] = "succeeded"
            _JOBS[job_id]["result"] = result
            _JOBS[job_id]["finished_at"] = datetime.now(timezone.utc).isoformat()
    except Exception as exc:
        with _LOCK:
            _JOBS[job_id]["status"] = "failed"
            _JOBS[job_id]["error"] = {
                "type": exc.__class__.__name__,
                "message": str(exc),
                "trace": traceback.format_exc(limit=6),
            }
            _JOBS[job_id]["finished_at"] = datetime.now(timezone.utc).isoformat()
