#!/bin/bash
# Runs once, on first initialisation of the InfluxDB volume.
#
# Raw sim-telemetry ticks live in ONE bucket (`telemetry`, created by
# DOCKER_INFLUXDB_INIT_BUCKET). Plan gating happens at read time via
# Domain/Telemetry/ChannelRegistry.cs, not by partitioning storage. This script
# only exists so that an operator overriding INFLUXDB_BUCKET still gets the
# bucket the API expects, and to document the legacy layout.
#
# Legacy: before September 2026 ticks were split across telemetry_basic /
# telemetry_pro / telemetry_elite. InfluxTickRepository still reads those as a
# fallback (InfluxDB:LegacyBuckets) so old sessions stay visible and can be
# reprocessed into Postgres lap records. They are NOT created on fresh volumes.
set -euo pipefail

ORG="${DOCKER_INFLUXDB_INIT_ORG}"
TOKEN="${DOCKER_INFLUXDB_INIT_ADMIN_TOKEN}"
BUCKET="${INFLUXDB_BUCKET:-telemetry}"

# Raw ticks are an archive: processed laps are persisted in Postgres by the
# lap processor, so a bounded retention here does not lose analysis data.
# 0 = unlimited; set INFLUXDB_RETENTION (e.g. 2160h = 90 days) once the
# backfill of pre-existing sessions has run.
RETENTION="${INFLUXDB_RETENTION:-0}"

if influx bucket list --org "$ORG" --token "$TOKEN" --name "$BUCKET" >/dev/null 2>&1; then
  echo "Bucket $BUCKET already exists, skipping."
else
  echo "Creating bucket $BUCKET (retention $RETENTION)..."
  influx bucket create --org "$ORG" --token "$TOKEN" --name "$BUCKET" --retention "$RETENTION"
fi
