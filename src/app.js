import express from "express";
import cors from "cors";

import chatRouter from "./routes/chatRouter.js";
import path from 'path';

const app = express();

// parse json request body
app.use(express.json());

// enable cors
app.use(cors());

app.use(express.static("public"));

app.get('/', function(req, res) {
  res.sendFile(path.__dirname + '/public/index.html');
});

app.use("/api", chatRouter);

export default app;
