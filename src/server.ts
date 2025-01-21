import dotenv from "dotenv";
dotenv.config();
import express, { Application, Request, Response } from "express";
import cors from "cors";
import { getCompanyData } from "../src/services/companyService";
import jobRoutes from "./routes/jobRoutes";
import userRoutes from "./routes/userRoutes";
import resumeRoutes from "./routes/resumeRoutes";
import {
  ClerkExpressWithAuth,
  LooseAuthProp,
} from "@clerk/clerk-sdk-node";

const app: Application = express();

declare global {
  namespace Express {
    interface Request extends LooseAuthProp {}
  }
}
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
// const app = express();
app.use(ClerkExpressWithAuth());
app.set("json spaces", 2);
app.use(express.json());
app.use(cors(corsOptions));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
app.use("/api/", userRoutes);
app.use("/api/", resumeRoutes);
app.use("/api/jobs", jobRoutes);

// Error Handling Middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ error: err.message });
  }
);

app.get("/api/company", async (req, res) => {
  const companyName = req.query.company;
  if (!companyName) {
    console.log("Company name is required");
    return res.status(400).send("Company name is required");
  }

  try {
    const companyData = await getCompanyData(companyName.toString());
    res.json(companyData);
  } catch (err: any) {
    console.error("Error executing query", err.stack);
    res.status(500).send("Server error");
  }
});
