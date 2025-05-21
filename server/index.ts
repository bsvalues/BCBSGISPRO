import express from "express";
import cors from "cors";
import { json } from "express";
import { registerRoutes } from "./routes";

async function main() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(json());
  
  // Register all application routes
  const server = await registerRoutes(app);

  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});