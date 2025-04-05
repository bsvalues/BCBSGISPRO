const express = require('express');
const cors = require('cors');
const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

// Mock data
const parcels = [
  {
    id: "123",
    owner: "John Smith",
    acres: 5.6,
    address: "1234 County Road",
    assessedValue: 125000,
    type: "Residential"
  },
  {
    id: "124",
    owner: "Jane Doe",
    acres: 12.3,
    address: "5678 Rural Route",
    assessedValue: 230000,
    type: "Agricultural"
  }
];

const documents = [
  {
    id: "1",
    name: "Smith Deed.pdf",
    type: "Deed",
    uploadDate: "2023-10-15",
    size: 1250000,
    parcelId: "123"
  },
  {
    id: "2",
    name: "Property Survey.pdf",
    type: "Survey",
    uploadDate: "2023-09-12",
    size: 4820000,
    parcelId: "123"
  },
  {
    id: "3",
    name: "Tax Assessment 2023.pdf",
    type: "Tax Assessment",
    uploadDate: "2023-01-10",
    size: 980000,
    parcelId: "124"
  }
];

// Routes
app.get('/api/parcel/:id', (req, res) => {
  const parcel = parcels.find(p => p.id === req.params.id);
  if (!parcel) {
    return res.status(404).json({ error: 'Parcel not found' });
  }
  res.json(parcel);
});

app.get('/api/documents', (req, res) => {
  let filteredDocs = [...documents];
  
  // Filter by parcel ID if provided
  if (req.query.parcelId) {
    filteredDocs = filteredDocs.filter(doc => doc.parcelId === req.query.parcelId);
  }
  
  res.json(filteredDocs);
});

app.post('/api/classify-document', (req, res) => {
  const { filename } = req.body;
  
  // Simple classification logic based on filename
  let type = 'Unknown';
  let confidence = 0.5;
  
  if (filename.toLowerCase().includes('deed')) {
    type = 'Deed';
    confidence = 0.95;
  } else if (filename.toLowerCase().includes('survey')) {
    type = 'Survey';
    confidence = 0.92;
  } else if (filename.toLowerCase().includes('tax')) {
    type = 'Tax Assessment';
    confidence = 0.85;
  } else if (filename.toLowerCase().includes('plat') || filename.toLowerCase().includes('map')) {
    type = 'Plat Map';
    confidence = 0.88;
  } else if (filename.toLowerCase().includes('permit') || filename.toLowerCase().includes('building')) {
    type = 'Building Permit';
    confidence = 0.75;
  }
  
  res.json({ type, confidence });
});

app.post('/api/documents', (req, res) => {
  const newDoc = {
    ...req.body,
    id: (documents.length + 1).toString(),
    uploadDate: new Date().toISOString().split('T')[0]
  };
  
  documents.push(newDoc);
  res.status(201).json(newDoc);
});

// Start server
app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
});