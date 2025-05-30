import { Router } from 'express';
import { auditLogger } from '../services/audit-logger';
import { isAuthenticated } from '../auth';

const router = Router();

/**
 * Get all audit logs
 * 
 * Requires admin permissions
 * Can be filtered by user, action, and date range
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Check if user has admin role
    const user = req.user as any;
    if (!user?.claims?.roles?.includes('admin')) {
      return res.status(403).json({ message: 'Forbidden: Requires admin permissions' });
    }

    // Get query parameters for filtering
    const { limit = '100', userId } = req.query;
    const parsedLimit = parseInt(limit as string, 10);

    // Get logs based on filters
    let logs;
    if (userId) {
      logs = await auditLogger.getUserLogs(userId as string, parsedLimit);
    } else {
      logs = await auditLogger.getRecentLogs(parsedLimit);
    }

    return res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

/**
 * Get audit logs for the current user
 * 
 * Authenticated users can view their own logs
 */
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = req.user as any;
    const userId = user.claims.sub;

    const logs = await auditLogger.getUserLogs(userId, 20);
    return res.json(logs);
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    return res.status(500).json({ message: 'Failed to fetch audit logs' });
  }
});

export default router;