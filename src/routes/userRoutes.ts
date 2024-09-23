// src/routes/userRoutes.ts

import express, { Request, Response } from 'express';
import { registerUser, authenticateUser } from '../services/userService';
import jwt from 'jsonwebtoken';
import { IUser } from '../models/User';
import { IUserRegistration } from '../models/UserRegistration';

const userRoutes = express.Router();


// User Registration
userRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const userData: IUserRegistration = req.body;
    const user = await registerUser(userData);
    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error: any) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// User Login
userRoutes.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await authenticateUser(email, password);
    if (user) {
      // Verify JWT_SECRET is defined
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful', token });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

export default userRoutes;
