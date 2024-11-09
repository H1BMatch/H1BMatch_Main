import express, { Request, Response } from "express";
import * as userService from "../services/userService";
import * as resumeService from "../services/resumeService";
import { vectorizeText } from "../services/vectorService"; // Importing vectorization function
import {
  ClerkExpressRequireAuth,
  RequireAuthProp,
  StrictAuthProp,
} from "@clerk/clerk-sdk-node";
// import { updateUserResume } from '../services/userService';

const userRoutes = express.userRoutes();

// Middleware to protect routes (Clerk handles authentication)
userRoutes.use((req: Request, res: Response, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

// User routes
userRoutes.get("/user/:id", async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});

userRoutes.post("/user", async (req: Request, res: Response) => {
  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
});

// Resume routes
userRoutes.get("/resume/:id", async (req: Request, res: Response) => {
  try {
    const resume = await resumeService.getResumeById(req.params.id);
    res.status(200).json(resume);
  } catch (error) {
    res.status(500).json({ message: "Error fetching resume", error });
  }
});

userRoutes.post("/resume", async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || req.auth?.userId; // Retrieved from Clerk
    const vectorizedText = await vectorizeText(req.body.text); // Vectorize text

    const newResume = await resumeService.createResume({
      ...req.body,
      userId,
      vectorizedText,
    });
    res.status(201).json(newResume);
  } catch (error) {
    res.status(500).json({ message: "Error creating resume", error });
  }
});

userRoutes.put("/resume/:id", async (req: Request, res: Response) => {
  try {
    const vectorizedText = await vectorizeText(req.body.text); // Vectorize text

    const updatedResume = await resumeService.updateResume(req.params.id, {
      ...req.body,
      vectorizedText,
    });
    res.status(200).json(updatedResume);
  } catch (error) {
    res.status(500).json({ message: "Error updating resume", error });
  }
});

export default userRoutes;

// userRoutes.post(
//   "/add-resume",
//   ClerkExpressRequireAuth(),
//   async (req: Request, res: Response) => {
//     const userId = req.auth?.userId;
//     const { resume } = req.body;

//     if (!userId || !resume) {
//       return res
//         .status(400)
//         .json({ error: "User ID and new resume are required." });
//     }

//     try {
//       await upsertUserWithResume(userId, resume);
//       res.status(200).json({ message: "Resume updated successfully." });
//     } catch (error: any) {
//       console.error("Error updating resume:", error);
//       res.status(500).json({ error: error.message });
//     }
//   }
// );

// // Get User Profile
// userRoutes.get(
//   "/profile",
//   ClerkExpressRequireAuth(),
//   async (req: Request, res: Response) => {
//     try {
//       const userId = req.auth?.userId;
//       if (!userId) {
//         return res.status(401).json({ message: "Unauthorized" });
//       }

//       const userProfile = await getUserProfile(userId);
//       if (!userProfile) {
//         return res.status(404).json({ message: "User profile not found" });
//       }

//       res.status(200).json(userProfile);
//     } catch (error: any) {
//       console.error("Error fetching user profile:", error);
//       res.status(500).json({ error: "Failed to fetch user profile" });
//     }
//   }
// );

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

// export default userRoutes;
