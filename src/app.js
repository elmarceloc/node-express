import express from "express";
import cors from "cors";

import chatRouter from "./routes/chatRouter.js";

const app = express();

// parse json request body
app.use(express.json());
app.get('/', () => app.use(express.static(__dirname + '/public')));

// enable cors
app.use(cors());

// healthcheck endpoint
app.get("/", (req, res) => {
  res.status(200).send({ status: "ok" });
});

app.use("/api", chatRouter);

export default app;
