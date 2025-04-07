// Test script for document lineage
import fetch from 'node-fetch';

async function testDocumentLifecycle() {
  console.log('========== DOCUMENT LINEAGE TESTING ==========');
  
  // Base URL for API requests
  const API_BASE = 'http://localhost:5000/api';
  
  // 1. Create a test document
  console.log('\n----- Test: Create Document -----');
  const documentData = {
    documentName: "Test Deed Document",
    documentType: "deed",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "test-user",
    status: "active",
    fileFormat: "pdf",
    fileHash: "sha256-" + Math.random().toString(36).substring(2),
    parcelId: "P12345",
    metadata: { 
      county: "Benton",
      year: 2025,
      page: 123
    }
  };
  
  try {
    const createResponse = await fetch(`${API_BASE}/document-lineage/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(documentData)
    });
    
    if (!createResponse.ok) throw new Error(`Failed to create document: ${createResponse.status}`);
    const document = await createResponse.json();
    console.log('✓ Document created successfully:', document.id);
    
    // Save document ID for further tests
    const documentId = document.id;
    
    // 2. Create a lineage event for the document
    console.log('\n----- Test: Create Lineage Event -----');
    const eventData = {
      documentId,
      eventType: "classified",
      eventTimestamp: new Date().toISOString(),
      performedBy: "ml-processor",
      details: { algorithm: "document-classifier-v1" },
      confidence: 0.95
    };
    
    const eventResponse = await fetch(`${API_BASE}/document-lineage/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    
    if (!eventResponse.ok) throw new Error(`Failed to create lineage event: ${eventResponse.status}`);
    const event = await eventResponse.json();
    console.log('✓ Lineage event created successfully:', event.id);
    
    // 3. Create a processing stage
    console.log('\n----- Test: Create Processing Stage -----');
    const stageData = {
      documentId,
      stageName: "classification",
      stageOrder: 1,
      status: "completed",
      startTime: new Date(Date.now() - 60000).toISOString(),
      completionTime: new Date().toISOString(),
      processorId: "doc-classifier-001",
      processorType: "ml-model",
      confidence: 0.92,
      result: { classificationResult: "deed", alternativeClasses: ["survey", "plat"] },
      nextStageIds: []
    };
    
    const stageResponse = await fetch(`${API_BASE}/document-lineage/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData)
    });
    
    if (!stageResponse.ok) throw new Error(`Failed to create processing stage: ${stageResponse.status}`);
    const stage = await stageResponse.json();
    console.log('✓ Processing stage created successfully:', stage.id);
    
    // 4. Create a related document
    console.log('\n----- Test: Create Related Document -----');
    const relatedDocData = {
      documentName: "Related Survey Document",
      documentType: "survey",
      uploadedAt: new Date().toISOString(),
      uploadedBy: "test-user",
      status: "active",
      fileFormat: "pdf",
      fileHash: "sha256-" + Math.random().toString(36).substring(2),
      parcelId: "P12345",
      metadata: { 
        county: "Benton",
        year: 2025,
        page: 124
      }
    };
    
    const relatedDocResponse = await fetch(`${API_BASE}/document-lineage/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(relatedDocData)
    });
    
    if (!relatedDocResponse.ok) throw new Error(`Failed to create related document: ${relatedDocResponse.status}`);
    const relatedDoc = await relatedDocResponse.json();
    console.log('✓ Related document created successfully:', relatedDoc.id);
    
    // 5. Create relationship between documents
    console.log('\n----- Test: Create Document Relationship -----');
    const relationshipData = {
      sourceDocumentId: documentId,
      targetDocumentId: relatedDoc.id,
      relationshipType: "references",
      createdAt: new Date().toISOString(),
      createdBy: "test-user",
      confidence: 0.85,
      metadata: { automaticallyDetected: true }
    };
    
    const relationshipResponse = await fetch(`${API_BASE}/document-lineage/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(relationshipData)
    });
    
    if (!relationshipResponse.ok) throw new Error(`Failed to create relationship: ${relationshipResponse.status}`);
    const relationship = await relationshipResponse.json();
    console.log('✓ Document relationship created successfully:', relationship.id);
    
    // 6. Get document lineage
    console.log('\n----- Test: Get Document Lineage -----');
    const lineageResponse = await fetch(`${API_BASE}/document-lineage/documents/${documentId}/lineage`);
    
    if (!lineageResponse.ok) throw new Error(`Failed to get document lineage: ${lineageResponse.status}`);
    const lineage = await lineageResponse.json();
    console.log('✓ Document lineage retrieved successfully');
    console.log(`  Found ${lineage.nodes.length} nodes and ${lineage.edges.length} edges`);
    
    // 7. Get document provenance
    console.log('\n----- Test: Get Document Provenance -----');
    const provenanceResponse = await fetch(`${API_BASE}/document-lineage/documents/${documentId}/provenance`);
    
    if (!provenanceResponse.ok) throw new Error(`Failed to get document provenance: ${provenanceResponse.status}`);
    const provenance = await provenanceResponse.json();
    console.log('✓ Document provenance retrieved successfully');
    console.log(`  Found ${provenance.nodes.length} nodes and ${provenance.edges.length} edges`);
    
    // 8. Get complete document graph
    console.log('\n----- Test: Get Complete Document Graph -----');
    const graphResponse = await fetch(`${API_BASE}/document-lineage/graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds: [documentId, relatedDoc.id] })
    });
    
    if (!graphResponse.ok) throw new Error(`Failed to get complete document graph: ${graphResponse.status}`);
    const graph = await graphResponse.json();
    console.log('✓ Complete document graph retrieved successfully');
    console.log(`  Found ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
    
    console.log('\n✅ All document lineage tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testDocumentLifecycle();