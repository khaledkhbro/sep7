#!/bin/bash

# Setup script for VPS monitoring system
# This script sets up the cron job to collect system metrics every minute

echo "Setting up VPS monitoring system..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Make the metrics collection script executable
chmod +x "$SCRIPT_DIR/collect-system-metrics.js"

# Create a wrapper script for cron
cat > "$SCRIPT_DIR/run-metrics-collector.sh" << EOF
#!/bin/bash
cd "$PROJECT_DIR"
/usr/bin/node "$SCRIPT_DIR/collect-system-metrics.js" >> /var/log/vps-monitoring.log 2>&1
EOF

chmod +x "$SCRIPT_DIR/run-metrics-collector.sh"

# Add cron job (runs every minute)
CRON_JOB="* * * * * $SCRIPT_DIR/run-metrics-collector.sh"

# Check if cron job already exists
if ! crontab -l 2>/dev/null | grep -q "run-metrics-collector.sh"; then
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added successfully"
else
    echo "ℹ️  Cron job already exists"
fi

# Create log file
sudo touch /var/log/vps-monitoring.log
sudo chmod 666 /var/log/vps-monitoring.log

echo "✅ VPS monitoring setup complete!"
echo ""
echo "The system will now collect metrics every minute and send them to your monitoring dashboard."
echo "Log file: /var/log/vps-monitoring.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove the monitoring cron job: crontab -e (then delete the line)"
echo "To test the collector manually: node $SCRIPT_DIR/collect-system-metrics.js"
