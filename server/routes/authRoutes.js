// server/routes/authRoutes.js

import express from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Your main User model (now contains all profile fields)
import { auth } from '../middleware/auth.js'; // Your authentication middleware

const router = express.Router();

// Helper function to generate and send token
const generateTokenAndSend = (user, res) => {
    const payload = { id: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'diasyncsecret', { expiresIn: '7d' });

    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data (without password)
    const userData = { ...user.toObject() };
    delete userData.password; // Remove password from the response

    return { user: userData, token };
};

// --- Register a new user ---
router.post('/register', [
    body('name').not().isEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('diabetesType').optional().isIn(['Type 1', 'Type 2', 'Gestational', 'Other']).withMessage('Valid diabetes type is required'),
    body('dateOfDiagnosis').optional().isISO8601().toDate().withMessage('Valid date of diagnosis is required'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, diabetesType, dateOfDiagnosis } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create new user with all initial profile fields
        user = new User({
            name,
            email,
            password,
            diabetesType: diabetesType || 'Type 1',
            dateOfDiagnosis: dateOfDiagnosis ? new Date(dateOfDiagnosis) : new Date(),
            // Other profile fields will default to their schema defaults
        });

        await user.save();

        const { user: userData, token } = generateTokenAndSend(user, res);

        res.status(201).json({
            message: 'User registered successfully',
            user: userData,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Login user ---
router.post('/login', [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const { user: userData, token } = generateTokenAndSend(user, res);

        res.json({
            message: 'Login successful',
            user: userData,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Get current user (full profile) ---
router.get('/me', auth, async (req, res) => {
    try {
        // req.user contains the user document from the auth middleware,
        // which now includes all profile details.
        // We just need to remove the password before sending.
        const user = { ...req.user.toObject() };
        delete user.password;

        // Ensure dateOfDiagnosis is formatted for frontend display if it exists
        if (user.dateOfDiagnosis) {
            user.dateOfDiagnosis = new Date(user.dateOfDiagnosis).toISOString().split('T')[0];
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Logout user ---
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logout successful' });
});

// --- Update user profile (all fields on the User model) ---
router.put('/profile', auth, async (req, res) => {
    const {
        name,
        email,
        diabetesType,
        dateOfDiagnosis,
        insulinType,
        targetGlucoseRange,
        doctor,
        emergencyContacts,
        settings
    } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // --- Update main User model fields ---
        if (name !== undefined) user.name = name;

        if (email !== undefined && email !== user.email) {
            const existingUserWithEmail = await User.findOne({ email });
            if (existingUserWithEmail && String(existingUserWithEmail._id) !== String(user._id)) {
                return res.status(400).json({ message: 'Email already in use.' });
            }
            user.email = email;
        }

        // --- Update profile fields (directly on the User model) ---
        if (diabetesType !== undefined) user.diabetesType = diabetesType;
        if (dateOfDiagnosis !== undefined) {
            user.dateOfDiagnosis = dateOfDiagnosis ? new Date(dateOfDiagnosis) : null;
        }
        if (insulinType !== undefined) user.insulinType = insulinType;
        if (targetGlucoseRange !== undefined) user.targetGlucoseRange = targetGlucoseRange;
        if (doctor !== undefined) user.doctor = doctor;
        if (emergencyContacts !== undefined) {
            // Validate and limit emergency contacts if needed by your schema rules
            user.emergencyContacts = emergencyContacts.slice(0, 2); // Assuming max 2 contacts, adjust if your schema allows more
        }
        if (settings !== undefined) {
            // Merge settings to allow partial updates without overwriting untouched fields
            user.settings = { ...user.settings, ...settings };
        }

        await user.save();

        // Get updated user data and remove password for response
        const updatedUser = { ...user.toObject() };
        delete updatedUser.password;

        // Ensure dateOfDiagnosis is formatted for frontend display
        if (updatedUser.dateOfDiagnosis) {
            updatedUser.dateOfDiagnosis = new Date(updatedUser.dateOfDiagnosis).toISOString().split('T')[0];
        }

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Update user password (separate route for security) ---
router.put('/password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect.' });
        }

        user.password = newPassword; // Mongoose pre-save hook will hash it
        await user.save();

        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;