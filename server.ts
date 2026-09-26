import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Cloud Storage File & State
const DATA_DIR = path.join(process.cwd(), "data");
const CLOUD_FILE = path.join(DATA_DIR, "cloud_store.json");

interface CloudChangeRecord {
  id: string;
  timestamp: string;
  author: string;
  actionType: string;
  summary: string;
}

interface CloudStore {
  version: number;
  isEnabled: boolean;
  lastUpdate: string;
  lastUpdatedBy: string;
  recentChanges: CloudChangeRecord[];
  data: any;
}

function initCloudStore(): CloudStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CLOUD_FILE)) {
      const content = fs.readFileSync(CLOUD_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading cloud store file, reinitializing:", err);
  }

  const initialStore: CloudStore = {
    version: 1,
    isEnabled: true,
    lastUpdate: new Date().toISOString(),
    lastUpdatedBy: "Qaaddi Notary Public (System)",
    recentChanges: [
      {
        id: "chg-init",
        timestamp: new Date().toISOString(),
        author: "Axmed Qaaddi",
        actionType: "system_init",
        summary: "Nidaamka Live Cloud Storage ee Qaaddi Notary Public oo la howlgeliyay",
      },
    ],
    data: null,
  };

  try {
    fs.writeFileSync(CLOUD_FILE, JSON.stringify(initialStore, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write initial cloud store:", e);
  }

  return initialStore;
}

let cloudStore: CloudStore = initCloudStore();

function persistCloudStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CLOUD_FILE, JSON.stringify(cloudStore, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to persist cloud store:", e);
  }
}

// Lazy initialization of Gemini API
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Cloud Storage Endpoints
app.get("/api/cloud/status", (_req: Request, res: Response) => {
  res.json({
    isEnabled: cloudStore.isEnabled,
    version: cloudStore.version,
    lastUpdate: cloudStore.lastUpdate,
    lastUpdatedBy: cloudStore.lastUpdatedBy,
    hasData: cloudStore.data !== null,
    changeCount: cloudStore.recentChanges.length,
    recentChanges: cloudStore.recentChanges.slice(0, 15),
  });
});

app.get("/api/cloud/data", (_req: Request, res: Response) => {
  res.json({
    isEnabled: cloudStore.isEnabled,
    version: cloudStore.version,
    lastUpdate: cloudStore.lastUpdate,
    lastUpdatedBy: cloudStore.lastUpdatedBy,
    recentChanges: cloudStore.recentChanges.slice(0, 30),
    data: cloudStore.data,
  });
});

app.post("/api/cloud/sync", (req: Request, res: Response) => {
  try {
    const { data, summary, author, actionType } = req.body;
    if (!data) {
      return res.status(400).json({ error: "Missing data payload" });
    }

    const timestamp = new Date().toISOString();
    const finalAuthor = author || "Isticmaale";
    const changeSummary = summary || "Xog cusub ayaa la keydiyay";

    const newChange: CloudChangeRecord = {
      id: "chg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      timestamp,
      author: finalAuthor,
      actionType: actionType || "update",
      summary: changeSummary,
    };

    cloudStore.version += 1;
    cloudStore.lastUpdate = timestamp;
    cloudStore.lastUpdatedBy = finalAuthor;
    cloudStore.recentChanges = [newChange, ...cloudStore.recentChanges.slice(0, 49)];
    cloudStore.data = data;

    persistCloudStore();

    res.json({
      success: true,
      version: cloudStore.version,
      lastUpdate: cloudStore.lastUpdate,
      lastUpdatedBy: cloudStore.lastUpdatedBy,
      recentChanges: cloudStore.recentChanges.slice(0, 20),
    });
  } catch (error) {
    console.error("Cloud sync error:", error);
    res.status(500).json({ error: "Failed to sync to cloud storage" });
  }
});

app.post("/api/cloud/toggle", (req: Request, res: Response) => {
  const { enabled } = req.body;
  cloudStore.isEnabled = Boolean(enabled);
  persistCloudStore();
  res.json({ success: true, isEnabled: cloudStore.isEnabled });
});

// AI Financial Insights
app.post("/api/gemini/insights", async (req: Request, res: Response) => {
  try {
    const { summary, recentTransactions, currency } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback smart insights when API key is not present
      const net = (summary?.totalIncome || 0) - (summary?.totalExpense || 0);
      const collectionRate = summary?.totalInvoiced > 0 
        ? Math.round((summary?.totalCollected / summary?.totalInvoiced) * 100) 
        : 85;

      return res.json({
        insights: [
          {
            title: "Heerka Ururinta Deymaha (Collection Rate)",
            description: `Heerkaaga ururinta lacagaha hadda waa ${collectionRate}%. Deymaha harsan ee soo daahay waxaa habboon in lagu kormeero wicitaan ama farriin xusuusin ah.`,
            type: collectionRate < 70 ? "warning" : "success",
            recommendation: "Dir xusuusiyaha invoice-ka ee macaamiisha ay ka harsan tahay 30+ maalmood."
          },
          {
            title: "Dheelitirka Dakhliga iyo Kharashka (Net Margin)",
            description: net >= 0 
              ? `Faaiidada saafiga ah ee xilligan waa ${net.toLocaleString()} ${currency || "USD"}. Kharashyada ugu sarreeya waxay u baahan yihiin kormeer joogto ah.` 
              : `Digniin: Kharashku wuxuu ka badan yahay dakhliga xilligan qadar ${Math.abs(net).toLocaleString()} ${currency || "USD"}.`,
            type: net >= 0 ? "info" : "danger",
            recommendation: "Yaree kharashyada maamulka ama dib u eeg adeegyada faa'iidada badan soo saara."
          }
        ],
        summaryText: "Falanqaynta maaliyadeed waxay muujinaysaa in socodka lacagtu (cash flow) uu furan yahay, xisaabaadka bangiyada iyo lacagta mobile-kuna ay ku xisaabsan yihiin xisaab xidhka bishan."
      });
    }

    const prompt = `Waxaad tahay la-taliye maaliyadeed iyo xisaabiye sare (Chief Financial Officer) oo falanqeynaya xisaabaadka ganacsi yar ama shakhsi.
Xogta Maaliyadda:
- Wadarta Dakhliga: ${summary?.totalIncome || 0}
- Wadarta Kharashka: ${summary?.totalExpense || 0}
- Dheelitirka Saafiga ah (Net Profit): ${(summary?.totalIncome || 0) - (summary?.totalExpense || 0)}
- Deymaha Macaamiisha (Receivables): ${summary?.totalReceivables || 0}
- Deymaha Ganacsiga (Payables): ${summary?.totalPayables || 0}
- Lacagta Qasnadda (Cash): ${summary?.cashBalance || 0}
- Lacagta Bangiga (Bank): ${summary?.bankBalance || 0}
- Lacagta Mobile Money (Zaad / Sahal / E-Dahab): ${summary?.walletBalance || 0}
- Lacagta loo xisaabiyay: ${currency || "USD"}

Kala bixi falanqayn kooban oo af-Soomaali ah (oo ay ku jiraan 2-3 insight oo wax ku ool ah, noocooda (success/warning/info/danger), iyo talo ficil ah).
Ku soo celi qaab JSON oo leh qaab-dhismeedkan:
{
  "insights": [
    {
      "title": "Cinwaan kooban",
      "description": "Faahfaahin falanqayn ah oo xaqiiqo ah",
      "type": "success" | "warning" | "info" | "danger",
      "recommendation": "Tallaabo la qaadi karo"
    }
  ],
  "summaryText": "Soo koobid maaliyadeed oo 2 sadar ah"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "{}";
    const data = JSON.parse(responseText);
    res.json(data);
  } catch (error) {
    console.error("Gemini insights error:", error);
    res.status(500).json({ error: "Failed to generate financial insights." });
  }
});

// AI Smart Categorization endpoint
app.post("/api/gemini/categorize", async (req: Request, res: Response) => {
  try {
    const { description, amount, type } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Local heuristic fallback
      const desc = (description || "").toLowerCase();
      let suggestedCategory = "Other";
      if (desc.includes("rent") || desc.includes("kire") || desc.includes("kirada")) suggestedCategory = "Rent";
      else if (desc.includes("shidaal") || desc.includes("fuel") || desc.includes("gaadiid") || desc.includes("taxi")) suggestedCategory = "Transport";
      else if (desc.includes("cunto") || desc.includes("qado") || desc.includes("casho") || desc.includes("restaurant") || desc.includes("tea")) suggestedCategory = "Food";
      else if (desc.includes("mushaar") || desc.includes("salary") || desc.includes("shaqaale")) suggestedCategory = "Salary";
      else if (desc.includes("koronto") || desc.includes("electricity") || desc.includes("power")) suggestedCategory = "Electricity";
      else if (desc.includes("internet") || desc.includes("wifi") || desc.includes("somcable") || desc.includes("telesom")) suggestedCategory = "Internet";
      else if (desc.includes("qareen") || desc.includes("legal") || desc.includes("maxkamad") || desc.includes("notary")) suggestedCategory = "Legal expenses";
      else if (desc.includes("office") || desc.includes("warqad") || desc.includes("qalab")) suggestedCategory = "Office";
      else if (desc.includes("suuq") || desc.includes("xayeysiis") || desc.includes("marketing") || desc.includes("ads")) suggestedCategory = "Marketing";
      else if (desc.includes("dayactir") || desc.includes("hagaajin") || desc.includes("maintenance")) suggestedCategory = "Maintenance";

      return res.json({ category: suggestedCategory, confidence: 0.9 });
    }

    const prompt = `Soo jeedi category-ga ku habboon qoraalkan xisaabeed:
Nooca: ${type || "Expense"}
Faahfaahin: "${description}"
Qadarka: ${amount || 0}

Doorashooyinka ugu muhiimsan:
Office, Transport, Food, Salary, Rent, Electricity, Internet, Legal expenses, Marketing, Equipment, Maintenance, Legal Consultation, Contract Drafting, Clearance, Other.

Ku soo celi JSON kaliya oo qaabkan ah:
{
  "category": "Magaca category-ga",
  "confidence": 0.95
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error) {
    console.error("Categorize error:", error);
    res.json({ category: "Other", confidence: 0.5 });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
