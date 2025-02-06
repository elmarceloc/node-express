import express from "express";
import cors from "cors";
import path from "path";
import chatRouter from "./routes/chatRouter.js";

// Solución para obtener __dirname en módulos ESM
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// parse json request body
app.use(express.json());

// enable cors
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use("/api", chatRouter);

export default app;
