
import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const getFilePath = (name: string) => path.join(DATA_DIR, `${name}.json`);

const DEFAULTS: Record<string, any> = {
  orchestra_gateway_users: [
    { id: 'admin', name: 'Admin User', password: 'admin', passcode: '000000', instrument: 'Piano', role: 'admin', temp_access_until: null, joined_at: new Date('2024-01-01').toISOString() },
    { id: 'haegeum1', name: '김해금', password: '1234', passcode: '123456', instrument: 'Haegeum', role: 'member', temp_access_until: null, joined_at: new Date('2024-02-15').toISOString() },
    { id: 'cello1', name: '이첼로', password: '1234', passcode: '654321', instrument: 'Cello', role: 'member', temp_access_until: null, joined_at: new Date('2024-03-10').toISOString() },
  ],
  orchestra_gateway_instruments: [
    'FullScore', 'Sogeum', 'Daegeum', 'Piri', 'Daepiri', 'Saenghwang', 
    'Taepyeongso', 'Haegeum', 'Ajaeng', 'Gayageum', 'Geumungo', 
    'Yanggeum', 'Percussion', 'Piano', 'Flute', 'Panflute', 'Cello'
  ],
  orchestra_gateway_translations: {
    'Sogeum': '소금', 'Daegeum': '대금', 'Piri': '피리', 'Daepiri': '대피리', 'Saenghwang': '생황',
    'Taepyeongso': '태평소', 'Haegeum': '해금', 'Ajaeng': '아쟁', 'Gayageum': '가야금', 'Geumungo': '거문고',
    'Yanggeum': '양금', 'Percussion': '타악', 'Piano': '피아노', 'Flute': '플룻', 'Panflute': '팬플룻', 'Cello': '첼로', 'FullScore': '총보(스코어)'
  },
  orchestra_gateway_rehearsal_schedule: [
    { id: 'tue', dayOfWeek: 2, startTime: '18:00', endTime: '23:00' },
    { id: 'sat', dayOfWeek: 6, startTime: '10:00', endTime: '18:00' }
  ],
  orchestra_gateway_vacation_period: {
    startDate: '',
    endDate: '',
    isActive: false
  },
  orchestra_gateway_scores: [
    'FullScore', 'Sogeum', 'Daegeum', 'Piri', 'Daepiri', 'Saenghwang', 
    'Taepyeongso', 'Haegeum', 'Ajaeng', 'Gayageum', 'Geumungo', 
    'Yanggeum', 'Percussion', 'Piano', 'Flute', 'Panflute', 'Cello'
  ].map(inst => ({
    instrument: inst,
    notion_url: `https://notion.so/orchestra/${inst.toLowerCase().replace(' ', '-')}-scores`
  })),
  orchestra_gateway_announcements: [],
  orchestra_gateway_access_logs: []
};

const readData = (name: string) => {
  const filePath = getFilePath(name);
  if (!fs.existsSync(filePath)) {
    return DEFAULTS[name] || null;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (e) {
    console.error(`Error reading ${name}:`, e);
    return DEFAULTS[name] || null;
  }
};

const saveData = (name: string, data: any) => {
  const filePath = getFilePath(name);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
};

async function startServer() {
  try {
    const app = express();
    const PORT = 3000;

    app.use(cors());
    app.use(express.json({ limit: '50mb' }));

    // API Routes
    app.get("/api/health", (req, res) => res.json({ status: "ok" }));

    app.get("/api/data/:name", (req, res) => {
      const { name } = req.params;
      const data = readData(name);
      res.json(data);
    });

    app.post("/api/data/:name", (req, res) => {
      const { name } = req.params;
      saveData(name, req.body);
      res.json({ success: true });
    });

    const isProd = process.env.NODE_ENV === "production" || fs.existsSync(path.join(__dirname, "dist"));

    if (isProd) {
      app.use(express.static(path.join(__dirname, "dist")));
      app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      });
    } else {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
