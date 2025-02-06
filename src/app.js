import express from "express";
import cors from "cors";
import { dirname } from 'path';

import chatRouter from "./routes/chatRouter.js";

const app = express();

// parse json request body
app.use(express.json());

// enable cors
app.use(cors());

app.use(express.static("public"));

app.use("/api", chatRouter);

export default app;
