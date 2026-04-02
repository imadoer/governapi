#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres governapi > $BACKUP_DIR/database.sql

# Application data backup
docker-compose -f docker-compose.prod.yml exec redis redis-cli --rdb $BACKUP_DIR/redis.rdb

echo "Backup completed: $BACKUP_DIR"
