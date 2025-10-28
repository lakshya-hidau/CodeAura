import { defineConfig } from "@prisma/config";
import dotenv from "dotenv";

// Load the .env file from the root of your project
dotenv.config({ path: "./.env" });

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
});
