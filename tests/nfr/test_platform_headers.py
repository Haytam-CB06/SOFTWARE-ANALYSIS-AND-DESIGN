from fastapi import APIRouter
from fastapi.testclient import TestClient

from app.gateway.app import app as gateway_app
from app.shared.service_app import create_service_app


SECURITY_HEADERS = [
    "x-content-type-options",
    "x-frame-options",
    "referrer-policy",
    "permissions-policy",
    "cross-origin-opener-policy",
]


def test_gateway_health_has_saas_baseline_headers():
    response = TestClient(gateway_app).get("/health", headers={"x-request-id": "nfr-test"})

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "nfr-test"
    assert response.headers["x-service-name"] == "gateway"
    assert "x-response-time-ms" in response.headers
    for header in SECURITY_HEADERS:
        assert header in response.headers


def test_shared_service_factory_has_health_live_ready_and_headers():
    router = APIRouter()

    @router.get("/sample")
    def sample():
        return {"ok": True}

    app = create_service_app(
        service_name="nfr-test-service",
        routers=(router,),
        init_database=False,
    )
    client = TestClient(app)

    for path in ("/health", "/live", "/ready", "/sample"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.headers["x-service-name"] == "nfr-test-service"
        for header in SECURITY_HEADERS:
            assert header in response.headers
