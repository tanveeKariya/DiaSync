import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    // Get token from cookies or header
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.startsWith('Bearer') 
                    ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'diasyncsecret');
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is valid, but user no longer exists' });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid or has expired' });
  }
};

export const doctor = async (req, res, next) => {
  try {
    const { accessCode } = req.params;
    const { userId } = req.body;
    
    if (!accessCode || !userId) {
      return res.status(400).json({ message: 'Access code and user ID are required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    
    if (user.doctor && user.doctor.accessCode === accessCode) {
      req.patient = user;
      next();
    } else {
      return res.status(401).json({ message: 'Invalid access code' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};