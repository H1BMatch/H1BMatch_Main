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
      const userId: string = req.auth.userId!;
      const documentFile = (req as MulterRequest).file;

      if (!documentFile) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const imageBuffer = documentFile.buffer;
      const imageType = documentFile.mimetype;

      // Validate MIME type
      const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!allowedMimeTypes.includes(imageType)) {
        return res.status(400).json({ message: "Invalid file type. Please upload an image." });
      }

      // Generate unique file name with extension
      const fileExtension = imageType.split("/")[1];
      const imageName = `${uuidv4()}-${Date.now()}.${fileExtension}`;

      // Upload the image with MIME type
      const blobClient = containerClient.getBlockBlobClient(imageName);
      await blobClient.uploadData(imageBuffer, {
        blobHTTPHeaders: { blobContentType: imageType },
      });

      // Get the blob's public URL
      const blobUrl: string = blobClient.url;

      // Update user's profile picture in the database
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


// update the user Bio

userRoutes.post('/update-bio', ClerkExpressRequireAuth(), async (req: Request, res: Response) => { 
  try {
    // user id form the auth object is the clerk id
    const user: string = req.auth.userId ?? '';
    const bio: string = req.body.bio;
    const updatedBio = await userService.updateUserBio(user, bio);
    if (!updatedBio) {
      return res.status(500).json({ message: "Error updating bio" });
    }
    res.status(200).json(updatedBio);
  } catch (error) {
    res.status(500).json({ message: "Error updating bio", error });
  }  
});
// routes to update the about section

userRoutes.post('/update-about', ClerkExpressRequireAuth(), async (req: Request, res: Response) => { 
  try {
    // user id form the auth object is the clerk id
    const user: string = req.auth.userId ?? '';
    const about: string = req.body.about;
    const updatedAbout = await userService.updateUserAbout(user, about);
    if (!updatedAbout) {
      return res.status(500).json({ message: "Error updating about section" });
    }
    res.status(200).json(updatedAbout);
  } catch (error) {
    res.status(500).json({ message: "Error updating bio", error });
  }  
});

userRoutes.post('/update-title', ClerkExpressRequireAuth(), async (req: Request, res: Response) => { 
  try {
    // user id form the auth object is the clerk id
    const user: string = req.auth.userId ?? '';
    const title: string = req.body.jobTitle;
    const updatedTitle = await userService.updateUserTitle(user, title);
    if (!updatedTitle) {
      return res.status(500).json({ message: "Error updating title" });
    }
    res.status(200).json(updatedTitle);
  } catch (error) {
    res.status(500).json({ message: "Error updating title", error });
  }  
});

userRoutes.post('/update-location', ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
  try {
    // user id form the auth object is the clerk id
    const user: string = req.auth.userId ?? '';
    const location: string = req.body.location;
    const updatedLocation = await userService.updateUserLocation(user, location);
    if (!updatedLocation) {
      return res.status(500).json({ message: "Error updating location" });
    }
    res.status(200).json(updatedLocation);
  } catch (error) {
    res.status(500).json({ message: "Error updating location", error });
  }  
});  

userRoutes.post('/update-skills', ClerkExpressRequireAuth(), async (req: Request, res: Response) => {
  try {
    // user id form the auth object is the clerk id
    const user: string = req.auth.userId ?? '';
    const skills: string[] = req.body.skills;
    const updatedSkills = await userService.updateUserSkills(user, skills);
    if (!updatedSkills) {
      return res.status(500).json({ message: "Error updating skills" });
    }
    res.status(200).json(updatedSkills);
  } catch (error) {
    res.status(500).json({ message: "Error updating skills", error });
  }  
});


export default userRoutes;

