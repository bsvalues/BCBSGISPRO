import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Document } from "@shared/schema";
import { Eye, UploadCloud, FilePlus, FileText } from "lucide-react";

type DocumentUploaderProps = {
  workflowId: number;
  documents: Document[];
  onViewDocument?: (doc: Document) => void;
};

export function DocumentUploader({ workflowId, documents, onViewDocument }: DocumentUploaderProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setUploading(true);
    
    try {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // In a real implementation, this would use FormData to upload the actual file
        // Here we're just simulating by sending the file name and a placeholder content value
        const response = await apiRequest("POST", `/api/workflows/${workflowId}/documents`, {
          name: file.name,
          type: file.type,
          content: "document-content-placeholder",
        });
        
        const newDocument = await response.json();
        
        // Invalidate documents cache
        queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
        
        toast({
          title: "Document uploaded",
          description: `Successfully uploaded ${file.name}`,
        });
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "An error occurred while reading the file",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Clear the input
      event.target.value = "";
    }
  };
  
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="text-primary-500" />;
    return <FileText className="text-primary-500" />;
  };
  
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-neutral-800">Required Documents</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="p-2 bg-primary-50 rounded-md border border-primary-200 flex items-center">
            {getFileIcon(doc.type)}
            <div className="flex-1 ml-2.5">
              <p className="text-sm font-medium text-primary-800">{doc.name}</p>
              <p className="text-xs text-neutral-500">Uploaded {formatDate(doc.uploadedAt)}</p>
            </div>
            <Button
              variant="ghost" 
              size="icon" 
              className="text-neutral-400 hover:text-neutral-600"
              onClick={() => onViewDocument && onViewDocument(doc)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        <label className="p-2 rounded-md border border-neutral-300 border-dashed flex items-center justify-center text-neutral-500 hover:bg-neutral-50 cursor-pointer h-20">
          <input 
            type="file" 
            className="hidden" 
            onChange={handleUpload}
            disabled={uploading}
          />
          <div className="text-center">
            <UploadCloud className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs">{uploading ? "Uploading..." : "Upload documents"}</p>
          </div>
        </label>
        
        <Button
          variant="outline" 
          className="w-full bg-white text-primary-600 border-primary-200 hover:bg-primary-50 flex items-center justify-center"
          disabled={uploading}
        >
          <FilePlus className="h-4 w-4 mr-1.5" /> Upload More Documents
        </Button>
      </CardContent>
    </Card>
  );
}
