import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { useToast } from '../../hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import type { LegalDescriptionResult, LegalDescriptionVisualization, ParsedLegalDescription } from '../../../shared/schema';
import { Loader2, AlertTriangle, Check, Map, FileText, PieChart, CornerDownRight } from 'lucide-react';
import { Badge } from '../ui/badge';

// API client for legal description
async function analyzeLegalDescription(description: string): Promise<LegalDescriptionResult> {
  const response = await fetch('/api/legal-description/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to analyze legal description');
  }
  
  return data.data;
}

async function parseLegalDescription(description: string): Promise<ParsedLegalDescription> {
  const response = await fetch('/api/legal-description/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to parse legal description');
  }
  
  return data.data;
}

async function generateVisualizationData(description: string, baseCoordinate?: [number, number]): Promise<LegalDescriptionVisualization> {
  const response = await fetch('/api/legal-description/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, baseCoordinate })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to generate visualization data');
  }
  
  return data.data;
}

interface LegalDescriptionAnalyzerProps {
  initialDescription?: string;
  onVisualizationGenerated?: (data: LegalDescriptionVisualization) => void;
  baseCoordinate?: [number, number];
}

export function LegalDescriptionAnalyzer({ 
  initialDescription = '', 
  onVisualizationGenerated,
  baseCoordinate 
}: LegalDescriptionAnalyzerProps) {
  const { toast } = useToast();
  const [description, setDescription] = useState(initialDescription);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<LegalDescriptionResult | null>(null);
  const [parsedDescription, setParsedDescription] = useState<ParsedLegalDescription | null>(null);
  const [visualization, setVisualization] = useState<LegalDescriptionVisualization | null>(null);
  const [activeTab, setActiveTab] = useState('input');
  
  const handleAnalyze = async () => {
    if (!description.trim()) {
      toast({
        title: 'Empty Description',
        description: 'Please enter a legal description to analyze.',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Run all analyses in parallel for efficiency
      const [analysisResult, parsedResult, visualizationResult] = await Promise.all([
        analyzeLegalDescription(description),
        parseLegalDescription(description),
        generateVisualizationData(description, baseCoordinate)
      ]);
      
      setAnalysis(analysisResult);
      setParsedDescription(parsedResult);
      setVisualization(visualizationResult);
      
      // Call the callback if provided
      if (onVisualizationGenerated) {
        onVisualizationGenerated(visualizationResult);
      }
      
      // Switch to analysis tab
      setActiveTab('analysis');
      
      toast({
        title: 'Analysis Complete',
        description: 'The legal description has been analyzed successfully.',
      });
    } catch (error) {
      console.error('Failed to analyze legal description:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze legal description.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const renderValidationScore = (score: number) => {
    let color = 'bg-red-500';
    if (score >= 80) color = 'bg-green-500';
    else if (score >= 60) color = 'bg-yellow-500';
    else if (score >= 40) color = 'bg-orange-500';
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm font-medium">Validation Score</span>
          <span className="text-sm font-medium">{score}%</span>
        </div>
        <Progress value={score} className={color} />
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Legal Description Analyzer</CardTitle>
        <CardDescription>
          Advanced analysis of legal descriptions for Benton County, Washington properties
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="input" disabled={loading}>
            <FileText className="h-4 w-4 mr-2" />
            Input
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={loading || !analysis}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="parsed" disabled={loading || !parsedDescription}>
            <PieChart className="h-4 w-4 mr-2" />
            Parsed Data
          </TabsTrigger>
          <TabsTrigger value="visualization" disabled={loading || !visualization}>
            <Map className="h-4 w-4 mr-2" />
            Visualization
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="legal-description" className="text-sm font-medium">
                Legal Description
              </label>
              <Textarea
                id="legal-description"
                placeholder="Enter the legal description text from the Benton County property record..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                className="w-full resize-none font-mono text-sm"
              />
            </div>
            
            <Button 
              onClick={handleAnalyze} 
              disabled={loading || !description.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Analyze Legal Description
                </>
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="analysis" className="p-6">
          {analysis && (
            <div className="space-y-6">
              {renderValidationScore(analysis.validationScore)}
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Interpretation</h3>
                <p className="text-sm text-gray-700">{analysis.interpretation}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Boundary Description</h3>
                <p className="text-sm text-gray-700">{analysis.boundaryDescription}</p>
              </div>
              
              {analysis.issues.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Issues Found</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 text-sm space-y-1 mt-2">
                      {analysis.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              
              {analysis.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Recommendations</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {analysis.drawingInstructions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Drawing Instructions</h3>
                  <ol className="list-decimal pl-5 text-sm space-y-2">
                    {analysis.drawingInstructions.map((instruction, index) => (
                      <li key={index} className="pl-2">{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="parsed" className="p-6">
          {parsedDescription && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedDescription.section && (
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Section</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="font-medium">{parsedDescription.section}</p>
                    </CardContent>
                  </Card>
                )}
                
                {parsedDescription.township && (
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Township</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="font-medium">{parsedDescription.township}</p>
                    </CardContent>
                  </Card>
                )}
                
                {parsedDescription.range && (
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Range</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="font-medium">{parsedDescription.range}</p>
                    </CardContent>
                  </Card>
                )}
                
                {parsedDescription.lot && (
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Lot</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="font-medium">{parsedDescription.lot}</p>
                    </CardContent>
                  </Card>
                )}
                
                {parsedDescription.block && (
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Block</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="font-medium">{parsedDescription.block}</p>
                    </CardContent>
                  </Card>
                )}
                
                {parsedDescription.acreage && (
                  <Card>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">Acreage</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <p className="font-medium">{parsedDescription.acreage}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {parsedDescription.subdivision && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Subdivision</h3>
                  <p className="text-sm">{parsedDescription.subdivision}</p>
                </div>
              )}
              
              {parsedDescription.plat && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Plat</h3>
                  <p className="text-sm">{parsedDescription.plat}</p>
                </div>
              )}
              
              {parsedDescription.quarterSections && parsedDescription.quarterSections.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Quarter Sections</h3>
                  <div className="flex flex-wrap gap-1">
                    {parsedDescription.quarterSections.map((quarter, index) => (
                      <Badge key={index} variant="outline">{quarter}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {parsedDescription.boundaryPoints && parsedDescription.boundaryPoints.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Boundary Points</h3>
                  <div className="space-y-1">
                    {parsedDescription.boundaryPoints.map((point, index) => (
                      <div key={index} className="flex items-center">
                        <CornerDownRight className="h-3 w-3 mr-2 text-muted-foreground" />
                        <span className="text-sm">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium mb-1">Raw Description</h3>
                <div className="bg-gray-50 p-3 rounded-md border">
                  <p className="text-xs font-mono whitespace-pre-wrap">{parsedDescription.rawDescription}</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="visualization" className="p-6">
          {visualization && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm">Shape Type</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <p className="font-medium capitalize">{visualization.shapeType}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-sm">Estimated Area</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <p className="font-medium">{visualization.estimatedArea.toFixed(2)} acres</p>
                  </CardContent>
                </Card>
              </div>
              
              {visualization.coordinates && visualization.coordinates.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Coordinates</h3>
                  <div className="bg-gray-50 p-3 rounded-md border max-h-60 overflow-y-auto">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr>
                          <th className="text-left py-1">Point</th>
                          <th className="text-left py-1">Longitude</th>
                          <th className="text-left py-1">Latitude</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visualization.coordinates.map(([lng, lat], index) => (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="py-1">{index + 1}</td>
                            <td className="py-1">{lng.toFixed(6)}</td>
                            <td className="py-1">{lat.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {visualization.cardinalPoints && visualization.cardinalPoints.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Cardinal Directions</h3>
                  <div className="space-y-1">
                    {visualization.cardinalPoints.map((point, index) => (
                      <div key={index} className="flex items-center">
                        <CornerDownRight className="h-3 w-3 mr-2 text-muted-foreground" />
                        <span className="text-sm">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {visualization.geometry && (
                <div>
                  <h3 className="text-sm font-medium mb-2">GeoJSON Representation</h3>
                  <div className="bg-gray-50 p-3 rounded-md border max-h-60 overflow-y-auto">
                    <pre className="text-xs font-mono">
                      {JSON.stringify(visualization.geometry, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => setActiveTab('input')}
          disabled={loading}
        >
          Back to Input
        </Button>
        
        {visualization && (
          <Button
            onClick={() => onVisualizationGenerated?.(visualization)}
            disabled={loading}
          >
            <Map className="mr-2 h-4 w-4" />
            Show on Map
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}