#!/bin/bash
set -e

echo "Starting enterprise deployment..."

# Load environment
source .env.production

# Build and start services
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo "Waiting for services to start..."
sleep 30

# Health checks
echo "Running health checks..."
curl -f http://localhost/health || exit 1

# Database migration
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d governapi -f /docker-entrypoint-initdb.d/init.sql

echo "Deployment complete!"
echo "Dashboard: http://$(curl -s ifconfig.me)"
echo "Status: docker-compose -f docker-compose.prod.yml ps"
