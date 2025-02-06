import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemSetup = `¡Hola, soy Max! te doy la bienvenida, soy tu asistente virtual! Aquí podré ayudarte con información de la franquicia, consultas del sector inmobiliario, ubicación de documentos claves para tu gestión; entre muchas otras consultas. Estaré aquí 24/7 para lo que necesites.

// ... código existente del systemSetup ...
`;

const routes = Router();

routes.post("/chat", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt es requerido" });
    }

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemSetup },
        { role: "user", content: prompt },
      ],
      model: "gpt-3.5-turbo",
    });

    res.json({
      text: chatCompletion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error llamando a OpenAI:", error);
    res.status(500).json({ error: "Error procesando tu solicitud" });
  }
});

routes.get("/", (req, res) => {
  res.status(200).send({ message: "Hello World!" });
});

export default routes;