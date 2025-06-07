const fs = require('fs');
const path = require('path');

class LocalLLMClient {
  constructor() {
    this.ragEnabled = false;
    this.llmEndpoint = process.env.LLM_ENDPOINT || 'http://localhost:11434';
    this.modelName = process.env.LLM_MODEL || 'mistral:7b-instruct';
    this.ragDB = null;
  }

  async askLLM(prompt, options = {}) {
    try {
      const { context, useRAG = false } = options;
      let enhancedPrompt = prompt;

      // Add RAG context if enabled and requested
      if (useRAG && this.ragEnabled) {
        const relevantDocs = await this.retrieveRelevantDocs(prompt);
        enhancedPrompt = `Context from Benton County GIS documents:\n${relevantDocs}\n\nQuery: ${prompt}`;
      }

      // Add Benton County specific context
      const systemContext = `You are TerraFusion AI, a specialized GIS workflow assistant for Benton County, Washington Assessor's Office. 
      
County Details:
- Location: South-central Washington State
- Population: 206,873 (2020 Census)
- Major Cities: Kennewick (83,920), Richland (60,560), West Richland (15,875), Prosser (6,062), Benton City (3,548)
- FIPS Code: 53005
- Special Considerations: Hanford Nuclear Reservation (586 sq miles), Wine Country, Agricultural Districts

Your responses must be:
- Compliant with Washington State assessment regulations
- Specific to Benton County procedures and districts
- Technically accurate for GIS and property assessment workflows
- Include proper legal descriptions and parcel formatting`;

      // Call local LLM (LM Studio or Ollama)
      const response = await fetch(`${this.llmEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.modelName,
          prompt: `${systemContext}\n\n${enhancedPrompt}`,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
            max_tokens: 2048
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }

      const result = await response.json();
      
      // Log the interaction for audit
      this.logInteraction(prompt, result.response, context);
      
      return result.response;
      
    } catch (error) {
      console.error('LLM Client Error:', error);
      
      // Fallback to rule-based responses for critical workflows
      return this.getFallbackResponse(prompt);
    }
  }

  async initializeRAG() {
    try {
      // Initialize ChromaDB for document retrieval
      const { ChromaClient } = require('chromadb');
      this.ragDB = new ChromaClient({
        path: path.join(__dirname, '../../rag/chroma_db')
      });

      // Load Benton County GIS documents into vector store
      await this.loadBentonCountyDocs();
      
      this.ragEnabled = true;
      console.log('✅ RAG system initialized with Benton County documents');
      
    } catch (error) {
      console.warn('⚠️ RAG initialization failed, continuing without RAG:', error.message);
      this.ragEnabled = false;
    }
  }

  async loadBentonCountyDocs() {
    const docsPath = path.join(__dirname, '../../rag/documents');
    
    // Default Benton County knowledge base
    const bentonCountyKnowledge = [
      {
        id: 'benton-county-overview',
        content: `Benton County, Washington Assessment Districts:
        - Richland District: Urban residential and commercial properties
        - Kennewick District: Mixed urban development, largest city (83,920 pop)
        - West Richland District: Suburban residential (15,875 pop)
        - Prosser District: County seat, wine country, rural residential (6,062 pop)
        - Rural North District: Agricultural and rural residential
        - Rural South District: Large agricultural operations
        
        Property Types:
        - Residential: 65% (Single family, condos, manufactured homes)
        - Agricultural: 20% (Farms, orchards, vineyards, ranches)
        - Commercial: 8% (Retail, office, hospitality)
        - Industrial: 4% (Manufacturing, processing, warehouses)
        - Vacant Land: 2% (Developable lots and acreage)
        - Utility/Government: 1% (Public facilities, Hanford Nuclear Reservation)`
      },
      {
        id: 'sm00-procedures',
        content: `SM00 Report Procedures for Benton County:
        - Required for all property transfers and boundary line adjustments
        - Must include accurate legal description per Washington State standards
        - Parcel numbers follow format: XXXXXXX-XXX-XXX
        - Legal descriptions must reference official township/range/section
        - Owner information verified against county records
        - Assessment values current as of January 1st assessment date
        - Special districts and taxing authorities must be identified`
      },
      {
        id: 'bla-procedures',
        content: `Boundary Line Adjustment (BLA) Procedures:
        - Requires survey by licensed Washington State surveyor
        - No additional parcels can be created
        - Must maintain minimum lot sizes per zoning
        - Setback requirements must be maintained
        - Utility easements must be preserved or relocated
        - Environmental review may be required
        - Recording fee and excise tax considerations
        - Agricultural land current use assessment implications`
      }
    ];

    // Store documents in vector database
    if (this.ragDB) {
      for (const doc of bentonCountyKnowledge) {
        await this.ragDB.add({
          ids: [doc.id],
          documents: [doc.content],
          metadatas: [{ type: 'benton_county_procedure' }]
        });
      }
    }
  }

  async retrieveRelevantDocs(query) {
    if (!this.ragEnabled || !this.ragDB) {
      return 'RAG system not available';
    }

    try {
      const results = await this.ragDB.query({
        queryTexts: [query],
        nResults: 3
      });

      return results.documents[0].join('\n\n');
    } catch (error) {
      console.error('RAG retrieval error:', error);
      return 'Unable to retrieve relevant documents';
    }
  }

  getFallbackResponse(prompt) {
    // Rule-based fallback for critical workflows
    if (prompt.includes('SM00')) {
      return `SM00 Report Template for Benton County:
      
1. Parcel Identification
   - Parcel Number: [Format: XXXXXXX-XXX-XXX]
   - Legal Description: [Township/Range/Section format]
   - Situs Address: [Physical address]

2. Ownership Information
   - Owner Name: [From county records]
   - Mailing Address: [Current mailing address]

3. Assessment Data
   - Land Value: $[Current assessed value]
   - Improvement Value: $[Building/structure value]
   - Total Assessed Value: $[Combined total]
   - Assessment Year: [Current tax year]

4. Taxing Districts
   - County: Benton County
   - City: [If applicable: Kennewick, Richland, West Richland, Prosser, Benton City]
   - School District: [Applicable district]
   - Special Districts: [Fire, cemetery, hospital, etc.]

Note: This is a template. Verify all information against current county records.`;
    }

    if (prompt.includes('BLA') || prompt.includes('boundary')) {
      return `Boundary Line Adjustment Checklist for Benton County:

1. Pre-Application Requirements
   - Survey by licensed Washington surveyor
   - Legal description verification
   - Zoning compliance check
   - Setback requirement analysis

2. Application Process
   - Complete BLA application form
   - Submit surveyed legal descriptions
   - Pay applicable fees
   - Environmental review (if required)

3. Review Criteria
   - No net increase in parcels
   - Minimum lot size compliance
   - Access and utility considerations
   - Agricultural land implications

4. Recording Requirements
   - Boundary line adjustment agreement
   - Updated legal descriptions
   - Recording fees and taxes
   - Deed amendments if necessary

Consult Benton County Planning Department for specific requirements.`;
    }

    return 'LLM system temporarily unavailable. Please contact system administrator.';
  }

  logInteraction(prompt, response, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      prompt: prompt.substring(0, 200) + (prompt.length > 200 ? '...' : ''),
      response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
      context,
      ragUsed: this.ragEnabled
    };

    const logPath = path.join(__dirname, '../../logs/llm-interactions.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
}

// Initialize client
const llmClient = new LocalLLMClient();

module.exports = {
  askLLM: (prompt, options) => llmClient.askLLM(prompt, options),
  initializeRAG: () => llmClient.initializeRAG()
};