export enum DocumentType {
  DEED = 'Deed',
  SURVEY = 'Survey',
  TAX_ASSESSMENT = 'Tax Assessment',
  PLAT_MAP = 'Plat Map',
  BUILDING_PERMIT = 'Building Permit',
  LEGAL_DESCRIPTION = 'Legal Description',
  EASEMENT = 'Easement',
  COVENANT = 'Covenant',
  LAND_USE_APPLICATION = 'Land Use Application',
  APPRAISAL = 'Appraisal',
  UNKNOWN = 'Unknown'
}

export interface DocumentClassification {
  type: DocumentType;
  confidence: number;
}

/**
 * Classifies a document based on filename and content type
 * In a real application, this would use ML/AI, but for demo we'll use simple heuristics
 */
export function classifyDocument(filename: string): DocumentClassification {
  const lowerFilename = filename.toLowerCase();
  
  // Simple classification logic based on filename
  if (lowerFilename.includes('deed') || lowerFilename.includes('title')) {
    return { type: DocumentType.DEED, confidence: 0.95 };
  } else if (lowerFilename.includes('survey') || lowerFilename.includes('boundary')) {
    return { type: DocumentType.SURVEY, confidence: 0.92 };
  } else if (lowerFilename.includes('tax') || lowerFilename.includes('assessment')) {
    return { type: DocumentType.TAX_ASSESSMENT, confidence: 0.85 };
  } else if (lowerFilename.includes('plat') || lowerFilename.includes('subdivision')) {
    return { type: DocumentType.PLAT_MAP, confidence: 0.88 };
  } else if (lowerFilename.includes('permit') || lowerFilename.includes('building')) {
    return { type: DocumentType.BUILDING_PERMIT, confidence: 0.75 };
  } else if (lowerFilename.includes('legal') || lowerFilename.includes('description')) {
    return { type: DocumentType.LEGAL_DESCRIPTION, confidence: 0.80 };
  } else if (lowerFilename.includes('easement')) {
    return { type: DocumentType.EASEMENT, confidence: 0.90 };
  } else if (lowerFilename.includes('covenant') || lowerFilename.includes('restriction')) {
    return { type: DocumentType.COVENANT, confidence: 0.83 };
  } else if (lowerFilename.includes('application') || lowerFilename.includes('land use')) {
    return { type: DocumentType.LAND_USE_APPLICATION, confidence: 0.78 };
  } else if (lowerFilename.includes('appraisal') || lowerFilename.includes('value')) {
    return { type: DocumentType.APPRAISAL, confidence: 0.82 };
  } else {
    return { type: DocumentType.UNKNOWN, confidence: 0.5 };
  }
}

/**
 * Get a human-readable label for a document type
 */
export function getDocumentTypeLabel(type: DocumentType): string {
  return type.toString();
}

/**
 * Get a description for a document type
 */
export function getDocumentTypeDescription(type: DocumentType): string {
  switch (type) {
    case DocumentType.DEED:
      return 'A legal document that transfers ownership of a property from one party to another.';
    case DocumentType.SURVEY:
      return 'A document that shows property boundaries, improvements, and other features of a parcel.';
    case DocumentType.TAX_ASSESSMENT:
      return 'A document showing the assessed value of a property for tax purposes.';
    case DocumentType.PLAT_MAP:
      return 'A map showing the divisions of a piece of land into lots, streets, and easements.';
    case DocumentType.BUILDING_PERMIT:
      return 'A document authorizing construction or modifications to a property.';
    case DocumentType.LEGAL_DESCRIPTION:
      return 'A written description of a property that legally defines its boundaries and location.';
    case DocumentType.EASEMENT:
      return 'A legal document granting the right to use a portion of land for a specific purpose.';
    case DocumentType.COVENANT:
      return 'A document containing rules and restrictions that govern the use of a property.';
    case DocumentType.LAND_USE_APPLICATION:
      return 'An application to change how a property is used or developed.';
    case DocumentType.APPRAISAL:
      return 'A document estimating the market value of a property.';
    case DocumentType.UNKNOWN:
      return 'A document of unrecognized type.';
  }
}