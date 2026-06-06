import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load local environmental variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// JSON Schema translation helper to match @google/genai Type descriptors
function translateSchema(schema: any): any {
  if (!schema) return undefined;

  const typeMap: Record<string, Type> = {
    object: Type.OBJECT,
    array: Type.ARRAY,
    string: Type.STRING,
    number: Type.NUMBER,
    integer: Type.INTEGER,
    boolean: Type.BOOLEAN,
    null: Type.NULL,
  };

  const sdkType = typeMap[schema.type?.toLowerCase()] || Type.TYPE_UNSPECIFIED;
  const result: any = { type: sdkType };

  if (schema.description) {
    result.description = schema.description;
  }

  if (sdkType === Type.OBJECT && schema.properties) {
    result.properties = {};
    for (const key of Object.keys(schema.properties)) {
      result.properties[key] = translateSchema(schema.properties[key]);
    }
    if (schema.required) {
      result.required = schema.required;
    }
  }

  if (sdkType === Type.ARRAY && schema.items) {
    result.items = translateSchema(schema.items);
  }

  return result;
}

// REST SDK invoke-llm route matching base44.integrations.Core.InvokeLLM calling signatures
app.post("/api/base44/invoke-llm", async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { prompt, response_json_schema } = req.body;
    if (!prompt) {
      return res.status(400).send("Prompt value is required");
    }

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is unset or default value, running offline simulated fallback");
      throw new Error("Missing real Gemini API Key credentials. Triggered automatic smart client fallback.");
    }

    const config: any = {
      responseMimeType: "application/json",
    };

    if (response_json_schema) {
      config.responseSchema = translateSchema(response_json_schema);
    }

    // Call standard 3.5 flash for multi-tenant parsing
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config,
    });

    const responseText = response.text || "{}";
    return res.json(JSON.parse(responseText));
  } catch (error: any) {
    console.error("InvokeLLM Server proxy failed:", error);
    return res.status(500).send(error?.message || "Internal LLM proxy error configuration");
  }
});

// Vite Middleware integration flow for SPA serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express custom server running on http://localhost:${PORT}`);
  });
}

start();
export default app;
