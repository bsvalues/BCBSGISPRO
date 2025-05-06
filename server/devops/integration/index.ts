/**
 * External System Integration
 * 
 * This module provides integration with external tools and services
 * for alerting, logging, and other operational functions.
 */

import { Request, Response } from 'express';
import { logger } from '../../logger';
import { getMetricsSnapshot } from '../monitoring';
import { getErrors } from '../error-tracking';
import { getDeploymentInfo } from '../deployment';

/**
 * Supported alerting integrations
 */
export enum AlertIntegration {
  SLACK = 'slack',
  PAGERDUTY = 'pagerduty',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  integration: AlertIntegration;
  endpoint: string;
  apiKey?: string;
  channel?: string;
  enabled: boolean;
}

/**
 * Alert payload
 */
export interface AlertPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  timestamp: Date;
  details?: any;
}

// Global configuration
const alertConfigs: Record<string, AlertConfig> = {};

/**
 * Register an alert integration
 */
export function registerAlertIntegration(id: string, config: AlertConfig) {
  alertConfigs[id] = config;
  logger.info(`Registered alert integration: ${id} (${config.integration})`);
}

/**
 * Send an alert through all enabled integrations
 */
export async function sendAlert(payload: AlertPayload): Promise<boolean> {
  let success = true;
  
  for (const [id, config] of Object.entries(alertConfigs)) {
    if (!config.enabled) continue;
    
    try {
      await sendAlertToIntegration(config, payload);
      logger.info(`Sent ${payload.severity} alert to ${id} (${config.integration})`);
    } catch (error) {
      success = false;
      logger.error(`Failed to send alert to ${id} (${config.integration}):`, error);
    }
  }
  
  return success;
}

/**
 * Send an alert to a specific integration
 */
async function sendAlertToIntegration(config: AlertConfig, payload: AlertPayload): Promise<void> {
  switch (config.integration) {
    case AlertIntegration.SLACK:
      await sendSlackAlert(config, payload);
      break;
    case AlertIntegration.PAGERDUTY:
      await sendPagerDutyAlert(config, payload);
      break;
    case AlertIntegration.EMAIL:
      await sendEmailAlert(config, payload);
      break;
    case AlertIntegration.WEBHOOK:
      await sendWebhookAlert(config, payload);
      break;
    default:
      throw new Error(`Unsupported alert integration: ${config.integration}`);
  }
}

/**
 * Send a Slack alert
 */
async function sendSlackAlert(config: AlertConfig, payload: AlertPayload): Promise<void> {
  if (!config.endpoint) {
    throw new Error('Slack webhook URL is required');
  }
  
  // Format message for Slack
  const color = getSlackColor(payload.severity);
  const deploymentInfo = await getDeploymentInfo();
  
  const slackPayload = {
    channel: config.channel,
    attachments: [
      {
        color,
        title: payload.title,
        text: payload.message,
        fields: [
          {
            title: 'Severity',
            value: payload.severity,
            short: true
          },
          {
            title: 'Source',
            value: payload.source,
            short: true
          },
          {
            title: 'Time',
            value: payload.timestamp.toISOString(),
            short: true
          },
          {
            title: 'Environment',
            value: process.env.NODE_ENV || 'development',
            short: true
          },
          {
            title: 'Version',
            value: deploymentInfo.version,
            short: true
          }
        ],
        footer: 'BentonGeoPro DevOps',
        ts: Math.floor(payload.timestamp.getTime() / 1000)
      }
    ]
  };
  
  // Add details if provided
  if (payload.details) {
    slackPayload.attachments[0].fields.push({
      title: 'Details',
      value: '```' + JSON.stringify(payload.details, null, 2) + '```',
      short: false
    });
  }
  
  // Send to Slack
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(slackPayload)
  });
  
  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status} ${await response.text()}`);
  }
}

/**
 * Send a PagerDuty alert
 */
async function sendPagerDutyAlert(config: AlertConfig, payload: AlertPayload): Promise<void> {
  if (!config.apiKey) {
    throw new Error('PagerDuty API key is required');
  }
  
  // Format message for PagerDuty
  const severity = getPagerDutySeverity(payload.severity);
  const deploymentInfo = await getDeploymentInfo();
  
  const pdPayload = {
    routing_key: config.apiKey,
    event_action: 'trigger',
    payload: {
      summary: payload.title,
      severity,
      source: payload.source,
      component: 'BentonGeoPro',
      group: 'DevOps',
      class: payload.source,
      custom_details: {
        ...payload.details,
        message: payload.message,
        environment: process.env.NODE_ENV || 'development',
        version: deploymentInfo.version
      }
    }
  };
  
  // Send to PagerDuty
  const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(pdPayload)
  });
  
  if (!response.ok) {
    throw new Error(`PagerDuty API error: ${response.status} ${await response.text()}`);
  }
}

/**
 * Send an email alert
 */
async function sendEmailAlert(config: AlertConfig, payload: AlertPayload): Promise<void> {
  // This would normally use a mail service like SendGrid, Mailgun, etc.
  // For now, we'll just log it
  logger.info(`Would send email alert to ${config.endpoint}:`, {
    subject: `[${payload.severity.toUpperCase()}] ${payload.title}`,
    body: payload.message,
    details: payload.details
  });
}

/**
 * Send a webhook alert
 */
async function sendWebhookAlert(config: AlertConfig, payload: AlertPayload): Promise<void> {
  if (!config.endpoint) {
    throw new Error('Webhook URL is required');
  }
  
  // Format message for webhook
  const deploymentInfo = await getDeploymentInfo();
  
  const webhookPayload = {
    severity: payload.severity,
    title: payload.title,
    message: payload.message,
    source: payload.source,
    timestamp: payload.timestamp.toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: deploymentInfo.version,
    details: payload.details
  };
  
  // Send to webhook
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(webhookPayload)
  });
  
  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status} ${await response.text()}`);
  }
}

