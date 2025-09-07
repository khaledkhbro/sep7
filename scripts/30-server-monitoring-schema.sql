-- Server Monitoring Database Schema
-- This script creates tables and functions for storing and managing server monitoring data

-- Create server_metrics table to store real-time system metrics
CREATE TABLE IF NOT EXISTS server_metrics (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    server_id VARCHAR(50) DEFAULT 'main-server',
    
    -- CPU Metrics
    cpu_usage_percent DECIMAL(5,2) NOT NULL,
    cpu_cores INTEGER NOT NULL DEFAULT 1,
    cpu_temperature DECIMAL(5,2),
    load_average_1m DECIMAL(5,2),
    load_average_5m DECIMAL(5,2),
    load_average_15m DECIMAL(5,2),
    
    -- Memory Metrics
    memory_total_gb DECIMAL(8,2) NOT NULL,
    memory_used_gb DECIMAL(8,2) NOT NULL,
    memory_free_gb DECIMAL(8,2) NOT NULL,
    memory_usage_percent DECIMAL(5,2) NOT NULL,
    swap_total_gb DECIMAL(8,2) DEFAULT 0,
    swap_used_gb DECIMAL(8,2) DEFAULT 0,
    
    -- Disk Metrics
    disk_total_gb DECIMAL(10,2) NOT NULL,
    disk_used_gb DECIMAL(10,2) NOT NULL,
    disk_free_gb DECIMAL(10,2) NOT NULL,
    disk_usage_percent DECIMAL(5,2) NOT NULL,
    disk_read_iops INTEGER DEFAULT 0,
    disk_write_iops INTEGER DEFAULT 0,
    
    -- Network Metrics
    network_upload_mbps DECIMAL(8,2) DEFAULT 0,
    network_download_mbps DECIMAL(8,2) DEFAULT 0,
    network_packets_sent BIGINT DEFAULT 0,
    network_packets_received BIGINT DEFAULT 0,
    
    -- System Info
    uptime_seconds BIGINT NOT NULL DEFAULT 0,
    process_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create server_status table for tracking service status
CREATE TABLE IF NOT EXISTS server_status (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    server_id VARCHAR(50) DEFAULT 'main-server',
    
    -- Service Status
    database_status VARCHAR(20) DEFAULT 'unknown', -- running, stopped, error
    web_server_status VARCHAR(20) DEFAULT 'unknown',
    application_status VARCHAR(20) DEFAULT 'unknown',
    
    -- Database Metrics
    db_connections_active INTEGER DEFAULT 0,
    db_connections_max INTEGER DEFAULT 100,
    db_size_gb DECIMAL(8,2) DEFAULT 0,
    db_version VARCHAR(50),
    
    -- Application Metrics
    active_users INTEGER DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    error_rate_percent DECIMAL(5,2) DEFAULT 0,
    requests_per_minute INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitoring_alerts table for storing alert configurations and history
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_name VARCHAR(100) NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- cpu, memory, disk, network, service
    threshold_value DECIMAL(8,2) NOT NULL,
    threshold_operator VARCHAR(10) NOT NULL, -- >, <, >=, <=, =
    is_enabled BOOLEAN DEFAULT true,
    
    -- Alert Settings
    severity VARCHAR(20) DEFAULT 'warning', -- info, warning, critical
    notification_email VARCHAR(255),
    notification_webhook VARCHAR(500),
    cooldown_minutes INTEGER DEFAULT 15,
    
    -- Alert History
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create monitoring_notifications table for alert history
CREATE TABLE IF NOT EXISTS monitoring_notifications (
    id BIGSERIAL PRIMARY KEY,
    alert_id BIGINT REFERENCES monitoring_alerts(id) ON DELETE CASCADE,
    server_id VARCHAR(50) DEFAULT 'main-server',
    
    alert_message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    metric_value DECIMAL(8,2),
    threshold_value DECIMAL(8,2),
    
    notification_sent BOOLEAN DEFAULT false,
    notification_method VARCHAR(50), -- email, webhook, dashboard
    
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_server_metrics_timestamp ON server_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_server_metrics_server_id ON server_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_server_status_timestamp ON server_status(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_enabled ON monitoring_alerts(is_enabled) WHERE is_enabled = true;
CREATE INDEX IF NOT EXISTS idx_monitoring_notifications_created ON monitoring_notifications(created_at DESC);

-- Function to get latest server metrics
CREATE OR REPLACE FUNCTION get_latest_server_metrics(p_server_id VARCHAR(50) DEFAULT 'main-server')
RETURNS TABLE (
    cpu_usage DECIMAL(5,2),
    cpu_cores INTEGER,
    cpu_temperature DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    memory_used_gb DECIMAL(8,2),
    memory_total_gb DECIMAL(8,2),
    disk_usage_percent DECIMAL(5,2),
    disk_used_gb DECIMAL(10,2),
    disk_total_gb DECIMAL(10,2),
    network_upload_mbps DECIMAL(8,2),
    network_download_mbps DECIMAL(8,2),
    uptime_seconds BIGINT,
    load_average_1m DECIMAL(5,2),
    load_average_5m DECIMAL(5,2),
    load_average_15m DECIMAL(5,2),
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.cpu_usage_percent,
        sm.cpu_cores,
        sm.cpu_temperature,
        sm.memory_usage_percent,
        sm.memory_used_gb,
        sm.memory_total_gb,
        sm.disk_usage_percent,
        sm.disk_used_gb,
        sm.disk_total_gb,
        sm.network_upload_mbps,
        sm.network_download_mbps,
        sm.uptime_seconds,
        sm.load_average_1m,
        sm.load_average_5m,
        sm.load_average_15m,
        sm.timestamp
    FROM server_metrics sm
    WHERE sm.server_id = p_server_id
    ORDER BY sm.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get historical metrics for charts
CREATE OR REPLACE FUNCTION get_historical_metrics(
    p_server_id VARCHAR(50) DEFAULT 'main-server',
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    timestamp TIMESTAMPTZ,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    network_total DECIMAL(8,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.timestamp,
        sm.cpu_usage_percent,
        sm.memory_usage_percent,
        sm.disk_usage_percent,
        (sm.network_upload_mbps + sm.network_download_mbps) as network_total
    FROM server_metrics sm
    WHERE sm.server_id = p_server_id
        AND sm.timestamp >= NOW() - INTERVAL '1 hour' * p_hours
    ORDER BY sm.timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to get server status
CREATE OR REPLACE FUNCTION get_server_status(p_server_id VARCHAR(50) DEFAULT 'main-server')
RETURNS TABLE (
    database_status VARCHAR(20),
    web_server_status VARCHAR(20),
    application_status VARCHAR(20),
    db_connections_active INTEGER,
    db_connections_max INTEGER,
    db_size_gb DECIMAL(8,2),
    db_version VARCHAR(50),
    active_users INTEGER,
    response_time_ms INTEGER,
    error_rate_percent DECIMAL(5,2),
    requests_per_minute INTEGER,
    last_updated TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.database_status,
        ss.web_server_status,
        ss.application_status,
        ss.db_connections_active,
        ss.db_connections_max,
        ss.db_size_gb,
        ss.db_version,
        ss.active_users,
        ss.response_time_ms,
        ss.error_rate_percent,
        ss.requests_per_minute,
        ss.timestamp
    FROM server_status ss
    WHERE ss.server_id = p_server_id
    ORDER BY ss.timestamp DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to insert server metrics
CREATE OR REPLACE FUNCTION insert_server_metrics(
    p_server_id VARCHAR(50),
    p_cpu_usage DECIMAL(5,2),
    p_cpu_cores INTEGER,
    p_cpu_temp DECIMAL(5,2),
    p_load_1m DECIMAL(5,2),
    p_load_5m DECIMAL(5,2),
    p_load_15m DECIMAL(5,2),
    p_memory_total DECIMAL(8,2),
    p_memory_used DECIMAL(8,2),
    p_memory_free DECIMAL(8,2),
    p_disk_total DECIMAL(10,2),
    p_disk_used DECIMAL(10,2),
    p_disk_free DECIMAL(10,2),
    p_network_up DECIMAL(8,2),
    p_network_down DECIMAL(8,2),
    p_uptime BIGINT,
    p_process_count INTEGER DEFAULT 0
)
RETURNS BIGINT AS $$
DECLARE
    new_id BIGINT;
BEGIN
    INSERT INTO server_metrics (
        server_id, cpu_usage_percent, cpu_cores, cpu_temperature,
        load_average_1m, load_average_5m, load_average_15m,
        memory_total_gb, memory_used_gb, memory_free_gb,
        memory_usage_percent,
        disk_total_gb, disk_used_gb, disk_free_gb,
        disk_usage_percent,
        network_upload_mbps, network_download_mbps,
        uptime_seconds, process_count
    ) VALUES (
        p_server_id, p_cpu_usage, p_cpu_cores, p_cpu_temp,
        p_load_1m, p_load_5m, p_load_15m,
        p_memory_total, p_memory_used, p_memory_free,
        ROUND((p_memory_used / p_memory_total) * 100, 2),
        p_disk_total, p_disk_used, p_disk_free,
        ROUND((p_disk_used / p_disk_total) * 100, 2),
        p_network_up, p_network_down,
        p_uptime, p_process_count
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check alerts and create notifications
CREATE OR REPLACE FUNCTION check_monitoring_alerts(p_server_id VARCHAR(50) DEFAULT 'main-server')
RETURNS INTEGER AS $$
DECLARE
    alert_record RECORD;
    metric_value DECIMAL(8,2);
    alert_triggered BOOLEAN;
    notifications_created INTEGER := 0;
BEGIN
    -- Get latest metrics
    FOR alert_record IN 
        SELECT * FROM monitoring_alerts 
        WHERE is_enabled = true
    LOOP
        alert_triggered := false;
        
        -- Get the current metric value based on alert type
        CASE alert_record.alert_type
            WHEN 'cpu' THEN
                SELECT cpu_usage_percent INTO metric_value 
                FROM server_metrics 
                WHERE server_id = p_server_id 
                ORDER BY timestamp DESC LIMIT 1;
                
            WHEN 'memory' THEN
                SELECT memory_usage_percent INTO metric_value 
                FROM server_metrics 
                WHERE server_id = p_server_id 
                ORDER BY timestamp DESC LIMIT 1;
                
            WHEN 'disk' THEN
                SELECT disk_usage_percent INTO metric_value 
                FROM server_metrics 
                WHERE server_id = p_server_id 
                ORDER BY timestamp DESC LIMIT 1;
                
            ELSE
                CONTINUE;
        END CASE;
        
        -- Check if alert should be triggered
        CASE alert_record.threshold_operator
            WHEN '>' THEN
                alert_triggered := metric_value > alert_record.threshold_value;
            WHEN '>=' THEN
                alert_triggered := metric_value >= alert_record.threshold_value;
            WHEN '<' THEN
                alert_triggered := metric_value < alert_record.threshold_value;
            WHEN '<=' THEN
                alert_triggered := metric_value <= alert_record.threshold_value;
            WHEN '=' THEN
                alert_triggered := metric_value = alert_record.threshold_value;
        END CASE;
        
        -- Create notification if alert is triggered and cooldown period has passed
        IF alert_triggered AND (
            alert_record.last_triggered_at IS NULL OR 
            alert_record.last_triggered_at < NOW() - INTERVAL '1 minute' * alert_record.cooldown_minutes
        ) THEN
            INSERT INTO monitoring_notifications (
                alert_id, server_id, alert_message, severity,
                metric_value, threshold_value
            ) VALUES (
                alert_record.id, p_server_id,
                format('%s alert: %s is %s%% (threshold: %s%%)', 
                    alert_record.severity, alert_record.alert_name, 
                    metric_value, alert_record.threshold_value),
                alert_record.severity,
                metric_value, alert_record.threshold_value
            );
            
            -- Update alert record
            UPDATE monitoring_alerts 
            SET last_triggered_at = NOW(), trigger_count = trigger_count + 1
            WHERE id = alert_record.id;
            
            notifications_created := notifications_created + 1;
        END IF;
    END LOOP;
    
    RETURN notifications_created;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data(p_days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete old server metrics (keep only last 30 days by default)
    DELETE FROM server_metrics 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old server status records
    DELETE FROM server_status 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days_to_keep;
    
    -- Delete resolved notifications older than 7 days
    DELETE FROM monitoring_notifications 
    WHERE resolved_at IS NOT NULL 
        AND resolved_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert default monitoring alerts
INSERT INTO monitoring_alerts (alert_name, alert_type, threshold_value, threshold_operator, severity, is_enabled) VALUES
('High CPU Usage', 'cpu', 80.00, '>=', 'warning', true),
('Critical CPU Usage', 'cpu', 95.00, '>=', 'critical', true),
('High Memory Usage', 'memory', 85.00, '>=', 'warning', true),
('Critical Memory Usage', 'memory', 95.00, '>=', 'critical', true),
('High Disk Usage', 'disk', 80.00, '>=', 'warning', true),
('Critical Disk Usage', 'disk', 90.00, '>=', 'critical', true)
ON CONFLICT DO NOTHING;

-- Create a view for monitoring dashboard
CREATE OR REPLACE VIEW monitoring_dashboard AS
SELECT 
    sm.timestamp,
    sm.server_id,
    sm.cpu_usage_percent,
    sm.memory_usage_percent,
    sm.disk_usage_percent,
    sm.network_upload_mbps + sm.network_download_mbps as total_network_mbps,
    sm.uptime_seconds,
    ss.database_status,
    ss.application_status,
    ss.active_users,
    ss.response_time_ms,
    (SELECT COUNT(*) FROM monitoring_notifications mn 
     WHERE mn.created_at >= NOW() - INTERVAL '24 hours' 
     AND mn.resolved_at IS NULL) as active_alerts
FROM server_metrics sm
LEFT JOIN server_status ss ON ss.server_id = sm.server_id 
    AND ss.timestamp >= sm.timestamp - INTERVAL '5 minutes'
    AND ss.timestamp <= sm.timestamp + INTERVAL '5 minutes'
WHERE sm.timestamp = (
    SELECT MAX(timestamp) FROM server_metrics sm2 WHERE sm2.server_id = sm.server_id
);

COMMENT ON TABLE server_metrics IS 'Stores real-time server performance metrics including CPU, memory, disk, and network usage';
COMMENT ON TABLE server_status IS 'Tracks the status of various services and applications running on the server';
COMMENT ON TABLE monitoring_alerts IS 'Configuration for automated monitoring alerts and thresholds';
COMMENT ON TABLE monitoring_notifications IS 'History of triggered alerts and notifications';
