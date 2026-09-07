import cors from "cors";
import express from "express";
import multer from "multer";
import fs from "node:fs/promises";
import path from "node:path";

type Vocabulary = {
  id: number;
  word: string;
  translation: string;
  definition: string;
  pos: string;
  ipa: string;
  example: string;
  topic: string;
  level: string;
  mastery: number;
  favorite: boolean;
  next: string;
  reviewed: boolean;
};
const app = express();
const port = Number(process.env.PORT || 4000);
const dataDir = path.resolve("server/data");
const dataFile = path.join(dataDir, "words.json");
const seed: Vocabulary[] = [
  {
    id: 1,
    word: "resilient",
    translation: "tangguh",
    definition: "Able to recover quickly from difficulties.",
    pos: "adjective",
    ipa: "/rɪˈzɪliənt/",
    example: "She is resilient in the face of challenges.",
    topic: "Personal growth",
    level: "B2",
    mastery: 72,
    favorite: true,
    next: "Today",
    reviewed: false,
  },
  {
    id: 2,
    word: "thrive",
    translation: "berkembang pesat",
    definition: "To grow or develop well and vigorously.",
    pos: "verb",
    ipa: "/θraɪv/",
    example: "Small plants thrive in bright sunlight.",
    topic: "Daily life",
    level: "B1",
    mastery: 48,
    favorite: false,
    next: "Tomorrow",
    reviewed: false,
  },
  {
    id: 3,
    word: "accomplish",
    translation: "menyelesaikan",
    definition: "To succeed in doing or completing something.",
    pos: "verb",
    ipa: "/əˈkʌmplɪʃ/",
    example: "You can accomplish anything with consistent practice.",
    topic: "Work",
    level: "B1",
    mastery: 91,
    favorite: true,
    next: "In 3 days",
    reviewed: true,
  },
];
app.use(cors());
app.use(express.json({ limit: "2mb" }));
const uploadDir = path.resolve("server/uploads");
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, callback) =>
    callback(null, `${Date.now()}-${file.fieldname}.webm`),
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});
app.get("/uploads/:filename", (req, res) => {
  res.type("audio/webm").sendFile(req.params.filename, { root: uploadDir });
});
app.use("/uploads", express.static(uploadDir));
void fs.mkdir(uploadDir, { recursive: true });
async function readWords(): Promise<Vocabulary[]> {
  try {
    return JSON.parse(await fs.readFile(dataFile, "utf8")) as Vocabulary[];
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(dataFile, JSON.stringify(seed, null, 2));
    return seed;
  }
}
async function writeWords(words: Vocabulary[]) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(dataFile, JSON.stringify(words, null, 2));
}
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "ZiaEdu API" }),
);
app.get("/api/words", async (_req, res) => res.json(await readWords()));
app.post("/api/words", async (req, res) => {
  const body = req.body as Partial<Vocabulary>;
  if (!body.word || !body.translation)
    return res.status(400).json({ error: "word and translation are required" });
  const words = await readWords();
  const word: Vocabulary = {
    id: Date.now(),
    word: body.word,
    translation: body.translation,
    definition: body.definition || "",
    pos: body.pos || "word",
    ipa: body.ipa || "",
    example: body.example || "",
    topic: body.topic || "Daily Life",
    level: body.level || "B1",
    mastery: 0,
    favorite: false,
    next: "Today",
    reviewed: false,
  };
  words.unshift(word);
  await writeWords(words);
  res.status(201).json(word);
});
app.post("/api/words/bulk", async (req, res) => {
  if (!Array.isArray(req.body?.words))
    return res.status(400).json({ error: "words array is required" });
  const current = await readWords();
  const imported = req.body.words.map(
    (word: Partial<Vocabulary>, i: number) => ({ ...word, id: Date.now() + i }),
  );
  await writeWords([...imported, ...current]);
  res.status(201).json(imported);
});
app.patch("/api/words/:id", async (req, res) => {
  const words = await readWords();
  const id = Number(req.params.id);
  const index = words.findIndex((word) => word.id === id);
  if (index < 0) return res.status(404).json({ error: "word not found" });
  words[index] = { ...words[index], ...req.body, id };
  await writeWords(words);
  res.json(words[index]);
});
app.delete("/api/words/:id", async (req, res) => {
  const id = Number(req.params.id);
  const words = await readWords();
  const next = words.filter((word) => word.id !== id);
  if (next.length === words.length)
    return res.status(404).json({ error: "word not found" });
  await writeWords(next);
  res.status(204).end();
});
app.post(
  "/api/speaking/recordings",
  upload.single("audio"),
  async (req, res) => {
    if (!req.file)
      return res.status(400).json({ error: "audio file is required" });
    const record = {
      recording_id: `rec_${Date.now()}`,
      speaking_exercise_id: req.body.topic || "speaking",
      audio_file_url: `/uploads/${req.file.filename}`,
      duration: Number(req.body.duration || 0),
      file_size: req.file.size,
      format: req.file.mimetype,
      created_at: new Date().toISOString(),
      topic: req.body.topic,
      prompt: req.body.prompt,
    };
    const file = path.join(dataDir, "speaking-recordings.json");
    let records: unknown[] = [];
    try {
      records = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    records.unshift(record);
    await fs.writeFile(file, JSON.stringify(records, null, 2));
    res.status(201).json(record);
  },
);
app.get("/api/speaking/recordings", async (_req, res) => {
  try {
    res.json(
      JSON.parse(
        await fs.readFile(
          path.join(dataDir, "speaking-recordings.json"),
          "utf8",
        ),
      ),
    );
  } catch {
    res.json([]);
  }
});
app.listen(port, () =>
  console.log(`ZiaEdu API running at http://localhost:${port}`),
);
