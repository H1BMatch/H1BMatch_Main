import express, { Request, Response } from "express";
import * as userService from "../services/userService";
import containerClient  from "../utils/connectToAzureBlobStorage";
const multer = require("multer");
import { v4 as uuidv4 } from "uuid";

import {
  ClerkExpressRequireAuth,
} from "@clerk/clerk-sdk-node";

const userRoutes = express.Router();

userRoutes.use((req: Request, res: Response, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

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

// user routes to post the profile picture for the user

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("profilePicture");
// file might not be recognized as a property of Request. So extend it to include the file as the multer request type.
interface MulterRequest extends Request {
  file: any;
}
userRoutes.post(
  "/upload-profile-picture",
  ClerkExpressRequireAuth(),
  upload,
  async (req: Request, res: Response) => {
    try {
      const userId: string = req.auth.userId!; // Guaranteed to exist due to ClerkExpressRequireAuth
      console.log("inside the user profile picture upload");
      const documentFile = (req as MulterRequest).file;

      if (!documentFile) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageBuffer = documentFile.buffer;
      const imageType = documentFile.mimetype;

      // Validate MIME type (allow only images)
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedMimeTypes.includes(imageType)) {
        return res.status(400).json({ message: "Invalid file type. Please upload an image." });
      }

      // Generate secure, unique file name
      const imageName = `${uuidv4()}-${Date.now()}`;

      // Upload the image to Azure Blob Storage
      await containerClient.uploadBlockBlob(imageName, imageBuffer, imageBuffer.length);

      // Get the blob's public URL
      const blobUrl: string = containerClient.getBlockBlobClient(imageName).url;

      // Update the user's profile picture URL in the database
      await userService.updateUserProfilePictureUrl(userId, blobUrl);

      res.status(200).json({
        message: "Profile picture uploaded successfully",
        profileUrl: blobUrl,
      });
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);



//get the user profile information
userRoutes.get('/profile',ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
  try {
    const user: string = req.auth.userId ?? '';
    const profileInfo  = await userService.getUserProfile(user); 
    console.log(profileInfo);
    res.status(200).json(profileInfo);
  }
  catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
 });

export default userRoutes;

