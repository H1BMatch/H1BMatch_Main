import express, { Request, Response } from "express";
import * as userService from "../services/userService";
import {
  ClerkExpressRequireAuth,
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
  "/user",
  ClerkExpressRequireAuth(),
  async (req, res: Response) => {
    try {
      const user = await userService.getClerkId(req.auth.userId ?? '');
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user", error });
    }
  }
);

export default userRoutes;