#!/bin/bash

# System monitoring
echo "=== System Status ==="
docker-compose -f docker-compose.prod.yml ps

echo "=== Resource Usage ==="
docker stats --no-stream

echo "=== Database Status ==="
docker-compose -f docker-compose.prod.yml exec postgres pg_stat_activity -c "SELECT count(*) as connections FROM pg_stat_activity;"

echo "=== Recent Logs ==="
docker-compose -f docker-compose.prod.yml logs --tail=50 web1

echo "=== Health Check ==="
curl -s http://localhost/health
