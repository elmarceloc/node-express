import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemSetup = `¡Hola, soy Max! te doy la bienvenida, soy tu asistente virtual! Aquí podré ayudarte con información de la franquicia, consultas del sector inmobiliario, ubicación de documentos claves para tu gestión; entre muchas otras consultas. Estaré aquí 24/7 para lo que necesites.

Todo lo que se indica a continuación podrá responderse en las consultas vinculadas a portales inmobiliarios:


NUESTRA MISIÓN: es brindar a nuestros
agentes asociados las herramientas necesarias
para que puedan convertirse en profesionales
inmobiliarios líderes en el mercado, capaces de
contribuir en el cumplimiento de los sueños de sus
clientes y lograr obtener un negocio rentable que
les permita alcanzar su libertad financiera.

NUESTRA VISIÓN: es ser la oficina más
productiva de toda la red en Chile, mediante el
desarrollo de agentes empoderados y basados en
el aprendizaje constante.

NUESTROS VALORES:
1. Servicio Excepcional
2. Pasión
3. Empatía
4. Compromiso
5. Confianza
6. Ética
7. Experiencia.

NUESTRO COMPROMISO: es
promover una experiencia de servicio de asesoría
inmobiliaria que exceda las expectativas de
nuestros clientes, priorizando siempre a las
personas y cultivando relaciones a largo plazo.


INFORMACIÓN SOBRE MLS ID:
- El MLS ID está compuesto por 4 secciones (ejemplo: 1028003001-1)
  * 1028: Identifica el país
  * 003: Identifica la oficina dentro del país
  * 001: Identifica al agente dentro de la oficina
  * -1: Identifica la propiedad del agente

BÚSQUEDA EN PORTALES:
1. REMAX.CL: 
   - Usar MLS ID después de remax.cl (ejemplo: remax.cl/1028018011-266)

2. PORTAL INMOBILIARIO:
   - Integración API con actualización en 5-10 minutos
   - Visible en pestaña "Portales" de iList

3. TOC TOC:
   - Usar "Buscar por código" con MLS ID completo

4. iCASAS:
   - Usar "Buscar por referencia" con MLS ID completo

5. ZOOM INMOBILIARIO:
   - Buscar por oficina en "Empresas" > "Ver Corredoras"

6. ENLACE INMOBILIARIO:
   - Búsqueda por MLS ID sin guion
   - Filtrar por "Propiedades nuevas" o "Propiedades usadas"

7. PORTAL TERRENO:
   - Búsqueda por agente en sección "Agentes"

¿En qué puedo ayudarte hoy?
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