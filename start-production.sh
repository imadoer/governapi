#!/bin/bash
set -e

echo "Starting GovernAPI in production mode..."

# Build the application
echo "Building application..."
pnpm build

# Start with PM2
echo "Starting with PM2..."
pm2 start ecosystem.config.js --env production

# Set up log rotation
pm2 install pm2-logrotate

echo "Production deployment complete!"
echo "Monitor: pm2 monit"
echo "Logs: pm2 logs"
echo "Status: pm2 status"
