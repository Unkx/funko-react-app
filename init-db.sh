#!/bin/bash
set -e

echo "Waiting for PostgreSQL to start..."
until pg_isready -U postgres; do
  sleep 1
done

echo "Creating database Web_AppDB..."
psql -U postgres -c "CREATE DATABASE Web_AppDB;" 2>/dev/null || echo "Database already exists"

echo "Restoring binary dump..."
if [ -f /docker-entrypoint-initdb.d/Web_AppDB.sql ]; then
  echo "Attempting to restore binary dump with pg_restore..."
  # First, drop and recreate the database to ensure clean slate
  psql -U postgres -c "DROP DATABASE IF EXISTS Web_AppDB;" 2>/dev/null || true
  psql -U postgres -c "CREATE DATABASE Web_AppDB;"
  
  # Try to restore
  if pg_restore -U postgres -d Web_AppDB -v /docker-entrypoint-initdb.d/Web_AppDB.sql; then
    echo "✅ Binary dump restored successfully"
  else
    echo "❌ pg_restore failed, check if file is valid PostgreSQL binary dump"
  fi
else
  echo "❌ No SQL file found at /docker-entrypoint-initdb.d/Web_AppDB.sql"
fi

echo "Database initialization complete"
