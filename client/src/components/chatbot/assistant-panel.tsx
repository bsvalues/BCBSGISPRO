import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { Bot, Send, ExternalLink } from "lucide-react";

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
};

type AssistantPanelProps = {
  title?: string;
  showResourceLinks?: boolean;
};

export function AssistantPanel({ 
  title = "Need Help?", 
  showResourceLinks = true 
}: AssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages([...messages, userMessage]);
    setInputValue("");
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/chatbot/query", { query: inputValue });
      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.answer,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error querying assistant:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-neutral-800">{title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {showResourceLinks && (
          <div className="text-sm text-neutral-600 mb-3">
            <p>Not sure what to do next? Check these resources:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
              <li>
                <a href="#" className="text-primary-600 hover:underline flex items-center">
                  <span>Long Plat Processing Guide</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-600 hover:underline flex items-center">
                  <span>Parcel ID Numbering Rules</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-600 hover:underline flex items-center">
                  <span>Legal Description Samples</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </li>
            </ul>
          </div>
        )}
        
        <div className="p-3 bg-secondary-50 rounded-md">
          <div className="flex items-start">
            <Bot className="h-4 w-4 text-secondary-600 mt-0.5 mr-2" />
            <div>
              <p className="text-xs font-medium text-secondary-800">Ask the Assistant</p>
              
              {messages.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto mb-2 space-y-2">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`text-xs p-2 rounded ${
                        msg.sender === 'user' 
                          ? 'bg-white text-neutral-800 ml-4'
                          : 'bg-secondary-100 text-secondary-800 mr-4'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="mt-2 flex">
                <Input
                  type="text"
                  className="flex-1 text-xs px-2 py-1 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-secondary-500 focus:border-secondary-500"
                  placeholder="How do I process a long plat?"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  type="submit"
                  className="bg-secondary-500 text-white rounded-r-md px-2 py-1 text-xs font-medium hover:bg-secondary-600"
                  disabled={isLoading}
                >
                  <Send className="h-3 w-3" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
