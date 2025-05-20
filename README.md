# TerraFusion GIS Cartography & Analytics Platform

A cutting-edge Geographic Information System (GIS) workflow solution for the Benton County Assessor's Office, delivering advanced geospatial data processing with intelligent document management and robust collaborative features.

## Project Purpose

TerraFusion is a geospatial SaaS blueprint for cartography and mass appraisal that offers:

- Advanced map rendering and cartographic tools
- Data ETL and normalization for various county data formats
- Workflow management for assessor operations
- DevOps tools for monitoring and maintaining the application
- Mass appraisal analytics (GAMA valuation)

## Folder Structure

The project follows a modular monorepo structure:

- `/apps/CartographyModule`: All mapping, cartography, and export functionality
- `/apps/GAMAValuation`: AI/ML valuation and analytics (mass appraisal)
- `/libs/ETL`: Data import, cleaning, and normalization scripts
- `/libs/WorkflowUI`: Admin, workflow, and dashboard code (React/TypeScript)
- `/libs/DevOps`: Health checks, agent orchestration, CI/CD automation
- `/data`: County data files (CSV, shapefiles, GDBs) for testing and demos

## How to Run

### Starting the Application

```
npm run dev
```

This will start the Express server for the backend and the Vite server for the frontend.

### Running Tests

```
npm test
```

## Onboarding a New County

1. **Add Data**
   - Place new county data files in the `/data/{county-name}/` directory
   - Supported formats: CSV, Shapefile (.shp), GeoDatabase (.gdb)

2. **Run ETL**
   - Execute the appropriate ETL script for the data type
   - This will clean, normalize, and load the data into the system

3. **Render Maps**
   - Access the CartographyModule to view and interact with the imported data
   - Configure layer styling and visualization options

## Adding New Modules

To add a new module:

1. Create a directory in the appropriate location (`/apps/` or `/libs/`)
2. Update imports and exports to maintain modular structure
3. Register new routes or components as needed

## License

MIT