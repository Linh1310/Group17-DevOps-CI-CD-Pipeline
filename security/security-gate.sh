
#!/usr/bin/env bash
set -euo pipefail

IMAGE="${1:-ngocanh090206/group17-vku-task-manager:secure-v1}"

echo "=== GROUP 17 SECURITY GATE ==="
echo "Scanning image: $IMAGE"

sudo docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v trivy-cache:/root/.cache \
  aquasec/trivy:0.76.2 image \
  --scanners vuln \
  --severity HIGH,CRITICAL \
  --exit-code 1 \
  "$IMAGE"

echo "SECURITY GATE: PASS"
