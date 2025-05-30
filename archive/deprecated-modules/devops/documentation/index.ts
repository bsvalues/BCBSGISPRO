/**
 * Enhanced Documentation System
 * 
 * This module provides documentation generation and management tools
 * for the BentonGeoPro system, including developer guides, API docs,
 * and user documentation.
 */

import { Request, Response } from 'express';
import { logger } from '../../logger';
import { getDeploymentInfo } from '../deployment';
import { db } from '../../db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const DOCS_DIR = process.env.DOCS_DIR || './docs';
const API_DOCS_PATH = path.join(DOCS_DIR, 'api');
const DEV_GUIDES_PATH = path.join(DOCS_DIR, 'developer');
const USER_GUIDES_PATH = path.join(DOCS_DIR, 'user');

/**
 * Document types
 */
export enum DocumentationType {
  API = 'api',
  DEVELOPER = 'developer',
  USER = 'user',
  SYSTEM = 'system',
}

/**
 * Document access levels
 */
export enum DocumentationAccessLevel {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  DEVELOPER = 'developer',
  ADMIN = 'admin',
}

/**
 * Document metadata
 */
export interface DocumentationMeta {
  id: string;
  title: string;
  type: DocumentationType;
  accessLevel: DocumentationAccessLevel;
  path: string;
  lastUpdated: Date;
  version: string;
  author?: string;
  tags: string[];
}

/**
 * Initialize the documentation system
 */
export async function initializeDocumentation() {
  try {
    // Create documentation directories if they don't exist
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(API_DOCS_PATH)) {
      fs.mkdirSync(API_DOCS_PATH, { recursive: true });
    }
    
    if (!fs.existsSync(DEV_GUIDES_PATH)) {
      fs.mkdirSync(DEV_GUIDES_PATH, { recursive: true });
    }
    
    if (!fs.existsSync(USER_GUIDES_PATH)) {
      fs.mkdirSync(USER_GUIDES_PATH, { recursive: true });
    }
    
    // Create documentation schema in database if not exists
    await createDocumentationSchema();
    
    // Generate standard documentation
    await generateDeveloperGuides();
    
    logger.info('Documentation system initialized');
  } catch (error) {
    logger.error('Failed to initialize documentation system:', error);
  }
}

/**
 * Create database schema for documentation
 */
async function createDocumentationSchema() {
  try {
    // Check if table exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'documentation_meta'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      // Create metadata table
      await db.execute(sql`
        CREATE TABLE documentation_meta (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          access_level TEXT NOT NULL,
          path TEXT NOT NULL,
          last_updated TIMESTAMP NOT NULL,
          version TEXT NOT NULL,
          author TEXT,
          tags TEXT[]
        );
      `);
      
      logger.info('Created documentation metadata table');
    }
  } catch (error) {
    logger.error('Failed to create documentation schema:', error);
    throw error;
  }
}

/**
 * Generate standard developer guides
 */
