import React, { useState } from 'react';
import { DocumentParcelRelationshipManager } from '@/components/document-parcel/document-parcel-relationship-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function DocumentParcelRelationshipsPage() {
  const [activeTab, setActiveTab] = useState('document');
  const [documentId, setDocumentId] = useState<number | undefined>(undefined);
  const [parcelId, setParcelId] = useState<number | undefined>(undefined);
  const [inputDocumentId, setInputDocumentId] = useState('');
  const [inputParcelId, setInputParcelId] = useState('');

  const handleDocumentSearch = () => {
    const id = parseInt(inputDocumentId);
    if (!isNaN(id)) {
      setDocumentId(id);
      setParcelId(undefined);
      setActiveTab('document');
    }
  };

  const handleParcelSearch = () => {
    const id = parseInt(inputParcelId);
    if (!isNaN(id)) {
      setParcelId(id);
      setDocumentId(undefined);
      setActiveTab('parcel');
    }
  };

  const handleBothSearch = () => {
    const docId = parseInt(inputDocumentId);
    const parcId = parseInt(inputParcelId);
    
    if (!isNaN(docId) && !isNaN(parcId)) {
      setDocumentId(docId);
      setParcelId(parcId);
      setActiveTab('specific');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Document-Parcel Relationship Management</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>
            Enter document or parcel IDs to view and manage their relationships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label htmlFor="documentId">Document ID</Label>
              <div className="flex gap-2">
                <Input
                  id="documentId"
                  type="number"
                  placeholder="Enter Document ID"
                  value={inputDocumentId}
                  onChange={(e) => setInputDocumentId(e.target.value)}
                />
                <Button onClick={handleDocumentSearch}>Search</Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label htmlFor="parcelId">Parcel ID</Label>
              <div className="flex gap-2">
                <Input
                  id="parcelId"
                  type="number"
                  placeholder="Enter Parcel ID"
                  value={inputParcelId}
                  onChange={(e) => setInputParcelId(e.target.value)}
                />
                <Button onClick={handleParcelSearch}>Search</Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button
              onClick={handleBothSearch}
              disabled={!inputDocumentId || !inputParcelId}
              variant="outline"
              className="w-full"
            >
              View Specific Document-Parcel Relationship
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="document">Document Relationships</TabsTrigger>
          <TabsTrigger value="parcel">Parcel Relationships</TabsTrigger>
          <TabsTrigger value="specific">Specific Relationship</TabsTrigger>
        </TabsList>
        
        <TabsContent value="document" className="p-4 border rounded-md mt-2">
          {documentId ? (
            <DocumentParcelRelationshipManager documentId={documentId} />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">Please enter a Document ID to view its relationships</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="parcel" className="p-4 border rounded-md mt-2">
          {parcelId ? (
            <DocumentParcelRelationshipManager parcelId={parcelId} />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">Please enter a Parcel ID to view its relationships</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="specific" className="p-4 border rounded-md mt-2">
          {documentId && parcelId ? (
            <DocumentParcelRelationshipManager documentId={documentId} parcelId={parcelId} />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">Please enter both Document and Parcel IDs to view their specific relationship</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}