/**
 * Map alert severity to Slack color
 */
function getSlackColor(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.INFO:
      return '#2196F3';
    case AlertSeverity.WARNING:
      return '#FF9800';
    case AlertSeverity.ERROR:
      return '#F44336';
    case AlertSeverity.CRITICAL:
      return '#9C27B0';
    default:
      return '#9E9E9E';
  }
}

/**
 * Map alert severity to PagerDuty severity
 */
function getPagerDutySeverity(severity: AlertSeverity): string {
  switch (severity) {
    case AlertSeverity.INFO:
      return 'info';
    case AlertSeverity.WARNING:
      return 'warning';
    case AlertSeverity.ERROR:
      return 'error';
    case AlertSeverity.CRITICAL:
      return 'critical';
    default:
      return 'warning';
  }
}

/**
 * Initialize default alerts for the system
 */
export function initializeDefaultAlerts() {
  // Check for configured integrations from environment
  if (process.env.SLACK_WEBHOOK_URL) {
    registerAlertIntegration('slack-main', {
      integration: AlertIntegration.SLACK,
      endpoint: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_CHANNEL || '#alerts',
      enabled: true
    });
  }
  
  if (process.env.PAGERDUTY_API_KEY) {
    registerAlertIntegration('pagerduty-oncall', {
      integration: AlertIntegration.PAGERDUTY,
      endpoint: 'https://events.pagerduty.com/v2/enqueue',
      apiKey: process.env.PAGERDUTY_API_KEY,
      enabled: true
    });
  }
  
  if (process.env.WEBHOOK_URL) {
    registerAlertIntegration('custom-webhook', {
      integration: AlertIntegration.WEBHOOK,
      endpoint: process.env.WEBHOOK_URL,
      enabled: true
    });
  }
  
  logger.info(`Initialized default alerts with ${Object.keys(alertConfigs).length} integrations`);
}

/**
 * Register integration routes
 * 
 * @param app Express application
 */