async function generateDeveloperGuides() {
  // Generate UX metrics guide
  const uxMetricsGuide = {
    id: 'dev-guide-ux-metrics',
    title: 'UX Metrics Integration Guide',
    type: DocumentationType.DEVELOPER,
    accessLevel: DocumentationAccessLevel.DEVELOPER,
    path: path.join(DEV_GUIDES_PATH, 'ux-metrics-guide.md'),
    lastUpdated: new Date(),
    version: (await getDeploymentInfo()).version,
    author: 'BentonGeoPro DevOps',
    tags: ['ux', 'metrics', 'developer', 'integration']
  };
  
  const uxMetricsContent = `# UX Metrics Integration Guide

## Overview

The BentonGeoPro UX Metrics system allows you to track how users interact with your components and features.
This guide shows how to properly instrument your code to collect valuable UX data.

## Getting Started

Import the tracking functions:

\`\`\`typescript
import { trackUxEvent, UxEventType, InteractionType } from '../server/devops';
\`\`\`

In React components, use the \`useUxMetrics\` hook:

\`\`\`typescript
import { useUxMetrics } from '../hooks/use-ux-metrics';

function MyComponent() {
  const { trackInteraction, trackFeatureUse } = useUxMetrics();
  
  return (
    <button onClick={() => trackInteraction(InteractionType.CLICK, 'myButton')}>
      Click Me
    </button>
  );
}
\`\`\`

## Best Practices

1. Track all significant user interactions
2. Measure component performance for complex rendering
3. Track workflow completion and abandonment
4. Include relevant context with each event

## Available Tracking Functions

- \`trackInteraction\`: For UI interactions like clicks and hovers
- \`trackFeatureUse\`: When users utilize specific features
- \`trackWorkflow\`: For multi-step processes
- \`trackError\`: When users encounter errors
- \`trackComponentPerformance\`: For measuring render times

## Metadata Guidelines

When adding details, include only relevant information. Do not include personally identifiable information or sensitive data.

## Examples

### Track a Map Interaction

\`\`\`typescript
trackInteraction(InteractionType.DRAG, 'mapView', {
  startPosition: { x: 100, y: 200 },
  endPosition: { x: 150, y: 250 }
});
\`\`\`

### Track Feature Usage

\`\`\`typescript
trackFeatureUse('parcelSearch', {
  searchType: 'address',
  resultsCount: 5
});
\`\`\`

### Track Workflow

\`\`\`typescript
trackWorkflow('documentUpload', 'started');
// ... after completion
trackWorkflow('documentUpload', 'completed', {
  documentType: 'deed',
  processingTime: 1200 // ms
});
\`\`\`
`;

  await saveDocumentation(uxMetricsGuide, uxMetricsContent);
  
  // Generate feature flags guide
  const featureFlagsGuide = {
    id: 'dev-guide-feature-flags',
    title: 'Feature Flags Implementation Guide',
    type: DocumentationType.DEVELOPER,
    accessLevel: DocumentationAccessLevel.DEVELOPER,
    path: path.join(DEV_GUIDES_PATH, 'feature-flags-guide.md'),
    lastUpdated: new Date(),
    version: (await getDeploymentInfo()).version,
    author: 'BentonGeoPro DevOps',
    tags: ['feature-flags', 'developer', 'integration']
  };
  
  const featureFlagsContent = `# Feature Flags Implementation Guide

## Overview

Feature flags allow for controlled rollout of new features, A/B testing, and emergency shutoffs.
This guide shows how to implement and use feature flags in the BentonGeoPro application.

## Server-Side Usage

Import the feature flag function:

\`\`\`typescript
import { getFeatureFlag } from '../server/devops';

// Check if a feature is enabled
if (await getFeatureFlag('new-map-controls', req.user)) {
  // Implement new feature
} else {
  // Use existing implementation
}
\`\`\`

## Client-Side Usage

For React components, use the \`useFeatureFlag\` hook:

\`\`\`typescript
import { useFeatureFlag } from '../hooks/use-feature-flag';

function MyComponent() {
  const { isEnabled, isLoading } = useFeatureFlag('new-map-controls');
  
  if (isLoading) return <LoadingSpinner />;
  
  return isEnabled ? <NewMapControls /> : <LegacyMapControls />;
}
\`\`\`

## Creating New Feature Flags

Feature flags should be created via the admin interface or via API:

\`\`\`typescript
POST /api/feature-flags
{
  "name": "new-map-controls",
  "description": "Enables the new map control UI",
  "enabled": false,
  "rolloutPercentage": 0,
  "rules": [
    {
      "type": "userGroup",
      "value": "beta-testers"
    }
  ]
}
\`\`\`

## Best Practices

1. Use descriptive names for feature flags
2. Clean up flags after features are fully released
3. Avoid nesting feature flags
4. Use rollout percentages for gradual deployment
5. Add monitoring and alerts for flag status

## Testing with Feature Flags

To test code paths with different flag states:

\`\`\`typescript
// In tests
import { mockFeatureFlag } from '../testing/utils';

test('renders new controls when flag enabled', async () => {
  mockFeatureFlag('new-map-controls', true);
  // Test code
});

test('renders legacy controls when flag disabled', async () => {
  mockFeatureFlag('new-map-controls', false);
  // Test code
});
\`\`\`
`;

  await saveDocumentation(featureFlagsGuide, featureFlagsContent);
  
  // Generate error tracking guide
  const errorTrackingGuide = {
    id: 'dev-guide-error-tracking',
    title: 'Error Tracking Integration Guide',
    type: DocumentationType.DEVELOPER,
    accessLevel: DocumentationAccessLevel.DEVELOPER,
    path: path.join(DEV_GUIDES_PATH, 'error-tracking-guide.md'),
    lastUpdated: new Date(),
    version: (await getDeploymentInfo()).version,
    author: 'BentonGeoPro DevOps',
    tags: ['error-tracking', 'developer', 'integration']
  };
  
  const errorTrackingContent = `# Error Tracking Integration Guide

## Overview

Proper error tracking is essential for identifying and resolving issues quickly.
This guide shows how to use the BentonGeoPro error tracking system effectively.

## Automatic Tracking

Server-side errors are automatically tracked through the global error handler.
Client-side errors are captured through the global error boundary and window.onerror.

## Manual Error Tracking

Import the tracking function:

\`\`\`typescript
import { trackError } from '../server/devops';

try {
  // Risky operation
} catch (error) {
  trackError('dataProcessing', error, {
    dataId: '12345',
    operationType: 'merge'
  });
  
  // Show user-friendly message
  return { error: 'Could not process data' };
}
\`\`\`

## React Components

For React components, use the error tracking hook:

\`\`\`typescript
import { useErrorTracking } from '../hooks/use-error-tracking';

function RiskyComponent() {
  const { trackError } = useErrorTracking();
  
  const handleRiskyOperation = () => {
    try {
      // Risky operation
    } catch (error) {
      trackError('componentOperation', error.message, {
        componentName: 'RiskyComponent',
        action: 'handleRiskyOperation'
      });
      
      // Handle gracefully
    }
  };
  
  return <button onClick={handleRiskyOperation}>Try It</button>;
}
\`\`\`

## Best Practices

1. Add meaningful context to errors
2. Use consistent error types for grouping
3. Handle errors gracefully in the UI
4. Don't track sensitive information
5. Implement retry logic for transient errors

## Error Boundary Usage

Wrap components that might error in error boundaries:

\`\`\`typescript
import { ErrorBoundary } from '../components/error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <RiskyComponent />
    </ErrorBoundary>
  );
}
\`\`\`

## Viewing and Analyzing Errors

Errors can be viewed and analyzed in the admin dashboard:

1. Navigate to /admin/errors
2. Filter by error type, component, or date range
3. View error frequency and impact
4. Mark errors as resolved
`;

  await saveDocumentation(errorTrackingGuide, errorTrackingContent);
  
  logger.info('Generated standard developer guides');
}

