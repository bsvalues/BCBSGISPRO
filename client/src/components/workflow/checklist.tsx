import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ChecklistItem } from "@shared/schema";
import { ChevronDown, ChevronUp } from "lucide-react";

type WorkflowChecklistProps = {
  workflowId: number;
  items: ChecklistItem[];
  showAll?: boolean;
};

export function WorkflowChecklist({ workflowId, items, showAll = false }: WorkflowChecklistProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(items);
  const [expanded, setExpanded] = useState(showAll);
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  
  useEffect(() => {
    setChecklistItems(items);
  }, [items]);
  
  const getCompletedCount = () => {
    return checklistItems.filter(item => item.completed).length;
  };
  
  const handleCheckItem = async (itemId: number, checked: boolean) => {
    setLoading(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const res = await apiRequest("PATCH", `/api/checklist-items/${itemId}`, { completed: checked });
      const updatedItem = await res.json();
      
      // Update local state
      setChecklistItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, completed: checked } : item
        )
      );
      
      // Invalidate cached data
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/checklist`] });
    } catch (error) {
      console.error("Error updating checklist item:", error);
    } finally {
      setLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };
  
  // Only show first 5 items when not expanded
  const visibleItems = expanded ? checklistItems : checklistItems.slice(0, 5);
  
  return (
    <div className="bg-white rounded-md shadow-sm border border-neutral-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-neutral-800">Workflow Checklist</h2>
        <span className="text-sm text-neutral-500">{getCompletedCount()} of {checklistItems.length} completed</span>
      </div>
      
      <div className="space-y-2">
        {visibleItems.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-start p-3 rounded-md border ${
              item.completed 
                ? "bg-primary-50 border-primary-200" 
                : "bg-neutral-50 border-neutral-200"
            }`}
          >
            <Checkbox 
              id={`check-${item.id}`} 
              checked={item.completed}
              disabled={loading[item.id]}
              onCheckedChange={(checked) => handleCheckItem(item.id, !!checked)}
              className="h-5 w-5 mt-0.5"
            />
            <div className="ml-3">
              <label 
                htmlFor={`check-${item.id}`} 
                className="text-sm font-medium text-neutral-800"
              >
                {item.title}
              </label>
              {item.description && (
                <p className="text-xs text-neutral-600 mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        ))}
        
        {!expanded && checklistItems.length > 5 && (
          <Button
            variant="ghost"
            className="mt-2 text-sm text-primary-600 hover:text-primary-800 flex items-center"
            onClick={() => setExpanded(true)}
          >
            <ChevronDown className="h-4 w-4 mr-1.5" />
            Show all checklist items
          </Button>
        )}
        
        {expanded && checklistItems.length > 5 && (
          <Button
            variant="ghost"
            className="mt-2 text-sm text-primary-600 hover:text-primary-800 flex items-center"
            onClick={() => setExpanded(false)}
          >
            <ChevronUp className="h-4 w-4 mr-1.5" />
            Show fewer items
          </Button>
        )}
      </div>
    </div>
  );
}
