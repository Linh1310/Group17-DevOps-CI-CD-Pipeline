
# GROUP 17 – APPLICATION & CONTAINER SECURITY HANDOFF

## 1. Overview

Project: DevOps Linux Project – Group 17

Role: Application & Container Security

Branch: Anh

Repository:
https://github.com/Linh1310/Group17-DevOps-CI-CD-Pipeline

## 2. Application Testing (A1)

The application is a Node.js/Express Task Manager.

Main APIs:
- GET /health
- GET /api/tasks
- POST /api/tasks
- PATCH /api/tasks/:id/complete
- DELETE /api/tasks/:id

Run tests:

cd app
npm ci
npm test

Verified result:
8 tests passed, 0 failed.

## 3. Docker Containerization (A2)

Dockerfile:
docker/Dockerfile

Optimized Dockerfile:
docker/Dockerfile.slim

Docker Compose:
docker/compose.yaml

Build the optimized image from the repository root:

docker build -f docker/Dockerfile.slim \
  -t group17-vku-task-manager:slim .

Run the application with Docker Compose:

docker compose -f docker/compose.yaml up -d --build

Health endpoint:
http://localhost:8000/health

## 4. Docker Registry (A3)

Docker Hub repository:
ngocanh090206/group17-vku-task-manager

Optimized image:
ngocanh090206/group17-vku-task-manager:secure-v1

Pull:

docker pull \
  ngocanh090206/group17-vku-task-manager:secure-v1

The image was successfully pushed, pulled,
and tested using port 8001.

## 5. Trivy Security Scanning (A4)

Scan script:
security/scan-image.sh

From the repository root:

./security/scan-image.sh \
  ngocanh090206/group17-vku-task-manager:secure-v1

Reports:
- security/reports/security-pass.json
- security/reports/security-fail.json

The scan script uses Docker to run Trivy.

## 6. Security Gate (A5)

Security Gate script:
security/security-gate.sh

PASS scenario:

./security/security-gate.sh \
  ngocanh090206/group17-vku-task-manager:secure-v1

Expected exit code: 0

FAIL scenario:

./security/security-gate.sh \
  ngocanh090206/group17-vku-task-manager:latest

Previously verified:
11 HIGH vulnerabilities in the older image.

Expected exit code: 1 when those vulnerabilities
are detected.

The Jenkins pipeline should fail when the
Security Gate returns a non-zero exit code.

Note:
The FAIL scenario depends on the older image
remaining available and vulnerable.

## 7. Container Optimization (A6)

Original image size: 244 MB
Optimized image size: 200 MB

Reduction: 44 MB
Percentage reduction: 18.03%

Optimization:
- Multi-stage Docker build
- Alpine-based runtime
- .dockerignore
- Non-root container user

## 8. Jenkins Integration Notes

Suggested pipeline stages:

1. Checkout source
2. Install dependencies
3. Run npm test
4. Build Docker image
5. Run Trivy Security Gate
6. Push image to Docker Hub
7. Deploy

Requirements:
- Docker access on the Jenkins agent
- Docker Hub credentials for pushing
- Trivy Docker image
- Network access for vulnerability DB updates

The current security scripts invoke sudo docker.
The Jenkins administrator must configure Docker
permissions appropriately before integration.

Jenkins integration is handled by the CI/CD
team member and must be tested separately.
