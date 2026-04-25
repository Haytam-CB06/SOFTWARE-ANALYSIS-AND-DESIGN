import os

from locust import HttpUser, between, task


class PublicGatewayUser(HttpUser):
    wait_time = between(0.5, 2.0)

    def on_start(self):
        token = os.getenv("LOCUST_AUTH_TOKEN")
        self.headers = {"Authorization": f"Bearer {token}"} if token else {}

    @task(8)
    def health(self):
        self.client.get("/health", name="GET /health")

    @task(4)
    def readiness(self):
        self.client.get("/ready", name="GET /ready")

    @task(2)
    def service_map(self):
        self.client.get("/service-map", name="GET /service-map")

    @task(1)
    def cors_preflight(self):
        self.client.options(
            "/notifications",
            name="OPTIONS /notifications",
            headers={
                "Origin": os.getenv("LOCUST_ORIGIN", "http://localhost:3000"),
                "Access-Control-Request-Method": "GET",
            },
        )

    @task(1)
    def authenticated_profile_probe(self):
        if self.headers:
            self.client.get("/user/profile", headers=self.headers, name="GET /user/profile")
