import argparse
import json
import statistics
import time
import urllib.error
import urllib.request


DEFAULT_PATHS = ["/health", "/ready", "/service-map"]
REQUIRED_HEADERS = [
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
    "cross-origin-opener-policy",
    "x-request-id",
    "x-response-time-ms",
]


def request(url: str, timeout: float):
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            body = response.read(4096).decode("utf-8", errors="replace")
            elapsed_ms = (time.perf_counter() - started) * 1000
            return response.status, dict(response.headers), body, elapsed_ms
    except urllib.error.HTTPError as exc:
        body = exc.read(4096).decode("utf-8", errors="replace")
        elapsed_ms = (time.perf_counter() - started) * 1000
        return exc.code, dict(exc.headers), body, elapsed_ms


def main() -> int:
    parser = argparse.ArgumentParser(description="Run SaaS non-functional smoke checks.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--timeout", type=float, default=5.0)
    parser.add_argument("--max-p95-ms", type=float, default=750.0)
    parser.add_argument("--paths", nargs="*", default=DEFAULT_PATHS)
    args = parser.parse_args()

    failures = []
    timings = []
    results = []

    for path in args.paths:
        url = f"{args.base_url.rstrip('/')}/{path.lstrip('/')}"
        status, headers, body, elapsed_ms = request(url, args.timeout)
        lower_headers = {key.lower(): value for key, value in headers.items()}
        timings.append(elapsed_ms)
        results.append({"path": path, "status": status, "elapsed_ms": round(elapsed_ms, 2)})

        if status >= 500:
            failures.append(f"{path} returned {status}")
        for header in REQUIRED_HEADERS:
            if header not in lower_headers:
                failures.append(f"{path} missing {header}")
        if path == "/ready" and status not in {200, 503}:
            failures.append("/ready must return 200 or 503")
        if path == "/health" and status != 200:
            failures.append("/health must return 200")
        if path == "/health":
            try:
                json.loads(body)
            except json.JSONDecodeError:
                failures.append("/health did not return JSON")

    p95 = statistics.quantiles(timings, n=20)[18] if len(timings) >= 2 else timings[0]
    if p95 > args.max_p95_ms:
        failures.append(f"p95 {p95:.2f}ms exceeded budget {args.max_p95_ms:.2f}ms")

    print(json.dumps({"results": results, "p95_ms": round(p95, 2), "failures": failures}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
