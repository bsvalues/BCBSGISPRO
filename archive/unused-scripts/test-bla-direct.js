// Direct test of the BLA pattern detection logic
const DocumentType = {
  PLAT_MAP: 'plat_map',
  DEED: 'deed',
  SURVEY: 'survey',
  LEGAL_DESCRIPTION: 'legal_description',
  BOUNDARY_LINE_ADJUSTMENT: 'boundary_line_adjustment',
  TAX_FORM: 'tax_form',
  UNCLASSIFIED: 'unclassified'
};

// Test BLA document text
const combinedText = `BOUNDARY LINE ADJUSTMENT FILE NO. BLA-2025-042 BENTON COUNTY COMMUNITY DEVELOPMENT DEPARTMENT. LEGAL DESCRIPTION OF ORIGINAL PARCELS: PARCEL A (PARCEL NO. 1-23456-789): THE EAST 125 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION, AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY, WASHINGTON. PARCEL B (PARCEL NO. 1-23456-790): THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8, BLOCK 3, SUNNYDALE ADDITION, AS PER PLAT RECORDED IN VOLUME 7 OF PLATS, PAGE 23, RECORDS OF BENTON COUNTY, WASHINGTON. LEGAL DESCRIPTION OF ADJUSTMENT AREA: THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION. LEGAL DESCRIPTION OF PARCELS AFTER BOUNDARY LINE ADJUSTMENT: PARCEL A-ADJUSTED (PARCEL NO. 1-23456-789): THE EAST 100 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION. PARCEL B-ADJUSTED (PARCEL NO. 1-23456-790): THE WEST 125 FEET OF THE NORTH 150 FEET OF LOT 8 AND THE EAST 25 FEET OF THE NORTH 150 FEET OF LOT 7, BLOCK 3, SUNNYDALE ADDITION.`;

// Setup a mock classification result
const baseClassification = {
  documentType: DocumentType.LEGAL_DESCRIPTION,
  confidence: 0.55,
  alternativeTypes: [
    {
      documentType: DocumentType.PLAT_MAP,
      confidence: 0.30
    },
    {
      documentType: DocumentType.BOUNDARY_LINE_ADJUSTMENT,
      confidence: 0.10
    },
    {
      documentType: DocumentType.UNCLASSIFIED,
      confidence: 0.05
    }
  ]
};

console.log('Original classification:', baseClassification.documentType);
console.log('Confidence:', baseClassification.confidence);
console.log('Alternatives:', baseClassification.alternativeTypes);

// Start the BLA-specific pattern detection logic
const normalizedText = combinedText.toLowerCase();

// Check for specific BLA-related patterns that strongly indicate BLA documents
const specificBLAPatterns = [
  /\bboundary\s+line\s+adjustment\b/i,
  /\bbla[-\s][0-9]+/i,
  /\bparcel.+adjusted\b/i,
  /\badjustment\s+area\b/i,
  /\bparcels\s+after\s+boundary\s+line\s+adjustment\b/i,
  /\badjusted\s+parcel\b/i
];

// Count how many specific BLA patterns match
const blaPatternMatches = specificBLAPatterns.filter(pattern => 
  pattern.test(normalizedText)
).length;

console.log(`\nFound ${blaPatternMatches} BLA pattern matches in text`);

// If we find multiple strong BLA indicators, override to BLA classification
if (blaPatternMatches >= 2) {
  console.log('\nBLA pattern threshold met, attempting to override classification');
  
  // Force override to BLA classification regardless of alternatives
  baseClassification.documentType = DocumentType.BOUNDARY_LINE_ADJUSTMENT;
  baseClassification.confidence = 0.75;
  
  // Keep the original classification as an alternative
  const originalType = DocumentType.LEGAL_DESCRIPTION;
  const originalConfidence = 0.55;
  
  // Update alternatives list
  if (baseClassification.alternativeTypes && baseClassification.alternativeTypes.length > 0) {
    const withoutBLA = baseClassification.alternativeTypes.filter(
      alt => alt.documentType !== DocumentType.BOUNDARY_LINE_ADJUSTMENT
    );
    
    // Add the original primary classification as an alternative if it's not BLA
    if (originalType !== DocumentType.BOUNDARY_LINE_ADJUSTMENT) {
      withoutBLA.unshift({
        documentType: originalType,
        confidence: originalConfidence
      });
    }
    
    // Update alternatives
    baseClassification.alternativeTypes = withoutBLA.slice(0, 3);
  }
}

console.log('\nFinal classification:', baseClassification.documentType);
console.log('Confidence:', baseClassification.confidence);
console.log('Alternatives:', baseClassification.alternativeTypes);