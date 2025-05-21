/**
 * Users API Routes
 * 
 * This module implements the API routes for user-related operations.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Mock data store - will be replaced with database in future
const users = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@terrafusion.example',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    counties: ['benton-county', 'yakima-county'], // Has access to all counties
    department: 'Administration',
    title: 'System Administrator',
    active: true,
    lastLogin: new Date('2023-11-28T14:35:42Z').toISOString(),
    preferences: {
      theme: 'light',
      mapProvider: 'mapbox',
      defaultCounty: 'benton-county',
      notifications: {
        email: true,
        sms: false,
        inApp: true
      }
    },
    metadata: {
      createdBy: 'system',
      notes: 'Initial admin user'
    },
    createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2023-11-28T14:35:42Z').toISOString()
  },
  {
    id: 'user-2',
    username: 'sarahjohnson',
    email: 'sarah.johnson@example.gov',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'assessor',
    counties: ['benton-county'], // Only has access to Benton County
    department: 'Assessor\'s Office',
    title: 'County Assessor',
    active: true,
    lastLogin: new Date('2023-11-27T09:12:18Z').toISOString(),
    preferences: {
      theme: 'dark',
      mapProvider: 'arcgis',
      defaultCounty: 'benton-county',
      notifications: {
        email: true,
        sms: true,
        inApp: true
      }
    },
    metadata: {},
    createdAt: new Date('2023-01-15T15:30:00Z').toISOString(),
    updatedAt: new Date('2023-11-27T09:12:18Z').toISOString()
  },
  {
    id: 'user-3',
    username: 'robertchen',
    email: 'robert.chen@example.gov',
    firstName: 'Robert',
    lastName: 'Chen',
    role: 'assessor',
    counties: ['yakima-county'], // Only has access to Yakima County
    department: 'Assessor\'s Office',
    title: 'County Assessor',
    active: true,
    lastLogin: new Date('2023-11-25T11:45:37Z').toISOString(),
    preferences: {
      theme: 'light',
      mapProvider: 'leaflet',
      defaultCounty: 'yakima-county',
      notifications: {
        email: true,
        sms: false,
        inApp: true
      }
    },
    metadata: {},
    createdAt: new Date('2023-02-20T08:45:00Z').toISOString(),
    updatedAt: new Date('2023-11-25T11:45:37Z').toISOString()
  },
  {
    id: 'user-4',
    username: 'mikewilliams',
    email: 'mike.williams@example.gov',
    firstName: 'Mike',
    lastName: 'Williams',
    role: 'viewer',
    counties: ['benton-county', 'yakima-county'], // Can view multiple counties
    department: 'IT',
    title: 'GIS Specialist',
    active: true,
    lastLogin: new Date('2023-11-28T10:22:05Z').toISOString(),
    preferences: {
      theme: 'system',
      mapProvider: 'mapbox',
      defaultCounty: 'benton-county',
      notifications: {
        email: false,
        sms: false,
        inApp: true
      }
    },
    metadata: {},
    createdAt: new Date('2023-03-10T13:15:00Z').toISOString(),
    updatedAt: new Date('2023-11-28T10:22:05Z').toISOString()
  },
  {
    id: 'user-5',
    username: 'lisarodriguez',
    email: 'lisa.rodriguez@example.gov',
    firstName: 'Lisa',
    lastName: 'Rodriguez',
    role: 'county-admin',
    counties: ['benton-county'], // Only admin for Benton County
    department: 'Administration',
    title: 'County IT Manager',
    active: false, // Inactive user
    lastLogin: new Date('2023-10-15T16:08:42Z').toISOString(),
    preferences: {
      theme: 'light',
      mapProvider: 'arcgis',
      defaultCounty: 'benton-county',
      notifications: {
        email: true,
        sms: true,
        inApp: true
      }
    },
    metadata: {
      deactivatedReason: 'On extended leave',
      deactivatedDate: '2023-11-01'
    },
    createdAt: new Date('2023-02-05T09:30:00Z').toISOString(),
    updatedAt: new Date('2023-11-01T00:00:00Z').toISOString()
  }
];

// Helper function to remove sensitive data before returning user object
function sanitizeUser(user) {
  const { ...sanitizedUser } = user;
  return sanitizedUser;
}

// GET all users with filtering
router.get('/', (req, res) => {
  const {
    role,
    countyId,
    search,
    active
  } = req.query;
  
  let filteredUsers = [...users];
  
  // Apply filters
  if (role) {
    filteredUsers = filteredUsers.filter(user => user.role === role);
  }
  
  if (countyId) {
    filteredUsers = filteredUsers.filter(user => 
      user.counties && user.counties.includes(String(countyId))
    );
  }
  
  if (search) {
    const searchTerm = String(search).toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm))
    );
  }
  
  if (active !== undefined) {
    const isActive = active === 'true';
    filteredUsers = filteredUsers.filter(user => user.active === isActive);
  }
  
  // Apply pagination
  const limit = req.query.limit ? parseInt(String(req.query.limit)) : 10;
  const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
  
  const paginatedUsers = filteredUsers.slice(offset, offset + limit);
  
  // Sanitize users
  const sanitizedUsers = paginatedUsers.map(user => sanitizeUser(user));
  
  res.json({
    success: true,
    data: sanitizedUsers,
    meta: {
      total: filteredUsers.length,
      limit,
      offset
    }
  });
});

// GET specific user by ID
router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `User with ID ${req.params.id} not found`
      }
    });
  }
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(user);
  
  res.json({
    success: true,
    data: sanitizedUser
  });
});

// GET current authenticated user
router.get('/me', (req, res) => {
  // In a real app, this would get the user from the session or token
  // For now, just return a mock current user
  const currentUser = users[0]; // Assume first user is logged in
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(currentUser);
  
  res.json({
    success: true,
    data: sanitizedUser
  });
});

// POST create a new user
router.post('/', (req, res) => {
  const {
    username,
    email,
    password, // Note: In a real app, would need to hash this
    firstName,
    lastName,
    role,
    counties,
    department,
    title,
    active = true,
    preferences = {},
    metadata = {}
  } = req.body;
  
  // Check for required fields
  if (!username || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'username, email, password, and role are required'
      }
    });
  }
  
  // Check if username or email already exists
  if (users.some(u => u.username === username)) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'USERNAME_EXISTS',
        message: `Username ${username} already exists`
      }
    });
  }
  
  if (users.some(u => u.email === email)) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: `Email ${email} already exists`
      }
    });
  }
  
  // Create new user
  const newUser = {
    id: `user-${uuidv4().substring(0, 8)}`,
    username,
    email,
    firstName,
    lastName,
    role,
    counties,
    department,
    title,
    active,
    lastLogin: null,
    preferences,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(newUser);
  
  res.status(201).json({
    success: true,
    data: sanitizedUser
  });
});

// PATCH update a user
router.patch('/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `User with ID ${req.params.id} not found`
      }
    });
  }
  
  // Don't allow updating username
  if (req.body.username) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Username cannot be changed'
      }
    });
  }
  
  // Check if email is being changed and already exists
  if (req.body.email && req.body.email !== users[userIndex].email && 
      users.some(u => u.email === req.body.email)) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'EMAIL_EXISTS',
        message: `Email ${req.body.email} already exists`
      }
    });
  }
  
  // Update user with request body data
  users[userIndex] = {
    ...users[userIndex],
    ...req.body,
    id: req.params.id, // Ensure ID doesn't change
    username: users[userIndex].username, // Ensure username doesn't change
    updatedAt: new Date().toISOString()
  };
  
  // If updating preferences, merge rather than replace
  if (req.body.preferences) {
    users[userIndex].preferences = {
      ...users[userIndex].preferences,
      ...req.body.preferences
    };
  }
  
  // If updating metadata, merge rather than replace
  if (req.body.metadata) {
    users[userIndex].metadata = {
      ...users[userIndex].metadata,
      ...req.body.metadata
    };
  }
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(users[userIndex]);
  
  res.json({
    success: true,
    data: sanitizedUser
  });
});

// DELETE a user
router.delete('/:id', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.id);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `User with ID ${req.params.id} not found`
      }
    });
  }
  
  users.splice(userIndex, 1);
  
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// PATCH update current user profile
router.patch('/me/profile', (req, res) => {
  // In a real app, this would get the user from the session or token
  // For now, just update the first user
  const userIndex = 0;
  
  const allowedFields = ['firstName', 'lastName', 'email', 'preferences'];
  const updates = {};
  
  // Only allow updating specific fields
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  // Update user
  users[userIndex] = {
    ...users[userIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // If updating preferences, merge rather than replace
  if (req.body.preferences) {
    users[userIndex].preferences = {
      ...users[userIndex].preferences,
      ...req.body.preferences
    };
  }
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(users[userIndex]);
  
  res.json({
    success: true,
    data: sanitizedUser
  });
});

// POST change user password
router.post('/me/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  // In a real app, this would get the user from the session or token
  // and verify the current password
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'currentPassword and newPassword are required'
      }
    });
  }
  
  // Mock password change
  res.json({
    success: true,
    data: {
      success: true
    }
  });
});

// POST add county access to user
router.post('/:userId/counties/:countyId', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `User with ID ${req.params.userId} not found`
      }
    });
  }
  
  // Initialize counties array if it doesn't exist
  if (!users[userIndex].counties) {
    users[userIndex].counties = [];
  }
  
  // Add county if not already in the list
  if (!users[userIndex].counties.includes(req.params.countyId)) {
    users[userIndex].counties.push(req.params.countyId);
    users[userIndex].updatedAt = new Date().toISOString();
  }
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(users[userIndex]);
  
  res.json({
    success: true,
    data: sanitizedUser
  });
});

// DELETE remove county access from user
router.delete('/:userId/counties/:countyId', (req, res) => {
  const userIndex = users.findIndex(u => u.id === req.params.userId);
  
  if (userIndex === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `User with ID ${req.params.userId} not found`
      }
    });
  }
  
  // Remove county if it exists in the list
  if (users[userIndex].counties) {
    const countyIndex = users[userIndex].counties.indexOf(req.params.countyId);
    if (countyIndex !== -1) {
      users[userIndex].counties.splice(countyIndex, 1);
      users[userIndex].updatedAt = new Date().toISOString();
    }
  }
  
  // Sanitize user
  const sanitizedUser = sanitizeUser(users[userIndex]);
  
  res.json({
    success: true,
    data: sanitizedUser
  });
});

// GET user activity logs
router.get('/:userId/activity', (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: `User with ID ${req.params.userId} not found`
      }
    });
  }
  
  // Mock activity logs
  const activityLogs = [
    {
      id: 'act-1',
      userId: user.id,
      action: 'login',
      resource: 'system',
      timestamp: user.lastLogin,
      details: {
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0'
      }
    },
    {
      id: 'act-2',
      userId: user.id,
      action: 'view',
      resource: 'parcel',
      resourceId: 'parcel-1',
      timestamp: new Date(new Date(user.lastLogin).getTime() + 5 * 60 * 1000).toISOString(),
      details: {
        method: 'GET',
        path: '/api/parcels/parcel-1'
      }
    },
    {
      id: 'act-3',
      userId: user.id,
      action: 'update',
      resource: 'layer',
      resourceId: 'layer-1',
      timestamp: new Date(new Date(user.lastLogin).getTime() + 15 * 60 * 1000).toISOString(),
      details: {
        method: 'PATCH',
        path: '/api/layers/layer-1/style',
        changes: {
          'style.fillColor': {
            old: '#99CCFF',
            new: '#AADDFF'
          }
        }
      }
    }
  ];
  
  res.json({
    success: true,
    data: activityLogs
  });
});

export default router;