/**
 * Save documentation to file and database
 */
async function saveDocumentation(meta: DocumentationMeta, content: string) {
  try {
    // Save content to file
    fs.writeFileSync(meta.path, content, 'utf8');
    
    // Save metadata to database
    const existingDoc = await db.execute(sql`
      SELECT id FROM documentation_meta
      WHERE id = ${meta.id}
    `);
    
    if (existingDoc.rows.length > 0) {
      // Update existing
      await db.execute(sql`
        UPDATE documentation_meta
        SET title = ${meta.title},
            type = ${meta.type},
            access_level = ${meta.accessLevel},
            path = ${meta.path},
            last_updated = ${meta.lastUpdated},
            version = ${meta.version},
            author = ${meta.author || null},
            tags = ${meta.tags}
        WHERE id = ${meta.id}
      `);
    } else {
      // Insert new
      await db.execute(sql`
        INSERT INTO documentation_meta (
          id, title, type, access_level, path, last_updated, version, author, tags
        ) VALUES (
          ${meta.id}, ${meta.title}, ${meta.type}, ${meta.accessLevel},
          ${meta.path}, ${meta.lastUpdated}, ${meta.version},
          ${meta.author || null}, ${meta.tags}
        )
      `);
    }
    
    logger.info(`Saved documentation: ${meta.title}`);
  } catch (error) {
    logger.error(`Failed to save documentation ${meta.id}:`, error);
    throw error;
  }
}

