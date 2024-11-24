import express, { Request, Response } from "express";
import * as userService from "../services/userService";
import containerClient from "../utils/connectToAzureBlobStorage";
const multer = require("multer");


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
  "/upload-profile-picture", upload,
  async (req: Request, res: Response) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const documentFile = (req as MulterRequest).file;
      if (!documentFile) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const imageBuffer = documentFile.buffer;
      const imageType = documentFile.mimetype;
      // we might need to change how we name the image file. Can user ID but wont be a good idea security wise. The name for the image need to be unique.
      const imageName = documentFile.originalname + Date.now();

      //upload the imageBuffer to the azure blobStorage
      await containerClient.uploadBlockBlob(imageName, imageBuffer, imageType);

      const blobUrl = containerClient.getBlockBlobClient(imageName).url;
      // update the user profile picture URL in the database
      await updateUserProfilePictureUrl(userId, blobUrl);

      res
        .status(200)
        .json({
          message: "Profile picture uploaded successfully",
          profileUrl: blobUrl,
        });
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ error: "Failed to upload profile picture" });
    }
  }
);

export default userRoutes;