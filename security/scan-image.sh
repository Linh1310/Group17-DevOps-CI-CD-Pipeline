
#!/usr/bin/env bash
set -euo pipefail

IMAGE="${1:-group17-vku-task-manager:slim}"
REPORT_DIR="security/reports"
REPORT_FILE="$REPORT_DIR/scan-result.json"

mkdir -p "$REPORT_DIR"

echo "=== GROUP 17 TRIVY SECURITY SCAN ==="
echo "Image: $IMAGE"

sudo docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v trivy-cache:/root/.cache \
  -v "$(pwd)/$REPORT_DIR:/reports" \
  aquasec/trivy:0.76.2 image \
  --scanners vuln \
  --severity HIGH,CRITICAL \
  --format json \
  --output /reports/scan-result.json \
  "$IMAGE"

echo "=== VULNERABILITY SUMMARY ==="

jq -r '
  [.Results[]?.Vulnerabilities[]?.Severity]
  | group_by(.)
  | map("\(.[0]): \(length)")
  | if length == 0 then "HIGH/CRITICAL: 0" else .[] end
' "$REPORT_FILE"

COUNT=$(jq '
  [.Results[]?.Vulnerabilities[]?
   | select(.Severity == "HIGH" or .Severity == "CRITICAL")]
  | length
' "$REPORT_FILE")

if [ "$COUNT" -gt 0 ]; then
  echo "SECURITY GATE: FAIL ($COUNT vulnerabilities)"
  exit 1
fi

echo "SECURITY GATE: PASS"
