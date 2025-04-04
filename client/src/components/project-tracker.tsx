import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertCircle } from 'lucide-react';

export interface ProjectFeature {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  progress: number; // 0-100
}

export interface ProjectTrackerProps {
  projectName: string;
  projectDescription: string;
  features: ProjectFeature[];
}

export function ProjectTracker({
  projectName,
  projectDescription,
  features
}: ProjectTrackerProps) {
  const completedFeatures = features.filter(f => f.status === 'completed').length;
  const inProgressFeatures = features.filter(f => f.status === 'in-progress').length;
  const plannedFeatures = features.filter(f => f.status === 'planned').length;
  
  const totalProgress = Math.round(
    features.reduce((sum, feature) => sum + feature.progress, 0) / features.length
  );
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{projectName}</span>
          <Badge variant="outline" className="ml-2 text-sm">
            {totalProgress}% Complete
          </Badge>
        </CardTitle>
        <CardDescription>{projectDescription}</CardDescription>
        <Progress value={totalProgress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <Badge variant="secondary" className="mr-2">
                <Check className="h-3 w-3 mr-1" />
                {completedFeatures} Completed
              </Badge>
            </div>
            <div className="flex items-center">
              <Badge variant="secondary" className="mr-2">
                <Clock className="h-3 w-3 mr-1" />
                {inProgressFeatures} In Progress
              </Badge>
            </div>
            <div className="flex items-center">
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                {plannedFeatures} Planned
              </Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            {features.map((feature) => (
              <div key={feature.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium flex items-center">
                    {feature.status === 'completed' && (
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                    )}
                    {feature.status === 'in-progress' && (
                      <Clock className="h-4 w-4 text-orange-500 mr-2" />
                    )}
                    {feature.status === 'planned' && (
                      <AlertCircle className="h-4 w-4 text-gray-500 mr-2" />
                    )}
                    {feature.name}
                  </h3>
                  <Badge
                    variant={
                      feature.status === 'completed' 
                        ? 'default' 
                        : feature.status === 'in-progress' 
                          ? 'secondary' 
                          : 'outline'
                    }
                  >
                    {feature.status === 'completed' 
                      ? 'Completed' 
                      : feature.status === 'in-progress' 
                        ? 'In Progress' 
                        : 'Planned'
                    }
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <Progress value={feature.progress} className="h-1 mt-2" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}