/**
 * Get documentation metadata with filtering
 */
export async function getDocumentation(options: {
  type?: DocumentationType,
  accessLevel?: DocumentationAccessLevel,
  tags?: string[],
  search?: string
} = {}) {
  try {
    const { type, accessLevel, tags, search } = options;
    
    let query = sql`SELECT * FROM documentation_meta WHERE 1=1`;
    
    if (type) {
      query = sql`${query} AND type = ${type}`;
    }
    
    if (accessLevel) {
      query = sql`${query} AND access_level = ${accessLevel}`;
    }
    
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(tag => sql`${tag} = ANY(tags)`);
      query = sql`${query} AND (${sql.join(tagConditions, sql` OR `)})`;
    }
    
    if (search) {
      query = sql`${query} AND (
        title ILIKE ${`%${search}%`} OR 
        id ILIKE ${`%${search}%`} OR
        ${search} = ANY(tags)
      )`;
    }
    
    query = sql`${query} ORDER BY last_updated DESC`;
    
    const result = await db.execute(query);
    return result.rows;
  } catch (error) {
    logger.error('Failed to get documentation:', error);
    throw error;
  }
}

/**
 * Get documentation content by ID
 */
export async function getDocumentationContent(id: string): Promise<string | null> {
  try {
    const meta = await db.execute(sql`
      SELECT path FROM documentation_meta WHERE id = ${id}
    `);
    
    if (meta.rows.length === 0) {
      return null;
    }
    
    const path = meta.rows[0].path;
    
    if (!fs.existsSync(path)) {
      logger.error(`Documentation file not found: ${path}`);
      return null;
    }
    
    return fs.readFileSync(path, 'utf8');
  } catch (error) {
    logger.error(`Failed to get documentation content for ${id}:`, error);
    throw error;
  }
}

/**
 * Check if user has access to documentation
 */
function hasDocumentationAccess(accessLevel: DocumentationAccessLevel, user: any): boolean {
  if (accessLevel === DocumentationAccessLevel.PUBLIC) {
    return true;
  }
  
  if (!user) {
    return false;
  }
  
  if (accessLevel === DocumentationAccessLevel.AUTHENTICATED) {
    return true;
  }
  
  if (accessLevel === DocumentationAccessLevel.DEVELOPER && user.isDeveloper) {
    return true;
  }
  
  if (accessLevel === DocumentationAccessLevel.ADMIN && user.isAdmin) {
    return true;
  }
  
  return false;
}

/**
 * Register documentation routes
 * 
 * @param app Express application
 */
