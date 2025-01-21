import dotenv from "dotenv";
dotenv.config();
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

/**
 * Initializes and returns an Azure Blob Storage container client.
 * @returns {ContainerClient} The container client object to interact with the container in Azure Blob Storage.
 * @throws Will throw an error if connection string or container name is not provided.
 */
export function initializeContainerClient(): ContainerClient {
  const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const CONTAINER_NAME = "userimages";

  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error("Azure Storage Connection string not found");
  }

  if (!CONTAINER_NAME) {
    throw new Error("Container name not found");
  }

  const blobServiceClient: BlobServiceClient = 
    BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient: ContainerClient = 
    blobServiceClient.getContainerClient(CONTAINER_NAME);

  console.log("Azure Blob Storage initialized successfully.");
  return containerClient;
}

// Usage:
const containerClient = initializeContainerClient();
export default containerClient;
