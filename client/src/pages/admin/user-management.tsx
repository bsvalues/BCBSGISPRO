import React, { useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { useRbac, UserRole } from '../../context/rbac-context';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

// Mock user data for demonstration
const mockUsers = [
  { 
    id: 'email-1', 
    email: 'admin@bentoncounty.gov', 
    firstName: 'Admin', 
    lastName: 'User', 
    roles: ['admin'],
    provider: 'Email',
    lastLogin: '2023-05-21T14:30:45Z'
  },
  { 
    id: 'google-2', 
    email: 'staff@bentoncounty.gov', 
    firstName: 'Staff', 
    lastName: 'User', 
    roles: ['staff'],
    provider: 'Google',
    lastLogin: '2023-05-20T09:15:22Z'
  },
  { 
    id: 'github-3', 
    email: 'field@bentoncounty.gov', 
    firstName: 'Field', 
    lastName: 'User', 
    roles: ['field'],
    provider: 'GitHub',
    lastLogin: '2023-05-19T16:45:10Z'
  },
  { 
    id: 'email-4', 
    email: 'readonly@bentoncounty.gov', 
    firstName: 'Read', 
    lastName: 'Only', 
    roles: ['readonly'],
    provider: 'Email',
    lastLogin: '2023-05-18T11:20:33Z'
  }
];

const UserManagementPage: React.FC = () => {
  const { hasPermission } = useRbac();
  const [users, setUsers] = useState(mockUsers);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Check if user has permission to manage users
  const canManageUsers = hasPermission(['create', 'update', 'delete']);
  
  const handleAddUser = (userData: any) => {
    // In a real application, this would make an API call
    setUsers([...users, { ...userData, id: `email-${Date.now()}`, provider: 'Email', lastLogin: 'Never' }]);
    setIsAddUserDialogOpen(false);
  };
  
  const handleEditUser = (userData: any) => {
    // In a real application, this would make an API call
    setUsers(users.map(user => user.id === userData.id ? { ...user, ...userData } : user));
    setIsEditUserDialogOpen(false);
    setCurrentUser(null);
  };
  
  const formatDate = (dateString: string) => {
    if (dateString === 'Never') return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        {canManageUsers && (
          <Button onClick={() => setIsAddUserDialogOpen(true)}>
            Add New User
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Last Login</TableHead>
                {canManageUsers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.firstName} {user.lastName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roles.join(', ')}</TableCell>
                  <TableCell>{user.provider}</TableCell>
                  <TableCell>{formatDate(user.lastLogin)}</TableCell>
                  {canManageUsers && (
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setCurrentUser(user);
                          setIsEditUserDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Add User Dialog */}
      <AddUserDialog 
        isOpen={isAddUserDialogOpen} 
        onClose={() => setIsAddUserDialogOpen(false)} 
        onSubmit={handleAddUser} 
      />
      
      {/* Edit User Dialog */}
      {currentUser && (
        <EditUserDialog 
          isOpen={isEditUserDialogOpen} 
          onClose={() => {
            setIsEditUserDialogOpen(false);
            setCurrentUser(null);
          }} 
          onSubmit={handleEditUser}
          user={currentUser}
        />
      )}
    </div>
  );
};

interface AddUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
}

const AddUserDialog: React.FC<AddUserDialogProps> = ({ isOpen, onClose, onSubmit }) => {
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roles: ['public'] as UserRole[]
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(userData);
    // Reset form
    setUserData({
      firstName: '',
      lastName: '',
      email: '',
      roles: ['public'] as UserRole[]
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account and assign roles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                value={userData.firstName}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={userData.lastName}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select 
                value={userData.roles[0]} 
                onValueChange={(value) => setUserData({ ...userData, roles: [value as UserRole] })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="field">Field</SelectItem>
                  <SelectItem value="readonly">Read Only</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add User</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface EditUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  user: any;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ isOpen, onClose, onSubmit, user }) => {
  const [userData, setUserData] = useState({
    ...user,
    role: user.roles[0]
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...userData,
      roles: [userData.role]
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and role.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="edit-firstName"
                value={userData.firstName}
                onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="edit-lastName"
                value={userData.lastName}
                onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right">
                Role
              </Label>
              <Select 
                value={userData.role} 
                onValueChange={(value) => setUserData({ ...userData, role: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="field">Field</SelectItem>
                  <SelectItem value="readonly">Read Only</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementPage;