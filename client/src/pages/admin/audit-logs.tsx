import React, { useState, useEffect } from 'react';
import { useRbac } from '../../context/rbac-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination';

// Mock audit log data for demonstration
const mockAuditLogs = [
  {
    id: 1,
    userId: 'email-1',
    action: 'login_success',
    details: { provider: 'Email' },
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timestamp: '2023-05-21T10:30:45Z'
  },
  {
    id: 2,
    userId: 'google-2',
    action: 'role_change',
    details: { 
      targetUserId: 'email-4',
      oldRoles: ['readonly'],
      newRoles: ['staff']
    },
    ipAddress: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    timestamp: '2023-05-20T15:22:33Z'
  },
  {
    id: 3,
    userId: 'email-1',
    action: 'user_creation',
    details: {
      newUserId: 'email-5',
      roles: ['field']
    },
    ipAddress: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timestamp: '2023-05-19T09:15:10Z'
  },
  {
    id: 4,
    userId: null,
    action: 'login_failure',
    details: { reason: 'Invalid credentials' },
    ipAddress: '192.168.1.4',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    timestamp: '2023-05-18T14:45:22Z'
  },
  {
    id: 5,
    userId: 'github-3',
    action: 'password_reset_request',
    ipAddress: '192.168.1.5',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    timestamp: '2023-05-17T11:33:45Z'
  }
];

// Mock user data for display purposes
const mockUserMap = {
  'email-1': { name: 'Admin User' },
  'google-2': { name: 'Staff User' },
  'github-3': { name: 'Field User' },
  'email-4': { name: 'Read Only' },
  'email-5': { name: 'New Field User' }
};

const AuditLogsPage: React.FC = () => {
  const { hasPermission } = useRbac();
  const [logs, setLogs] = useState(mockAuditLogs);
  const [filteredLogs, setFilteredLogs] = useState(logs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;
  
  // Check if user has permission to view audit logs
  const canViewAuditLogs = hasPermission(['read']);
  
  // Filter logs based on search term and action filter
  useEffect(() => {
    let filtered = logs;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        (log.userId && log.userId.toLowerCase().includes(term)) ||
        log.action.toLowerCase().includes(term) ||
        log.ipAddress.toLowerCase().includes(term)
      );
    }
    
    // Filter by action type
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, actionFilter, logs]);
  
  // Get current logs for pagination
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  
  // Format timestamp to readable date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Get user name from user ID
  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unknown';
    return mockUserMap[userId as keyof typeof mockUserMap]?.name || userId;
  };
  
  // Format action for display
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get unique action types for filter
  const actionTypes = ['all', ...new Set(logs.map(log => log.action))];
  
  if (!canViewAuditLogs) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Unauthorized</h1>
        <p>You don't have permission to view audit logs.</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Security Audit Logs</h1>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by user, action, or IP"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={actionFilter}
            onValueChange={setActionFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map(action => (
                <SelectItem key={action} value={action}>
                  {action === 'all' ? 'All Actions' : formatAction(action)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Button variant="outline">Export Logs</Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>
            Security and compliance audit log of all system activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.length > 0 ? (
                currentLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>{getUserName(log.userId)}</TableCell>
                    <TableCell>{formatAction(log.action)}</TableCell>
                    <TableCell>{log.ipAddress}</TableCell>
                    <TableCell>
                      {log.details ? (
                        <div className="max-w-xs truncate">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}: </span>
                              {typeof value === 'object' 
                                ? JSON.stringify(value) 
                                : String(value)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">No details</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <Button
                        variant={currentPage === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <Button 
                      variant="outline"
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;