export function registerDocumentationRoutes(app: any) {
  // Get available documentation metadata
  app.get('/api/documentation', async (req: Request, res: Response) => {
    try {
      const { type, tags, search } = req.query;
      
      // Determine access level based on user
      let accessLevel: DocumentationAccessLevel;
      if (req.user) {
        if ((req.user as any).isAdmin) {
          accessLevel = DocumentationAccessLevel.ADMIN;
        } else if ((req.user as any).isDeveloper) {
          accessLevel = DocumentationAccessLevel.DEVELOPER;
        } else {
          accessLevel = DocumentationAccessLevel.AUTHENTICATED;
        }
      } else {
        accessLevel = DocumentationAccessLevel.PUBLIC;
      }
      
      // Get documentation metadata
      const docs = await getDocumentation({
        type: type as DocumentationType,
        accessLevel,
        tags: tags ? (tags as string).split(',') : undefined,
        search: search as string
      });
      
      // Filter based on access level
      const accessibleDocs = docs.filter(doc => 
        hasDocumentationAccess(doc.access_level as DocumentationAccessLevel, req.user)
      );
      
      return res.json({ documentation: accessibleDocs });
    } catch (error) {
      console.error('Error retrieving documentation:', error);
      return res.status(500).json({ error: 'Failed to retrieve documentation' });
    }
  });
  
  // Get documentation content
  app.get('/api/documentation/:id', async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      
      // Get metadata to check access
      const meta = await db.execute(sql`
        SELECT * FROM documentation_meta WHERE id = ${id}
      `);
      
      if (meta.rows.length === 0) {
        return res.status(404).json({ error: 'Documentation not found' });
      }
      
      const doc = meta.rows[0];
      
      // Check access
      if (!hasDocumentationAccess(doc.access_level, req.user)) {
        return res.status(403).json({ error: 'Not authorized to access this documentation' });
      }
      
      // Get content
      const content = await getDocumentationContent(id);
      
      if (!content) {
        return res.status(404).json({ error: 'Documentation content not found' });
      }
      
      return res.json({
        meta: doc,
        content
      });
    } catch (error) {
      console.error('Error retrieving documentation content:', error);
      return res.status(500).json({ error: 'Failed to retrieve documentation content' });
    }
  });
  
  // Add a new documentation entry (admin only)
  app.post('/api/documentation', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const { id, title, type, accessLevel, content, author, tags } = req.body;
      
      if (!id || !title || !type || !accessLevel || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Create file path
      let filePath: string;
      switch (type) {
        case DocumentationType.API:
          filePath = path.join(API_DOCS_PATH, `${id}.md`);
          break;
        case DocumentationType.DEVELOPER:
          filePath = path.join(DEV_GUIDES_PATH, `${id}.md`);
          break;
        case DocumentationType.USER:
          filePath = path.join(USER_GUIDES_PATH, `${id}.md`);
          break;
        default:
          filePath = path.join(DOCS_DIR, `${id}.md`);
      }
      
      const meta: DocumentationMeta = {
        id,
        title,
        type,
        accessLevel,
        path: filePath,
        lastUpdated: new Date(),
        version: (await getDeploymentInfo()).version,
        author,
        tags: tags || []
      };
      
      await saveDocumentation(meta, content);
      
      return res.json({ success: true, meta });
    } catch (error) {
      console.error('Error creating documentation:', error);
      return res.status(500).json({ error: 'Failed to create documentation' });
    }
  });
  
  // Update documentation content (admin only)
  app.put('/api/documentation/:id', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const id = req.params.id;
      const { title, accessLevel, content, tags } = req.body;
      
      // Get existing metadata
      const metaResult = await db.execute(sql`
        SELECT * FROM documentation_meta WHERE id = ${id}
      `);
      
      if (metaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Documentation not found' });
      }
      
      const existingMeta = metaResult.rows[0];
      
      // Update meta
      const meta: DocumentationMeta = {
        id,
        title: title || existingMeta.title,
        type: existingMeta.type,
        accessLevel: accessLevel || existingMeta.access_level,
        path: existingMeta.path,
        lastUpdated: new Date(),
        version: (await getDeploymentInfo()).version,
        author: existingMeta.author,
        tags: tags || existingMeta.tags
      };
      
      // Get current content if not provided
      let newContent = content;
      if (!newContent) {
        newContent = await getDocumentationContent(id) || '';
      }
      
      await saveDocumentation(meta, newContent);
      
      return res.json({ success: true, meta });
    } catch (error) {
      console.error('Error updating documentation:', error);
      return res.status(500).json({ error: 'Failed to update documentation' });
    }
  });
  
  // Delete documentation (admin only)
  app.delete('/api/documentation/:id', async (req: Request, res: Response) => {
    try {
      // Check for admin permission
      if (!(req.user && (req.user as any).isAdmin)) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      
      const id = req.params.id;
      
      // Get metadata
      const meta = await db.execute(sql`
        SELECT path FROM documentation_meta WHERE id = ${id}
      `);
      
      if (meta.rows.length === 0) {
        return res.status(404).json({ error: 'Documentation not found' });
      }
      
      const path = meta.rows[0].path;
      
      // Delete from database
      await db.execute(sql`
        DELETE FROM documentation_meta WHERE id = ${id}
      `);
      
      // Delete file if exists
      if (fs.existsSync(path)) {
        fs.unlinkSync(path);
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting documentation:', error);
      return res.status(500).json({ error: 'Failed to delete documentation' });
    }
  });
}