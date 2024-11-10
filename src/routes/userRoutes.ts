import express, { Request, Response } from "express";
import * as userService from "../services/userService";
import * as resumeService from "../services/resumeService";
import { generateEmbedding } from "../services/vectorService"; // Importing vectorization function
import {
  ClerkExpressRequireAuth,
  RequireAuthProp,
  StrictAuthProp,
} from "@clerk/clerk-sdk-node";
// import { updateUserResume } from '../services/userService';

const userRoutes = express.Router();

// Middleware to protect routes (Clerk handles authentication)
userRoutes.use((req: Request, res: Response, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

// User routes
userRoutes.get(
  "/user/:id",
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response) => {
    try {
      const user = await userService.getClerkId(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  }
);

userRoutes.post(
  "/user",
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response) => {
    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ message: "Error creating user", error });
    }
  }
);

// Resume routes
userRoutes.get(
  "/resume/:id",
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response) => {
    try {
      const resume = await resumeService.getResumeByClerkId(req.params.id);
      res.status(200).json(resume);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resume", error });
    }
  }
);

userRoutes.post(
  "/resume/:id",
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response) => {
    try {
      const vectorizedText = await generateEmbedding(req.body.resume); // Vectorize text

      const updatedResume = await resumeService.updateResume(req.params.id, {
        ...req.body,
        vectorizedText,
      });
      res.status(200).json(updatedResume);
    } catch (error) {
      res.status(500).json({ message: "Error updating resume", error });
    }
  }
);

export default userRoutes;