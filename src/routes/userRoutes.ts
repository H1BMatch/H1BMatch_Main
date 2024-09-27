import express, { Request, Response } from 'express';
import { getUserProfile, upsertUserWithResume } from '../services/userService';
import { ClerkExpressRequireAuth, RequireAuthProp, StrictAuthProp } from '@clerk/clerk-sdk-node'
// import { updateUserResume } from '../services/userService';

const userRoutes = express.Router();

// Middleware to protect routes (Clerk handles authentication)
userRoutes.use((req: Request, res: Response, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
});


userRoutes.post('/add-resume', ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  const {resume} = req.body;

  if (!userId || !resume) {
    return res.status(400).json({ error: 'User ID and new resume are required.' });
  }

  try {
    await upsertUserWithResume(userId, resume);
    res.status(200).json({ message: 'Resume updated successfully.' });
  } catch (error: any) {
    console.error('Error updating resume:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get User Profile
userRoutes.get('/profile',  ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.status(200).json(userProfile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Create or Update User Profile
// userRoutes.post('/profile', async (req: Request, res: Response) => {
//   try {
//     const userId = req.auth?.userId;
//     const { resume_text } = req.body;

//     if (!userId) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const userProfile = await createUserWithResume(userId, resume_text);
//     res.status(201).json({ message: 'User profile created or updated', userProfile });
//   } catch (error: any) {
//     console.error('Error creating or updating user profile:', error);
//     res.status(500).json({ error: 'Failed to create or update user profile' });
//   }
// });

export default userRoutes;
