# TerraFusion Platform

A cutting-edge Geographic Information System (GIS) workflow solution for county assessor's offices, delivering advanced geospatial data processing with intelligent document management and robust collaborative features.

## Overview

TerraFusion is a modular monorepo architecture designed to support cartography and mass appraisal workflows for county assessors. The platform provides advanced mapping capabilities, AI-powered analysis, data import/export tools, and comprehensive administrative interfaces.

![TerraFusion Platform](/public/terrafusion-screenshot.png)

## Key Features

- **Advanced Mapping**: Interactive maps with measurement tools, layer management, and data visualization
- **AI-Powered Analysis**: Legal description parsing and property valuation using OpenAI
- **Data Import/Export**: Comprehensive ETL tools for importing and validating data
- **Administrative Dashboard**: System health monitoring and county management
- **Workflow Management**: Step-by-step county onboarding and configuration

## Monorepo Structure

The TerraFusion platform is organized into a modular monorepo architecture for improved code maintainability, separation of concerns, and scalability:

```
/
├── apps/                    # Application modules
│   ├── CartographyModule/   # Mapping and visualization components
│   └── GAMAValuation/       # Property valuation and AI analysis
├── libs/                    # Shared libraries
│   ├── ETL/                 # Data import, cleaning, transformation
│   ├── WorkflowUI/          # Admin dashboards and workflow components
│   └── DevOps/              # Monitoring, logging, automation
├── data/                    # County data files (CSV, shapefiles, GDBs)
├── public/                  # Static assets
└── src/                     # Main application
    ├── App.tsx              # Application entry point
    └── mockData.ts          # Demo data (replace in production)
```

### Module Descriptions

#### CartographyModule

The CartographyModule handles all mapping and geographical visualization aspects of the platform:

- `CountyMapViewer`: Main map interface supporting multiple providers (Mapbox, Leaflet, ArcGIS)
- `MapControls`: Tools for map navigation and interaction
- `MeasurementTools`: Distance, area, and angle measurement with conversion
- `LayerManager`: Layer configuration and styling
- `PrintExportPanel`: Map printing and exporting to various formats

#### GAMAValuation

The GAMAValuation module provides AI-powered property valuation and analysis:

- `LegalDescriptionAnalyzer`: AI model for parsing legal descriptions using OpenAI
- `LegalDescriptionAnalyzerPanel`: User interface for the analyzer
- `ValuationEngine`: Property valuation using sales comparison, cost, and income approaches

#### ETL (Extract, Transform, Load)

The ETL library handles data import, validation, and transformation:

- `CSVImporter`: Import data from CSV files with validation and transformation rules
- Data validation and cleaning utilities
- Data mapping and transformation tools

#### WorkflowUI

The WorkflowUI library provides administrative interfaces and workflow components:

- `AdminDashboard`: Comprehensive admin interface with user and county management
- `SystemHealthPanel`: System monitoring and alerting
- `CountyOnboardingWorkflow`: Step-by-step wizard for onboarding new counties

#### DevOps

The DevOps library contains utilities for monitoring, logging, and automation:

- `Logger`: Centralized logging system with tags and filtering
- Monitoring and alerting tools
- CI/CD automation scripts

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- OpenAI API key (for AI-powered features)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/terrafusion.git
   cd terrafusion
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env.local
   # Edit .env.local to add your API keys and database connection
   ```

4. Initialize the database:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

The application will be available at http://localhost:3000.

## Usage Guide

### County Onboarding

1. Navigate to County Management in the sidebar
2. Click "Add New County"
3. Follow the step-by-step wizard to configure:
   - Basic county information
   - County contacts
   - GIS data sources
   - Valuation and tax system integration
   - Data access settings
4. Review and resolve any validation issues
5. Activate the county when ready

### Map Viewing and Analysis

1. Select a county from the dropdown in the header
2. Navigate to the Map Viewer to explore parcel data
3. Use the measurement tools for distance and area calculations
4. Configure layers using the Layer Manager
5. Navigate to Property Analysis to analyze legal descriptions or valuations

### Data Import

1. Navigate to Data Import in the sidebar
2. Select the appropriate import method (CSV, Shapefile, GeoJSON)
3. Upload your data file
4. Review validation results and fix any errors
5. Commit the import when ready

### System Monitoring

1. Navigate to System Health in the sidebar
2. View the status of all system components
3. Acknowledge and resolve any alerts
4. Monitor metrics for performance issues

## Development

### Adding a New Feature

1. Identify the appropriate module for your feature
2. Create the necessary components and tests
3. Update the main application to integrate your feature
4. Document the feature in the module's README

### Running Tests

```
npm run test
```

### Building for Production

```
npm run build
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Benton County Assessor's Office for their domain expertise
- OpenAI for providing the AI capabilities
- Mapbox, Leaflet, and ArcGIS for mapping technologies