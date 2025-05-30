import { Express } from 'express';
import documentLineageRoutes from './routes/document-lineage-routes';

/**
 * Register document lineage routes
 * @param app Express application
 */
export function registerDocumentLineageRoutes(app: Express) {
  app.use('/api/document-lineage', documentLineageRoutes);
}