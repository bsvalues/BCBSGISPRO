import React, { useState } from 'react';
import { ModernLayout } from '../components/layout/modern-layout';
import { DocumentScanner } from '../components/document-scanner/document-scanner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Info, FileText, Map, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

// Sample title report for demo purposes
const SAMPLE_REPORT = {
  title: "Title Report - 18472 W Arrowhead Ln",
  propertyInfo: {
    parcelNumber: "1-23456-7890",
    legalDescription: "LOT 7, BLOCK 3, KENNEWICK IRRIGATION DISTRICT SUBDIVISION HIGHLANDS, ACCORDING TO THE PLAT THEREOF RECORDED IN VOLUME 1 OF PLATS, PAGE 93, RECORDS OF BENTON COUNTY, WASHINGTON.",
    owner: "John & Jane Smith",
    address: "18472 W Arrowhead Ln, Kennewick, WA 99336"
  },
  extractedText: "TITLE REPORT\n\nPROPERTY ADDRESS: 18472 W Arrowhead Ln, Kennewick, WA 99336\nPARCEL ID: 1-23456-7890\nOWNER OF RECORD: John & Jane Smith\n\nLEGAL DESCRIPTION:\nLOT 7, BLOCK 3, KENNEWICK IRRIGATION DISTRICT SUBDIVISION HIGHLANDS, ACCORDING TO THE PLAT THEREOF RECORDED IN VOLUME 1 OF PLATS, PAGE 93, RECORDS OF BENTON COUNTY, WASHINGTON.\n\nENCUMBRANCES:\n1. General taxes for the year 2023, which are liens not yet due and payable.\n2. Easement for utility purposes recorded under Auditor's File No. 2018-012345.\n3. Covenants, conditions, restrictions, and easements contained in document recorded under Auditor's File No. 723456.",
  confidence: 92,
  metadata: {
    documentType: "Title Report",
    pageCount: 3,
    createdAt: new Date()
  }
};

export default function DocumentScannerPage() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [demoMode, setDemoMode] = useState(false);

  const handleDocumentAnalyzed = (result: any) => {
    setScanResult(result);
  };

  const activateDemoMode = () => {
    setDemoMode(true);
    setScanResult(SAMPLE_REPORT);
  };

  return (
    <ModernLayout>
      <div className="container mx-auto py-6 max-w-6xl">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Document Scanner</h1>
          <p className="text-muted-foreground">
            Upload and analyze title reports, deeds, and property documents
          </p>
        </div>

        <div className="mb-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>AI-Powered Document Analysis</AlertTitle>
            <AlertDescription>
              Our document scanner automatically extracts property information, legal descriptions, 
              and key data from your uploaded files using advanced OCR and AI technology.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DocumentScanner onDocumentAnalyzed={handleDocumentAnalyzed} />
            
            {!scanResult && !demoMode && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={activateDemoMode}>
                  Try Demo with Sample Title Report
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
                <CardDescription>
                  Our document scanning system uses AI to extract property information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4 text-sm">
                  <li className="flex">
                    <div className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      1
                    </div>
                    <div>
                      <strong className="block font-medium">Upload a document</strong>
                      <span className="text-muted-foreground">
                        Upload a title report, deed, or property document in PDF or image format
                      </span>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      2
                    </div>
                    <div>
                      <strong className="block font-medium">AI-powered analysis</strong>
                      <span className="text-muted-foreground">
                        Our AI system extracts property information, legal descriptions, and key data
                      </span>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                      3
                    </div>
                    <div>
                      <strong className="block font-medium">Review and use results</strong>
                      <span className="text-muted-foreground">
                        Analyze the extracted information and utilize it in your workflow
                      </span>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>

            {scanResult && scanResult.propertyInfo.legalDescription && (
              <Card>
                <CardHeader>
                  <CardTitle>Legal Description</CardTitle>
                  <CardDescription>
                    Visualize the extracted legal description on a map
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      A legal description was found in your document. You can visualize and analyze it using 
                      our Legal Description Analyzer.
                    </p>
                    
                    <div className="bg-slate-50 p-3 rounded-md text-sm">
                      <p className="font-mono line-clamp-3 text-xs">
                        {scanResult.propertyInfo.legalDescription}
                      </p>
                    </div>

                    <Link href="/legal-description">
                      <Button className="w-full">
                        <Map className="mr-2 h-4 w-4" />
                        Analyze Legal Description
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {scanResult && scanResult.propertyInfo.parcelNumber && (
              <Card>
                <CardHeader>
                  <CardTitle>Parcel Information</CardTitle>
                  <CardDescription>
                    View detailed property data for this parcel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-md">
                      <p className="text-xs text-muted-foreground">Parcel Number</p>
                      <p className="text-sm font-medium">{scanResult.propertyInfo.parcelNumber}</p>
                    </div>

                    <Link href="/benton-map">
                      <Button variant="outline" className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        View Property on Map
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}