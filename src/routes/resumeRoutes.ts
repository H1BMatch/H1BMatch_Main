import express, { Request, Response } from "express";
import * as resumeService from "../services/resumeService";
import { generateEmbedding } from "../services/vectorService"; 
import {
  ClerkExpressRequireAuth,
} from "@clerk/clerk-sdk-node";

const resumeRoutes = express.Router();

resumeRoutes.use((req: Request, res: Response, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

resumeRoutes.get(
  "/resume",
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response) => {
    try {
      const resume = await resumeService.getResumeByClerkId(req.auth.userId ?? '');
      res.status(200).json(resume);
    } catch (error) {
      res.status(500).json({ message: "Error fetching resume", error });
    }
  }
);

resumeRoutes.post(
  "/resume",
  ClerkExpressRequireAuth(),
  async (req: Request, res: Response) => {
    try {
      const vectorizedText = await generateEmbedding(req.body.resume); 

      const updatedResume = await resumeService.updateResume(req.auth.userId ?? '', {
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