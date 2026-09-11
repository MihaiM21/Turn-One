#!/bin/bash
# Runs once, on first initialisation of the InfluxDB volume.
#
# InfluxTickRepository partitions telemetry ticks across one bucket per plan
# tier (see the `planType switch` in Infrastructure/Services/InfluxTickRepository.cs).
# The image's DOCKER_INFLUXDB_INIT_BUCKET only creates the first of them, so the
# other two are created here. Without all three, writes and every chart/lap/
# analytics query for that tier fail silently — the repository catches Influx
# errors and returns empty lists.
set -euo pipefail

ORG="${DOCKER_INFLUXDB_INIT_ORG}"
TOKEN="${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN}"

# Retention is left unlimited (0) deliberately. Per-tier retention windows are a
# product decision — set them here once that policy exists, rather than letting a
# default quietly delete users' sessions.
for bucket in telemetry_basic telemetry_pro telemetry_elite; do
  if influx bucket list --org "$ORG" --token "$TOKEN" --name "$bucket" >/dev/null 2>&1; then
    echo "Bucket $bucket already exists, skipping."
  else
    echo "Creating bucket $bucket..."
    influx bucket create --org "$ORG" --token "$TOKEN" --name "$bucket" --retention 0
  fi
done