export function registerIntegrationRoutes(app: any) {
  // Get all alert integrations
  app.get('/api/integrations/alerts', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Hide sensitive details like API keys
      const sanitizedConfigs = Object.entries(alertConfigs).map(([id, config]) => ({
        id,
        integration: config.integration,
        endpoint: config.endpoint,
        channel: config.channel,
        enabled: config.enabled,
        hasApiKey: !!config.apiKey
      }));
      
      return res.json({ integrations: sanitizedConfigs });
    } catch (error) {
      console.error('Error retrieving alert integrations:', error);
      return res.status(500).json({ error: 'Failed to retrieve alert integrations' });
    }
  });
  
  // Update an alert integration
  app.patch('/api/integrations/alerts/:id', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const id = req.params.id;
      
      if (!alertConfigs[id]) {
        return res.status(404).json({ error: 'Alert integration not found' });
      }
      
      // Update allowed properties
      const allowedProps = ['endpoint', 'channel', 'enabled'];
      allowedProps.forEach(prop => {
        if (req.body[prop] !== undefined) {
          alertConfigs[id][prop] = req.body[prop];
        }
      });
      
      // Handle API key separately to not return it
      if (req.body.apiKey) {
        alertConfigs[id].apiKey = req.body.apiKey;
      }
      
      // Return updated config without sensitive info
      const sanitizedConfig = {
        id,
        integration: alertConfigs[id].integration,
        endpoint: alertConfigs[id].endpoint,
        channel: alertConfigs[id].channel,
        enabled: alertConfigs[id].enabled,
        hasApiKey: !!alertConfigs[id].apiKey
      };
      
      return res.json({ integration: sanitizedConfig });
    } catch (error) {
      console.error('Error updating alert integration:', error);
      return res.status(500).json({ error: 'Failed to update alert integration' });
    }
  });
  
  // Test an alert integration
  app.post('/api/integrations/alerts/:id/test', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const id = req.params.id;
      
      if (!alertConfigs[id]) {
        return res.status(404).json({ error: 'Alert integration not found' });
      }
      
      // Send test alert
      const testPayload: AlertPayload = {
        severity: AlertSeverity.INFO,
        title: 'Test Alert',
        message: 'This is a test alert from BentonGeoPro DevOps.',
        source: 'DevOps-Integration-Test',
        timestamp: new Date(),
        details: {
          test: true,
          triggered_by: req.user ? (req.user as any).username : 'system'
        }
      };
      
      try {
        await sendAlertToIntegration(alertConfigs[id], testPayload);
        return res.json({ success: true, message: 'Test alert sent successfully' });
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send test alert',
          error: error.toString()
        });
      }
    } catch (error) {
      console.error('Error testing alert integration:', error);
      return res.status(500).json({ error: 'Failed to test alert integration' });
    }
  });
  
  // Send a system health summary alert
  app.post('/api/integrations/alerts/system-summary', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      // Gather system information
      const metrics = await getMetricsSnapshot();
      const errorsData = await getErrors({ limit: 5, resolved: false });
      const errors = errorsData.errors;
      const deploymentInfo = await getDeploymentInfo();
      
      // Determine severity based on metrics
      const hasCriticalErrors = errors.some(e => e.count > 10);
      const hasHighCpuUsage = metrics.system.cpuLoad > 80;
      const hasHighMemUsage = metrics.system.memoryUsage.percentUsed > 80;
      
      let severity = AlertSeverity.INFO;
      if (hasCriticalErrors) {
        severity = AlertSeverity.ERROR;
      } else if (hasHighCpuUsage || hasHighMemUsage) {
        severity = AlertSeverity.WARNING;
      }
      
      // Create summary
      const summary: AlertPayload = {
        severity,
        title: 'System Health Summary',
        message: `BentonGeoPro system health report for ${deploymentInfo.version} on ${process.env.NODE_ENV || 'development'}`,
        source: 'DevOps-System-Monitor',
        timestamp: new Date(),
        details: {
          resources: {
            cpu: `${metrics.system.cpuLoad}%`,
            memory: `${metrics.system.memoryUsage.percentUsed}%`,
            database: metrics.database.connected ? 'Connected' : 'Disconnected'
          },
          errors: errors.map(e => `${e.type}: ${e.count} occurrences`),
          endpointPerformance: Object.entries(metrics.responseTimes.byEndpoint)
            .map(([endpoint, avgTime]) => `${endpoint}: ${avgTime}ms (${metrics.requests.byEndpoint[endpoint] || 0} requests)`)
            .slice(0, 5)
        }
      };
      
      // Send to all enabled integrations
      const success = await sendAlert(summary);
      
      return res.json({
        success,
        message: success ? 'System summary alert sent successfully' : 'Failed to send to some integrations'
      });
    } catch (error) {
      console.error('Error sending system summary alert:', error);
      return res.status(500).json({ error: 'Failed to send system summary alert' });
    }
  });
}