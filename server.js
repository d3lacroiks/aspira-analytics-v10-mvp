const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
app.use(express.static(path.join(__dirname, "public")));

const HF_API = "https://api-inference.huggingface.co/models";
const HF_TOKEN = (process.env.HF_TOKEN || "").trim();
const HF_IMG_MODEL = process.env.HF_IMG_MODEL || "Salesforce/blip-image-captioning-base";
const HF_TXT_MODEL = process.env.HF_TXT_MODEL || "google/flan-t5-base";

function headersJson() {
  const h = { "Content-Type": "application/json" };
  if (HF_TOKEN) h["Authorization"] = `Bearer ${HF_TOKEN}`;
  return h;
}

function dataUrlToBuffer(dataUrl) {
  const m = /^data:(.+?);base64,(.+)$/.exec(dataUrl || "");
  if (!m) return null;
  return Buffer.from(m[2], "base64");
}

async function hfImageToText(imageDataUrl) {
  const buf = dataUrlToBuffer(imageDataUrl);
  if (!buf) throw new Error("Imagen inválida (data URL).");
  const res = await fetch(`${HF_API}/${encodeURIComponent(HF_IMG_MODEL)}`, {
    method: "POST",
    headers: HF_TOKEN ? { "Authorization": `Bearer ${HF_TOKEN}` } : {},
    body: buf
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(`HF image-to-text error: ${msg}`);
  }
  const caption = Array.isArray(data) ? (data[0]?.generated_text || "") : (data?.generated_text || "");
  return caption || "";
}

function stepPrompt(step, caption) {
  const cap = caption ? `DESCRIPCIÓN OBJETIVA (CAPTION): ${caption}\n\n` : "";
  if (step === 2) {
    return cap + [
      "TAREA: Apoyo metodológico para el Paso 2 (Pre-iconográfico) del Protocolo ASPIRA (v10).",
      "DEVUELVE EN ESPAÑOL:",
      "1) Lista de elementos visibles (objetos/figuras/patrones) en viñetas.",
      "2) Paleta dominante (3-7 colores) y contrastes.",
      "3) Composición (ejes, balance, jerarquía visual, dirección de lectura).",
      "4) Texturas/materialidad sugerida por lo visual (si aplica).",
      "5) 3 preguntas guía para profundizar el análisis pre-iconográfico.",
      "REGLA: No interpretes significados culturales. Solo descripción y preguntas."
    ].join("\n");
  }
  if (step === 4) {
    return cap + [
      "TAREA: Apoyo metodológico para el Paso 4 (Iconográfico) del Protocolo ASPIRA (v10).",
      "DEVUELVE EN ESPAÑOL:",
      "1) Motivos iconográficos amazónicos *posibles* (5-12) como lista.",
      "   - Para cada motivo: 1 línea de evidencia basada en la descripción.",
      "2) 5 preguntas guía para verificar la iconografía (qué mirar / qué comparar).",
      "3) 3 advertencias metodológicas (qué NO asumir).",
      "REGLA: Usa lenguaje probabilístico ('podría', 'parece', 'sugiere'). No afirmes certezas."
    ].join("\n");
  }
  if (step === 5) {
    return [
      "TAREA: Genera preguntas guía para un análisis semiótico de arte amazónico contemporáneo (Protocolo ASPIRA v10).",
      "DEVUELVE EN ESPAÑOL:",
      "1) 10 preguntas guía (códigos, oposiciones, registros locales, agencia no-humana, materialidad como signo).",
      "2) Mini-checklist de evidencias a documentar (6 ítems).",
      "REGLA: No interpretes una obra específica; produce preguntas y checklist generales."
    ].join("\n");
  }
  return "Este paso no tiene asistencia IA en el MVP.";
}

async function hfText(prompt) {
  const res = await fetch(`${HF_API}/${encodeURIComponent(HF_TXT_MODEL)}`, {
    method: "POST",
    headers: headersJson(),
    body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(`HF text error: ${msg}`);
  }
  const txt = Array.isArray(data) ? (data[0]?.generated_text || "") : (data?.generated_text || "");
  return txt || JSON.stringify(data);
}

app.post("/api/assist", async (req, res) => {
  try {
    const { step, imageDataUrl } = req.body || {};
    const n = Number(step);
    if (![2, 4, 5].includes(n)) {
      return res.json({ ok: true, content: "Asistencia IA en el MVP solo para pasos 2, 4 y 5." });
    }

    let caption = "";
    if ((n === 2 || n === 4) && imageDataUrl) {
      caption = await hfImageToText(imageDataUrl);
    }

    const prompt = stepPrompt(n, caption);
    const content = await hfText(prompt);

    res.json({ ok: true, caption, content });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
});

app.listen(PORT, () => console.log(`ASPIRA Analytics v10 MVP (UI2+) corriendo en http://localhost:${PORT}`));