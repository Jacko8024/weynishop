# =============================================================================
# WeyniShop dev tunnel: reach the VPS Coolify Postgres from this machine.
#
# The Coolify DB hostname (q5jowusbarxvfnzgsjgtqxqg) only resolves inside the
# VPS Docker network, so local dev needs this SSH tunnel:
#
#   1. Run this script:        powershell -File dev-tunnel.ps1
#      (enter the VPS root password when prompted; keep the window open)
#   2. In .env use:
#        DATABASE_URL=postgresql://postgres:<coolify-db-password>@localhost:15432/postgres
#        DB_SSL=false
# =============================================================================
$VPS_USER = 'root'
$VPS_HOST = '169.58.219.232'
$DB_HOST  = 'q5jowusbarxvfnzgsjgtqxqg'   # Coolify Postgres container hostname
$DB_PORT  = 5432
$LOCAL_PORT = 15432

Write-Output "Opening tunnel localhost:${LOCAL_PORT} -> ${DB_HOST}:${DB_PORT} via ${VPS_USER}@${VPS_HOST}"
Write-Output "Keep this window open while developing against the VPS database."
ssh -N -L "${LOCAL_PORT}:${DB_HOST}:${DB_PORT}" "${VPS_USER}@${VPS_HOST}"
