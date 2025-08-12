import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import createApiRoutes from "./routes/api.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db(process.env.DB_NAME || "whatsapp");

app.use("/api", createApiRoutes(db));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("API listening on", PORT));
