import express, { Request, Response } from "express";
import * as resumeService from "../services/resumeService";
import { generateEmbedding } from "../services/vectorService"; // Importing vectorization function
import {
  ClerkExpressRequireAuth,
} from "@clerk/clerk-sdk-node";
// import { updateUserResume } from '../services/userService';

const resumeRoutes = express.Router();

// Middleware to protect routes (Clerk handles authentication)
resumeRoutes.use((req: Request, res: Response, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

// Resume routes
resumeRoutes.get(
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

resumeRoutes.post(
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

export default resumeRoutes;