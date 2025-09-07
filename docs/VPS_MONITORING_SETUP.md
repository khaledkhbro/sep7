# VPS Monitoring System Setup Guide

## Overview

This VPS monitoring system provides real-time tracking of your server's CPU, RAM, disk usage, and network traffic with a professional dashboard interface.

## Features

✅ **Real-time Metrics**: CPU, Memory, Disk, Network monitoring
✅ **Historical Charts**: 24-hour usage trends and patterns  
✅ **Alert System**: Configurable thresholds with notifications
✅ **Service Status**: Database and application health monitoring
✅ **Auto-refresh**: Updates every 30 seconds
✅ **Professional UI**: Clean, responsive dashboard interface

## Quick Setup

### 1. Database Setup
Run the monitoring schema script:
\`\`\`bash
# The database tables are created automatically when you run the SQL scripts
# Make sure your Supabase/Neon integration is connected
\`\`\`

### 2. Install System Monitoring
\`\`\`bash
# Make the setup script executable
chmod +x scripts/setup-monitoring-cron.sh

# Run the setup script
./scripts/setup-monitoring-cron.sh
\`\`\`

### 3. Environment Variables
Add these to your Vercel project settings:
\`\`\`env
NEXT_PUBLIC_API_URL=https://your-domain.com
SERVER_ID=main-server
\`\`\`

### 4. Test the System
\`\`\`bash
# Test metrics collection manually
node scripts/collect-system-metrics.js

# Check if cron job is running
crontab -l

# View monitoring logs
tail -f /var/log/vps-monitoring.log
\`\`\`

## How It Works

### Metrics Collection
- **Node.js Script**: `collect-system-metrics.js` gathers real system data
- **Cron Job**: Runs every minute to collect and post metrics
- **API Integration**: Posts data to `/api/monitoring/metrics` endpoint

### Data Storage
- **PostgreSQL**: Stores metrics in `server_metrics` table
- **Historical Data**: Keeps 30 days of metrics history
- **Alert System**: Monitors thresholds and creates notifications

### Dashboard
- **Real-time Display**: Shows current CPU, RAM, disk, network usage
- **Status Indicators**: Health badges (Healthy/Warning/Critical)
- **Charts**: Historical trends with interactive tooltips
- **Auto-refresh**: Updates every 30 seconds

## Monitoring Metrics

### CPU Monitoring
- Usage percentage across all cores
- Core count and temperature (Linux)
- Load averages (1m, 5m, 15m)

### Memory Monitoring  
- Total, used, and free RAM in GB
- Usage percentage with visual progress bars
- Swap usage (when available)

### Disk Monitoring
- Total, used, and free disk space
- Usage percentage with alerts
- Read/write IOPS (when available)

### Network Monitoring
- Upload and download speeds in MB/s
- Packet counts and network interface stats
- Real-time traffic monitoring

## Alert Configuration

Default alerts are pre-configured:
- **CPU**: Warning at 80%, Critical at 95%
- **Memory**: Warning at 85%, Critical at 95%  
- **Disk**: Warning at 80%, Critical at 90%

### Customizing Alerts
Access the database to modify alert thresholds:
\`\`\`sql
UPDATE monitoring_alerts 
SET threshold_value = 70.00 
WHERE alert_name = 'High CPU Usage';
\`\`\`

## Troubleshooting

### Common Issues

**1. No metrics showing**
- Check if cron job is running: `crontab -l`
- Test manual collection: `node scripts/collect-system-metrics.js`
- Check logs: `tail -f /var/log/vps-monitoring.log`

**2. Permission errors**
- Ensure script is executable: `chmod +x scripts/collect-system-metrics.js`
- Check log file permissions: `sudo chmod 666 /var/log/vps-monitoring.log`

**3. API connection errors**
- Verify `NEXT_PUBLIC_API_URL` environment variable
- Check if your Next.js app is running
- Test API endpoint: `curl http://localhost:3000/api/monitoring/metrics`

**4. Database connection issues**
- Verify Supabase/Neon integration is connected
- Check `DATABASE_URL` environment variable
- Run database schema scripts

### Log Files
- **Monitoring Logs**: `/var/log/vps-monitoring.log`
- **Cron Logs**: `/var/log/cron.log` (system dependent)
- **Application Logs**: Check your Next.js application logs

## Performance Impact

The monitoring system is designed to be lightweight:
- **CPU Usage**: <1% additional load
- **Memory**: ~10MB for Node.js process
- **Disk**: Minimal I/O for metrics collection
- **Network**: <1KB per minute for API calls

## Security Considerations

- Metrics are collected locally and posted to your own API
- No external services or third-party data sharing
- Database access uses your existing authentication
- Cron job runs with user permissions (not root)

## Advanced Configuration

### Custom Server ID
Set a custom server identifier:
\`\`\`env
SERVER_ID=production-server-1
\`\`\`

### Monitoring Multiple Servers
Deploy the collection script on multiple servers with different `SERVER_ID` values to monitor multiple VPS instances from one dashboard.

### Custom Refresh Intervals
Modify the cron job frequency:
\`\`\`bash
# Every 30 seconds (not recommended for production)
* * * * * /path/to/run-metrics-collector.sh
* * * * * sleep 30; /path/to/run-metrics-collector.sh

# Every 5 minutes (lighter load)
*/5 * * * * /path/to/run-metrics-collector.sh
\`\`\`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review log files for error messages
3. Test individual components (database, API, collection script)
4. Verify all environment variables are set correctly

The monitoring system provides comprehensive VPS monitoring with minimal setup and maintenance required.
