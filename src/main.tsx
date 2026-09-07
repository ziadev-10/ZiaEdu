import React, { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BookText,
  Brain,
  Check,
  ChevronDown,
  CircleHelp,
  Flame,
  Gamepad2,
  Headphones,
  Home,
  Languages,
  LayoutGrid,
  Lightbulb,
  ListFilter,
  Menu,
  MessageCircle,
  Mic2,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Target,
  Trophy,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import "./styles.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type Page =
  | "home"
  | "vocabulary"
  | "decks"
  | "flashcards"
  | "speaking"
  | "notes"
  | "stats"
  | "achievements"
  | "settings"
  | "tutor";
type Word = {
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
type DayStats = {
  opened: number;
  studied: number;
  reviewed: number;
  mastered: number;
  seconds: number;
  correct: number;
  goal: number;
};
const localKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const dayKey = () => localKey();
const blankDay = (): DayStats => ({
  opened: 0,
  studied: 0,
  reviewed: 0,
  mastered: 0,
  seconds: 0,
  correct: 0,
  goal: 20,
});
const readDays = (): Record<string, DayStats> => {
  try {
    const stored = JSON.parse(
      localStorage.getItem("ziaedu-daily-stats") || "{}",
    );
    const normalized = Object.fromEntries(
      Object.entries(stored).map(([key, value]) => [
        key,
        { ...blankDay(), ...(value as Partial<DayStats>), goal: 20 },
      ]),
    );
    const legacy = JSON.parse(
      localStorage.getItem("ziaedu-daily-activity") || "{}",
    );
    Object.entries(legacy).forEach(([key, value]) => {
      const count = Math.min(200, Number(value) || 0);
      const current = normalized[key] || blankDay();
      if (count > current.studied)
        normalized[key] = {
          ...current,
          opened: Math.max(current.opened, count),
          studied: count,
          goal: 20,
        };
    });
    localStorage.setItem("ziaedu-daily-stats", JSON.stringify(normalized));
    return normalized;
  } catch {
    return {};
  }
};
const learningStreak = (days: Record<string, DayStats>) => {
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const date = localKey(new Date(Date.now() - i * 86400000));
    if ((days[date]?.studied || 0) >= (days[date]?.goal || 20)) count++;
    else break;
  }
  return count;
};

const starterWords: Word[] = [
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
  {
    id: 4,
    word: "subtle",
    translation: "halus / tidak kentara",
    definition: "Not immediately obvious or easy to notice.",
    pos: "adjective",
    ipa: "/ˈsʌtəl/",
    example: "There is a subtle difference in meaning.",
    topic: "Academic English",
    level: "C1",
    mastery: 35,
    favorite: false,
    next: "Today",
    reviewed: false,
  },
  {
    id: 5,
    word: "curious",
    translation: "ingin tahu",
    definition: "Eager to learn or know something.",
    pos: "adjective",
    ipa: "/ˈkjʊəriəs/",
    example: "A curious mind asks better questions.",
    topic: "Personal growth",
    level: "A2",
    mastery: 100,
    favorite: false,
    next: "In 7 days",
    reviewed: true,
  },
  {
    id: 6,
    word: "efficient",
    translation: "efisien",
    definition: "Achieving maximum productivity with minimum wasted effort.",
    pos: "adjective",
    ipa: "/ɪˈfɪʃənt/",
    example: "This is a more efficient way to study.",
    topic: "Business",
    level: "B2",
    mastery: 64,
    favorite: false,
    next: "Today",
    reviewed: false,
  },
  {
    id: 7,
    word: "insight",
    translation: "wawasan",
    definition: "A deep understanding of a person or thing.",
    pos: "noun",
    ipa: "/ˈɪnsaɪt/",
    example: "The book gave me valuable insight.",
    topic: "Education",
    level: "B2",
    mastery: 82,
    favorite: true,
    next: "Tomorrow",
    reviewed: true,
  },
  {
    id: 8,
    word: "destination",
    translation: "tujuan",
    definition: "The place to which someone or something is going.",
    pos: "noun",
    ipa: "/ˌdestɪˈneɪʃən/",
    example: "Bali is a popular holiday destination.",
    topic: "Travel",
    level: "A2",
    mastery: 23,
    favorite: false,
    next: "Today",
    reviewed: false,
  },
];

const navGroups = [
  {
    label: "Utama",
    items: [
      ["home", "Beranda", Home],
      ["vocabulary", "Kosakata", BookOpen],
      ["speaking", "Speaking", MessageCircle],
    ],
  },
  {
    label: "Latihan",
    items: [["flashcards", "Kartu belajar", RotateCcw]],
  },
  {
    label: "Ruang belajar",
    items: [
      ["notes", "Catatan Saya", BookText],
      ["stats", "Statistik Belajar", BarChart3],
      ["achievements", "Pencapaian", Trophy],
      ["settings", "Pengaturan", Settings],
    ],
  },
] as const;

function App() {
  const [page, setPage] = useState<Page>("home");
  const [mobileNav, setMobileNav] = useState(false);
  const [dark, setDark] = useState(true);
  const [words, setWords] = useState(starterWords);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [xp, setXp] = useState(1240);
  const [streak, setStreak] = useState(12);
  const [cardsOpened, setCardsOpened] = useState(() =>
    Number(localStorage.getItem("ziaedu-cards-opened") || 0),
  );
  const [reviewCount, setReviewCount] = useState(() =>
    Number(localStorage.getItem("ziaedu-review-count") || 0),
  );
  const [days, setDays] = useState<Record<string, DayStats>>(() => readDays());
  const activeStudyPage =
    page === "flashcards" || page === "vocabulary" || page === "speaking";
  const todayStats = days[dayKey()] || blankDay();
  const actualStreak = learningStreak(days);
  const addToday = (field: keyof DayStats, amount = 1) =>
    setDays((current) => {
      const key = dayKey();
      const today = { ...blankDay(), ...(current[key] || {}) };
      const next = {
        ...current,
        [key]: {
          ...today,
          [field]:
            field === "opened" || field === "studied"
              ? Math.min(200, (today[field] as number) + amount)
              : (today[field] as number) + amount,
        },
      };
      localStorage.setItem("ziaedu-daily-stats", JSON.stringify(next));
      return next;
    });
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (activeStudyPage && document.visibilityState === "visible")
        addToday("seconds", 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeStudyPage]);
  useEffect(() => {
    setStreak(actualStreak);
  }, [actualStreak]);
  useEffect(() => {
    document.body.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    fetch("/api/words")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => setWords(data))
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2600);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const due = words.filter((w) => !w.reviewed && w.next === "Today").length;
  const go = (p: Page) => {
    setPage(p);
    setMobileNav(false);
  };
  const review = (id: number, grade: string) => {
    addToday("reviewed");
    if (grade !== "Again") addToday("correct");
    const reviewedWord = words.find((word) => word.id === id);
    const nextMastery = Math.min(
      100,
      (reviewedWord?.mastery || 0) +
        (grade === "Easy"
          ? 14
          : grade === "Good"
            ? 9
            : grade === "Hard"
              ? 4
              : 0),
    );
    if (reviewedWord && reviewedWord.mastery < 100 && nextMastery >= 100)
      addToday("mastered");
    setReviewCount((count) => {
      const next = count + 1;
      localStorage.setItem("ziaedu-review-count", String(next));
      return next;
    });
    const next =
      grade === "Again"
        ? "Today"
        : grade === "Hard"
          ? "Tomorrow"
          : grade === "Good"
            ? "In 3 days"
            : "In 7 days";
    void fetch(`/api/words/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewed: true, next }),
    });
    setWords((ws) =>
      ws.map((w) =>
        w.id === id
          ? {
              ...w,
              reviewed: true,
              mastery: Math.min(
                100,
                w.mastery +
                  (grade === "Easy"
                    ? 14
                    : grade === "Good"
                      ? 9
                      : grade === "Hard"
                        ? 4
                        : 0),
              ),
              next:
                grade === "Again"
                  ? "Today"
                  : grade === "Hard"
                    ? "Tomorrow"
                    : grade === "Good"
                      ? "In 3 days"
                      : "In 7 days",
            }
          : w,
      ),
    );
    setXp((x) => x + (grade === "Easy" ? 12 : grade === "Good" ? 8 : 4));
    setToast(`Review saved · ${grade}`);
  };
  return (
    <div className="app-shell">
      <Sidebar
        page={page}
        go={go}
        mobile={mobileNav}
        close={() => setMobileNav(false)}
      />
      <div className="main-area">
        <Header
          search={search}
          setSearch={setSearch}
          dark={dark}
          setDark={setDark}
          setMobileNav={setMobileNav}
          go={go}
          xp={xp}
        />
        <main className="content">
          {page === "home" && (
            <Dashboard
              go={go}
              due={due}
              words={words}
              streak={streak}
              xp={xp}
              cardsOpened={cardsOpened}
              todayStats={todayStats}
              days={days}
            />
          )}{" "}
          {page === "vocabulary" && (
            <Vocabulary
              words={words}
              setWords={setWords}
              search={search}
              setSearch={setSearch}
              toast={setToast}
            />
          )}{" "}
          {page === "decks" && <Decks words={words} go={go} toast={setToast} />}{" "}
          {page === "flashcards" && (
            <Flashcards
              words={words}
              onReview={review}
              go={go}
              onCardStudied={() => addToday("studied")}
              onCardOpened={() => {
                addToday("opened");
                setCardsOpened((count) => {
                  const next = count + 1;
                  localStorage.setItem("ziaedu-cards-opened", String(next));
                  return next;
                });
                const key = localKey();
                const activity = JSON.parse(
                  localStorage.getItem("ziaedu-daily-activity") || "{}",
                );
                activity[key] = (activity[key] || 0) + 1;
                localStorage.setItem(
                  "ziaedu-daily-activity",
                  JSON.stringify(activity),
                );
              }}
            />
          )}{" "}
          {page !== "home" &&
            page !== "vocabulary" &&
            page !== "flashcards" && (
              <Module
                page={page}
                go={go}
                words={words}
                setWords={setWords}
                toast={setToast}
                xp={xp}
                streak={streak}
                cardsOpened={cardsOpened}
                reviewCount={reviewCount}
                todayStats={todayStats}
                days={days}
              />
            )}
        </main>
      </div>
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function Sidebar({
  page,
  go,
  mobile,
  close,
}: {
  page: Page;
  go: (p: Page) => void;
  mobile: boolean;
  close: () => void;
}) {
  return (
    <aside className={`sidebar ${mobile ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <Sparkles size={19} />
        </div>
        <span>
          Zia<span>Edu</span>
        </span>
        <button className="icon-btn sidebar-close" onClick={close}>
          <X size={18} />
        </button>
      </div>
      <div className="profile-mini motivation-card">
        <Sparkles size={17} />
        <div>
          <b>Semangat Zia belajar bahasa nya!</b>
          <small>Katanya mau ke luar negri!!</small>
        </div>
      </div>
      <nav>
        {navGroups.map((group) => (
          <div className="nav-group" key={group.label}>
            <small className="nav-label">{group.label}</small>
            {group.items.map(([id, label, Icon]) => (
              <button
                key={id}
                className={`nav-item ${page === id ? "active" : ""}`}
                onClick={() => go(id as Page)}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === "vocabulary" && <i>{"3"}</i>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="streak">
          <Flame size={17} />
          <div>
            <b>12 hari</b>
            <small>streak belajar</small>
          </div>
          <span>🔥</span>
        </div>
        <button className="logout" onClick={() => go("home")}>
          Keluar dari sesi
        </button>
      </div>
    </aside>
  );
}

function Header({
  search,
  setSearch,
  dark,
  setDark,
  setMobileNav,
  go,
  xp,
}: {
  search: string;
  setSearch: (x: string) => void;
  dark: boolean;
  setDark: (x: boolean) => void;
  setMobileNav: (x: boolean) => void;
  go: (x: Page) => void;
  xp: number;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={() => setMobileNav(true)}>
        <Menu size={20} />
      </button>
      <div className="search-box">
        <Search size={17} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari di kamus..."
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="top-actions">
        <div className="real-time-clock">
          <b>{now.toLocaleTimeString("id-ID", { hour12: false })}</b>
          <small>
            {now.toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </small>
        </div>
        <button className="lang">
          <Languages size={16} /> EN <ChevronDown size={13} />
        </button>
        <button className="icon-btn" onClick={() => setDark(!dark)}>
          {dark ? <Moon size={18} /> : <Lightbulb size={18} />}
        </button>
        <button className="icon-btn notify" onClick={() => go("notes")}>
          <Bell size={18} />
          <i />
        </button>
        <div className="top-stat">
          <Zap size={16} />
          <b>{xp.toLocaleString()}</b>
          <small>XP</small>
        </div>
        <div className="top-avatar">AR</div>
      </div>
    </header>
  );
}

function Dashboard({
  go,
  due,
  words,
  streak,
  xp,
  cardsOpened,
  todayStats,
  days,
}: {
  go: (p: Page) => void;
  due: number;
  words: Word[];
  streak: number;
  xp: number;
  cardsOpened: number;
  todayStats: DayStats;
  days: Record<string, DayStats>;
}) {
  const dailyPercent = Math.min(
    100,
    todayStats.goal
      ? Math.round((todayStats.studied / todayStats.goal) * 100)
      : 0,
  );
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const mondayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - mondayOffset);
  const weekDays = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ].map((label, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = localKey(date);
    return {
      label,
      key,
      done: (days[key]?.studied || 0) >= (days[key]?.goal || 20),
      active: (days[key]?.studied || 0) > 0,
      today: key === dayKey(),
    };
  });
  return (
    <>
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            MONDAY, 12 AUGUST 2024 <span className="dot" /> DAY {streak} OF YOUR
            STREAK
          </div>
          <h1>
            Belajar Bahasa Inggris<span className="blue-dot">.</span>
          </h1>
          <p>
            Bangun kemampuan bahasa Inggris dengan belajar sedikit demi sedikit
            setiap hari.
          </p>
        </div>
        <div className="welcome-actions">
          <button className="btn ghost" onClick={() => go("vocabulary")}>
            <BookOpen size={16} /> Kosakata Saya
          </button>
          <button className="btn primary" onClick={() => go("flashcards")}>
            <Play size={15} fill="currentColor" /> Mulai belajar
          </button>
        </div>
      </div>
      <div className="hero-grid">
        <section className="focus-card">
          <div className="focus-copy">
            <span className="pill purple">REKOMENDASI UNTUKMU</span>
            <h2>
              Waktunya mengulang
              <br />
              kosakata hari ini.
            </h2>
            <p>Review singkat hari ini membantu ingatanmu lebih tahan lama.</p>
            <button className="btn light" onClick={() => go("flashcards")}>
              Mulai belajar <ArrowRight size={16} />
            </button>
          </div>
          <div className="orb">
            <Brain size={48} />
            <span>+12 XP</span>
          </div>
        </section>
        <section className="streak-card">
          <div className="card-head">
            <span className="section-kicker">
              <Flame size={16} /> STREAK BELAJAR
            </span>
            <MoreHorizontal size={18} />
          </div>
          <div className="streak-number">
            {streak}
            <small>hari</small>
          </div>
          <div className="week">
            {weekDays.map((day) => (
              <span
                key={day.key}
                className={`${day.active ? "completed" : ""} ${day.today ? "today" : ""}`}
                title={day.label}
              >
                {day.label.slice(0, 2)}
              </span>
            ))}
          </div>
          <p>
            <b>{weekDays.filter((day) => day.active).length} hari aktif</b>{" "}
            minggu ini
          </p>
          <small className="streak-rule">
            Streak dihitung setelah target harian tercapai: 20 kartu.
          </small>
        </section>
      </div>
      <div className="stat-grid">
        <Stat
          icon={BookOpen}
          label="Total Kartu"
          value={words.length}
          note={`${todayStats.opened} kartu dibuka hari ini`}
        />
        <Stat
          icon={RotateCcw}
          label="Jatuh Tempo"
          value={due || 0}
          note="siap dipelajari"
          accent="orange"
        />
        <Stat
          icon={Zap}
          label="Total Tinjauan"
          value={todayStats.reviewed}
          note="review hari ini"
          accent="green"
        />
        <Stat
          icon={Target}
          label="Akurasi"
          value={`${todayStats.reviewed ? Math.round((todayStats.correct / todayStats.reviewed) * 100) : 0}%`}
          note="akurasi hari ini"
          accent="purple"
        />
      </div>
      <div className="section-title">
        <div>
          <h2>Progress belajarmu</h2>
          <p>Lihat perkembanganmu minggu ini.</p>
        </div>
        <button className="text-btn" onClick={() => go("stats")}>
          Lihat statistik <ArrowRight size={15} />
        </button>
      </div>
      <div className="progress-grid">
        <ProgressCard
          title="Kosakata"
          value={`${dailyPercent}%`}
          sub={`${todayStats.studied} dari ${todayStats.goal} kartu hari ini`}
          color="blue"
          icon={BookOpen}
        />
      </div>
      <div className="lower-grid">
        <section className="panel target-panel">
          <div className="card-head">
            <div>
              <h3>Target hari ini</h3>
              <p>Selangkah lebih dekat dengan tujuanmu.</p>
            </div>
            <button className="icon-btn">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="target-progress">
            <div className="ring">
              <b>{dailyPercent}</b>
              <small>%</small>
            </div>
            <div>
              <h3>Hampir selesai!</h3>
              <p>15 menit belajar hari ini</p>
              <div className="bar">
                <span style={{ width: `${dailyPercent}%` }} />
              </div>
              <small>
                {todayStats.studied} / {todayStats.goal} kartu
              </small>
            </div>
          </div>
          <button className="btn full-btn" onClick={() => go("flashcards")}>
            Lanjutkan belajar <ArrowRight size={16} />
          </button>
        </section>
        <section className="panel activity-panel">
          <div className="card-head">
            <div>
              <h3>Aktivitas belajar</h3>
              <p>Review kata yang paling sering muncul.</p>
            </div>
            <span className="select-sm">
              Minggu ini <ChevronDown size={13} />
            </span>
          </div>
          <MiniChart />
        </section>
      </div>
      <section className="panel dashboard-achievements">
        <div className="card-head">
          <div>
            <h3>Pencapaian Terbaru</h3>
            <p>
              {cardsOpened > 0
                ? "First Step"
                : "Buka kartu belajar untuk membuka pencapaian"}
            </p>
          </div>
          <button className="text-btn" onClick={() => go("achievements")}>
            Lihat semua pencapaian <ArrowRight size={14} />
          </button>
        </div>
        <div className="dashboard-achievement-list">
          <div>
            <span className="mini-achievement-icon">📖</span>
            <b>First Step</b>
            <small>Pelajari 1 kartu</small>
          </div>
          <div>
            <span className="mini-achievement-icon">🔥</span>
            <b>7 Day Streak</b>
            <small>Belajar 7 hari berturut-turut</small>
          </div>
          <div>
            <span className="mini-achievement-icon">⭐</span>
            <b>Review Starter</b>
            <small>Selesaikan 10 review kartu</small>
          </div>
          <strong>{cardsOpened > 0 ? "1 / 10" : "0 / 10"}</strong>
        </div>
      </section>
    </>
  );
}
function Stat({
  icon: Icon,
  label,
  value,
  note,
  accent = "blue",
}: {
  icon: any;
  label: string;
  value: any;
  note: string;
  accent?: string;
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${accent}`}>
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={accent === "orange" ? "warn" : ""}>{note}</small>
    </div>
  );
}
function ProgressCard({
  title,
  value,
  sub,
  color,
  icon: Icon,
}: {
  title: string;
  value: string;
  sub: string;
  color: string;
  icon: any;
}) {
  return (
    <div className="progress-card">
      <div className="card-head">
        <div className={`round-icon ${color}`}>
          <Icon size={18} />
        </div>
        <MoreHorizontal size={17} />
      </div>
      <div className="progress-main">
        <div>
          <h3>{title}</h3>
          <p>{sub}</p>
        </div>
        <b>{value}</b>
      </div>
      <div className="bar">
        <span
          className={color}
          style={{ width: value === "730" ? "73%" : value }}
        />
      </div>
    </div>
  );
}
function MiniChart() {
  return (
    <div className="chart">
      <div className="chart-labels">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
      <svg viewBox="0 0 620 130" preserveAspectRatio="none">
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6678ff" stopOpacity=".3" />
            <stop offset="1" stopColor="#6678ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 100 C45 92 65 56 105 70 S160 105 205 62 S255 50 292 76 S345 96 382 54 S430 33 470 57 S530 80 565 27 S600 42 620 18 L620 130 L0 130Z"
          fill="url(#fill)"
        />
        <path
          d="M0 100 C45 92 65 56 105 70 S160 105 205 62 S255 50 292 76 S345 96 382 54 S430 33 470 57 S530 80 565 27 S600 42 620 18"
          fill="none"
          stroke="#7181ff"
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}
function Decks({
  words,
  go,
  toast,
}: {
  words: Word[];
  go: (p: Page) => void;
  toast: (message: string) => void;
}) {
  const [decks, setDecks] = useState(
    () =>
      JSON.parse(localStorage.getItem("ziaedu-decks") || "[]") as {
        name: string;
        topic: string;
      }[],
  );
  const [name, setName] = useState("");
  const topics = Array.from(new Set(words.map((word) => word.topic)));
  const create = () => {
    if (!name.trim()) {
      toast("Beri nama deck dulu");
      return;
    }
    const next = [...decks, { name: name.trim(), topic: "Custom" }];
    setDecks(next);
    localStorage.setItem("ziaedu-decks", JSON.stringify(next));
    setName("");
    toast("Deck berhasil dibuat");
  };
  return (
    <div className="decks-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">RUANG KOSAKATA / DECK</div>
          <h1>
            Deck Saya<span className="blue-dot">.</span>
          </h1>
          <p>Kelompokkan kartu kosakata sesuai tujuan belajar kamu.</p>
        </div>
        <button className="btn ghost" onClick={() => go("vocabulary")}>
          <BookOpen size={16} /> Kembali ke kosakata
        </button>
      </div>
      <div className="deck-create panel">
        <div>
          <h3>Buat deck baru</h3>
          <p>Simpan kumpulan kartu untuk sesi belajar yang lebih terarah.</p>
        </div>
        <div className="deck-create-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama deck, contoh: Travel essentials"
          />
          <button className="btn primary" onClick={create}>
            <Plus size={16} /> Buat deck
          </button>
        </div>
      </div>
      <div className="deck-grid">
        {topics.map((topic) => (
          <div className="deck-card" key={topic}>
            <div className="deck-icon">
              <BookOpen size={21} />
            </div>
            <span className="pill blue">TOPIK</span>
            <h3>{topic}</h3>
            <p>
              {words.filter((word) => word.topic === topic).length} kartu ·{" "}
              {
                words.filter(
                  (word) => word.topic === topic && word.mastery >= 80,
                ).length
              }{" "}
              dikuasai
            </p>
            <div className="bar">
              <span
                style={{
                  width: `${words.filter((word) => word.topic === topic).length ? Math.round((words.filter((word) => word.topic === topic && word.mastery >= 80).length / words.filter((word) => word.topic === topic).length) * 100) : 0}%`,
                }}
              />
            </div>
            <button className="text-btn" onClick={() => go("flashcards")}>
              Mulai belajar <ArrowRight size={14} />
            </button>
          </div>
        ))}
        {decks.map((deck) => (
          <div className="deck-card custom-deck" key={deck.name}>
            <div className="deck-icon purple">
              <LayersIcon />
            </div>
            <span className="pill purple">CUSTOM</span>
            <h3>{deck.name}</h3>
            <p>Deck pribadi · siap diisi</p>
            <div className="bar">
              <span style={{ width: "0%" }} />
            </div>
            <button
              className="text-btn"
              onClick={() => toast(`${deck.name} dipilih`)}
            >
              Buka deck <ArrowRight size={14} />
            </button>
          </div>
        ))}
        {topics.length === 0 && decks.length === 0 && (
          <div className="empty">
            <BookOpen size={28} />
            <b>Belum ada deck</b>
            <span>Buat deck pertama kamu di atas.</span>
          </div>
        )}
      </div>
    </div>
  );
}
function LayersIcon() {
  return <LayoutGrid size={21} />;
}

function Vocabulary({
  words,
  setWords,
  search,
  setSearch,
  toast,
}: {
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  search: string;
  setSearch: (x: string) => void;
  toast: (x: string) => void;
}) {
  const [filter, setFilter] = useState("Semua");
  const [tab, setTab] = useState("all");
  const [importing, setImporting] = useState(false);
  const [detected, setDetected] = useState<Word[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    word: "",
    translation: "",
    definition: "",
    topic: "Daily Life",
    level: "B1",
  });
  const shown = words.filter(
    (w) =>
      (w.word + " " + w.translation + " " + w.topic)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "Semua" || w.level === filter) &&
      (tab === "all" || (tab === "favorite" && w.favorite)),
  );
  const toggle = (id: number) =>
    setWords((ws) => {
      const word = ws.find((w) => w.id === id);
      if (word)
        void fetch(`/api/words/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorite: !word.favorite }),
        });
      return ws.map((w) => (w.id === id ? { ...w, favorite: !w.favorite } : w));
    });
  const importPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      toast("Pilih file PDF yang valid");
      return;
    }
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        disableWorker: true,
      } as any).promise;
      let text = "";
      for (let page = 1; page <= pdf.numPages; page++) {
        const content = await pdf.getPage(page).then((p) => p.getTextContent());
        text +=
          " " +
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
      }
      const stop = new Set(
        "about after again also been being could every first from have into just more other over should some than that their there these they this through where which while with would your english bahasa untuk dalam dan yang dari adalah atau tidak".split(
          " ",
        ),
      );
      const unique = [
        ...new Set(
          (text.toLowerCase().match(/[a-z]{4,}/g) || []).filter(
            (word) => !stop.has(word),
          ),
        ),
      ].slice(0, 60);
      setDetected(
        unique.map((word, i) => ({
          id: Date.now() + i,
          word,
          translation: "Terjemahan akan ditambahkan",
          definition: "Kata terdeteksi dari dokumen pribadi kamu.",
          pos: "word",
          ipa: "",
          example: "",
          topic: "Imported PDF",
          level: "B1",
          mastery: 0,
          favorite: false,
          next: "Today",
          reviewed: false,
        })),
      );
      toast(`${unique.length} kata terdeteksi dari ${file.name}`);
    } catch (reason) {
      console.error("PDF import failed", reason);
      toast(
        "PDF tidak dapat dibaca. Pastikan PDF memiliki text layer, bukan hanya hasil scan gambar.",
      );
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };
  const saveDetected = () => {
    setWords((ws) => [...detected, ...ws]);
    void fetch("/api/words/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words: detected }),
    });
    toast(`${detected.length} kata disimpan ke Kosakata Saya`);
    setDetected([]);
  };
  const addWord = () => {
    if (!form.word.trim() || !form.translation.trim()) {
      toast("Isi kata dan terjemahannya dulu");
      return;
    }
    if (editId !== null) {
      setWords((ws) =>
        ws.map((word) =>
          word.id === editId
            ? {
                ...word,
                word: form.word.trim(),
                translation: form.translation.trim(),
                definition: form.definition,
                topic: form.topic,
                level: form.level,
              }
            : word,
        ),
      );
      void fetch(`/api/words/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      const newWord = {
        id: Date.now(),
        word: form.word.trim(),
        translation: form.translation.trim(),
        definition: form.definition || "Definisi dari catatan pribadi kamu.",
        pos: "word",
        ipa: "",
        example: "",
        topic: form.topic,
        level: form.level,
        mastery: 0,
        favorite: false,
        next: "Today",
        reviewed: false,
      };
      setWords((ws) => [newWord, ...ws]);
      void fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setForm({
      word: "",
      translation: "",
      definition: "",
      topic: "Daily Life",
      level: "B1",
    });
    setAddOpen(false);
    setEditId(null);
    toast(
      editId !== null
        ? "Kosakata berhasil diperbarui"
        : "Kosakata berhasil ditambahkan",
    );
  };
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">RUANG KOSAKATA · KOLEKSI PRIBADI</div>
          <h1>
            Kosakata Saya<span className="blue-dot">.</span>
          </h1>
          <p>Hanya kata-kata dari materi yang kamu pilih dan simpan sendiri.</p>
        </div>
        <div className="page-actions">
          <button
            className="btn ghost"
            onClick={() => {
              setEditId(null);
              setAddOpen(true);
            }}
          >
            <Plus size={17} /> Tambah kata
          </button>
          <label className="btn primary import-btn">
            <BookOpen size={17} /> {importing ? "Membaca PDF..." : "Import PDF"}
            <input
              type="file"
              accept="application/pdf"
              onChange={importPdf}
              hidden
            />
          </label>
        </div>
      </div>
      <div className="vocab-tabs">
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          Semua kata <b>{words.length}</b>
        </button>
        <button
          className={tab === "favorite" ? "active" : ""}
          onClick={() => setTab("favorite")}
        >
          Favorit <b>{words.filter((w) => w.favorite).length}</b>
        </button>
      </div>
      <div className="vocab-toolbar">
        <div className="search-box inner">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kata, arti, atau topik..."
          />
        </div>
        <div className="filter-wrap">
          <ListFilter size={16} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>Semua</option>
            <option>A1</option>
            <option>A2</option>
            <option>B1</option>
            <option>B2</option>
            <option>C1</option>
          </select>
        </div>
      </div>
      <div className="import-help">
        <FileTextIcon />
        <div>
          <b>Import dari materi belajar kamu</b>
          <span>
            Upload PDF artikel, buku, atau catatan. ZiaEdu akan mendeteksi kata
            bahasa Inggris untuk kamu pilih.
          </span>
        </div>
        <label className="text-btn">
          Pilih PDF
          <input
            type="file"
            accept="application/pdf"
            onChange={importPdf}
            hidden
          />
        </label>
      </div>
      <div className="vocab-overview">
        <div>
          <span>Total kosakata</span>
          <strong>{words.length}</strong>
          <small>kartu tersimpan</small>
        </div>
        <div>
          <span>Sudah dikuasai</span>
          <strong>{words.filter((w) => w.mastery >= 80).length}</strong>
          <small className="green-text">mastery ≥ 80%</small>
        </div>
        <div>
          <span>Perlu diulang</span>
          <strong>{words.filter((w) => w.next === "Today").length}</strong>
          <small className="orange-text">Jatuh tempo hari ini</small>
        </div>
      </div>
      <section className="panel vocab-panel">
        <div className="table-head">
          <div>
            <h3>Daftar kosakata</h3>
            <p>{shown.length} kata ditampilkan</p>
          </div>
          <button className="text-btn">
            Terbaru <ChevronDown size={14} />
          </button>
        </div>
        <div className="word-list">
          {shown.map((w) => (
            <div className="word-row" key={w.id}>
              <button
                className={`star-btn ${w.favorite ? "selected" : ""}`}
                onClick={() => toggle(w.id)}
              >
                <Star size={17} fill={w.favorite ? "currentColor" : "none"} />
              </button>
              <div className="word-main">
                <b>{w.word}</b>
                <span>
                  {w.ipa} <Volume2 size={13} />
                </span>
              </div>
              <div className="translation">
                <b>{w.translation}</b>
                <small>
                  {w.pos} · {w.topic}
                </small>
              </div>
              <div className="level-tag">{w.level}</div>
              <div className="mastery">
                <div className="bar">
                  <span style={{ width: `${w.mastery}%` }} />
                </div>
                <small>{w.mastery}%</small>
              </div>
              <div className="next-review">
                <small>Review berikutnya</small>
                <b className={w.next === "Today" ? "due" : ""}>{w.next}</b>
              </div>
              <button
                className="icon-btn"
                onClick={() => {
                  setEditId(w.id);
                  setForm({
                    word: w.word,
                    translation: w.translation,
                    definition: w.definition,
                    topic: w.topic,
                    level: w.level,
                  });
                  setAddOpen(true);
                }}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
        </div>
        {shown.length === 0 && (
          <div className="empty">
            <Search size={27} />
            <b>Kata tidak ditemukan</b>
            <span>Coba kata kunci atau level lain.</span>
          </div>
        )}
      </section>
      {addOpen && (
        <div className="modal-backdrop">
          <div className="import-modal add-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">KOSAKATA PRIBADI</span>
                <h2>
                  {editId !== null ? "Edit kosakata" : "Tambah kata baru"}
                </h2>
              </div>
              <button className="icon-btn" onClick={() => setAddOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-copy">
              {editId !== null
                ? "Perbarui detail kosakata kamu."
                : "Tambahkan kata yang kamu temukan sendiri ke daftar belajar."}
            </p>
            <div className="form-grid">
              <label>
                Kata bahasa Inggris
                <input
                  autoFocus
                  value={form.word}
                  onChange={(e) => setForm({ ...form, word: e.target.value })}
                  placeholder="contoh: deliberate"
                />
              </label>
              <label>
                Terjemahan
                <input
                  value={form.translation}
                  onChange={(e) =>
                    setForm({ ...form, translation: e.target.value })
                  }
                  placeholder="contoh: disengaja"
                />
              </label>
              <label>
                Definisi (opsional)
                <textarea
                  value={form.definition}
                  onChange={(e) =>
                    setForm({ ...form, definition: e.target.value })
                  }
                  placeholder="Jelaskan maknanya..."
                />
              </label>
              <label>
                Topik
                <select
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                >
                  <option>Daily Life</option>
                  <option>Travel</option>
                  <option>Work</option>
                  <option>Academic English</option>
                  <option>Technology</option>
                </select>
              </label>
              <label>
                Level
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                >
                  <option>A1</option>
                  <option>A2</option>
                  <option>B1</option>
                  <option>B2</option>
                  <option>C1</option>
                  <option>C2</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setAddOpen(false)}>
                Batal
              </button>
              <button className="btn primary" onClick={addWord}>
                <Check size={15} />{" "}
                {editId !== null ? "Simpan perubahan" : "Simpan kata"}
              </button>
            </div>
          </div>
        </div>
      )}
      {detected.length > 0 && (
        <div className="modal-backdrop">
          <div className="import-modal">
            <div className="modal-head">
              <div>
                <span className="eyebrow">HASIL IMPORT</span>
                <h2>{detected.length} kata terdeteksi</h2>
              </div>
              <button className="icon-btn" onClick={() => setDetected([])}>
                <X size={18} />
              </button>
            </div>
            <p className="modal-copy">
              Periksa hasil dari PDF sebelum menyimpannya ke Kosakata Saya. Arti
              dan contoh dapat kamu lengkapi nanti.
            </p>
            <div className="detected-list">
              {detected.map((w) => (
                <span key={w.id}>
                  {w.word}
                  <button
                    onClick={() =>
                      setDetected((ds) => ds.filter((x) => x.id !== w.id))
                    }
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setDetected([])}>
                Batal
              </button>
              <button className="btn primary" onClick={saveDetected}>
                <Check size={15} /> Simpan ke Kosakata Saya
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
function FileTextIcon() {
  return <BookText size={19} />;
}

function Flashcards({
  words,
  onReview,
  go,
  onCardOpened,
  onCardStudied,
}: {
  words: Word[];
  onReview: (id: number, g: string) => void;
  go: (p: Page) => void;
  onCardOpened: () => void;
  onCardStudied: () => void;
}) {
  const queue = words.filter((w) => !w.reviewed);
  const [index, setIndex] = useState(0);
  const [show, setShow] = useState(false);
  const card = queue[index % Math.max(1, queue.length)];
  useEffect(() => {
    if (card) onCardOpened();
  }, [card?.id]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (!show) onCardStudied();
        setShow(true);
      }
      if (show && ["1", "2", "3", "4"].includes(e.key)) {
        const grades = ["Again", "Hard", "Good", "Easy"];
        onReview(card.id, grades[Number(e.key) - 1]);
        setShow(false);
        setIndex((i) => i + 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [show, card, onReview]);
  if (!card)
    return (
      <div className="empty page-empty">
        <Check size={35} />
        <h2>Semua review selesai!</h2>
        <span>Kembali besok untuk menjaga streak kamu.</span>
      </div>
    );
  const answer = () => {
    if (!show) onCardStudied();
    setShow(true);
  };
  return (
    <div className="study-page">
      <div className="study-top">
        <button className="back-link" onClick={() => go("home")}>
          ← Kembali ke dashboard
        </button>
        <span className="study-counter">
          Kartu {index + 1} / {queue.length}
        </span>
        <span className="pill blue">Daily review</span>
      </div>
      <div className="study-progress">
        <span style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <div className="flashcard-wrap">
        <div className={`flashcard ${show ? "revealed" : ""}`}>
          <div className="flashcard-top">
            <span className="level-tag">{card.level}</span>
            <button className="star-btn selected">
              <Star size={19} fill="currentColor" />
            </button>
          </div>
          <div className="flash-word">
            <span className="topic-label">{card.topic}</span>
            <h1>{card.word}</h1>
            <p>
              {card.ipa}{" "}
              <button className="sound-btn">
                <Volume2 size={18} />
              </button>
            </p>
          </div>
          {!show ? (
            <button className="btn primary reveal-btn" onClick={answer}>
              Tampilkan jawaban <span>Space</span>
            </button>
          ) : (
            <div className="answer">
              <div className="answer-line">
                <b>{card.translation}</b>
                <span>{card.pos}</span>
              </div>
              <p>{card.definition}</p>
              <div className="example">
                <span>EXAMPLE</span>“{card.example}”
              </div>
              <div className="related">
                <div>
                  <small>SYNONYMS</small>
                  <b>strong · capable</b>
                </div>
                <div>
                  <small>TOPIC</small>
                  <b>{card.topic}</b>
                </div>
              </div>
            </div>
          )}
        </div>
        {show && (
          <div className="review-options">
            <p>Seberapa mudah kartu ini?</p>
            <div>
              <button
                className="review-btn again"
                onClick={() => {
                  onReview(card.id, "Again");
                  setShow(false);
                  setIndex((i) => i + 1);
                }}
              >
                <b>Again</b>
                <small>&lt; 1 min</small>
                <kbd>1</kbd>
              </button>
              <button
                className="review-btn hard"
                onClick={() => {
                  onReview(card.id, "Hard");
                  setShow(false);
                  setIndex((i) => i + 1);
                }}
              >
                <b>Hard</b>
                <small>1 day</small>
                <kbd>2</kbd>
              </button>
              <button
                className="review-btn good"
                onClick={() => {
                  onReview(card.id, "Good");
                  setShow(false);
                  setIndex((i) => i + 1);
                }}
              >
                <b>Good</b>
                <small>3 days</small>
                <kbd>3</kbd>
              </button>
              <button
                className="review-btn easy"
                onClick={() => {
                  onReview(card.id, "Easy");
                  setShow(false);
                  setIndex((i) => i + 1);
                }}
              >
                <b>Easy</b>
                <small>7 days</small>
                <kbd>4</kbd>
              </button>
            </div>
          </div>
        )}
        <div className="keyboard-hint">
          <span>
            <kbd>Space</kbd> tampilkan jawaban
          </span>
          <span>
            <kbd>1</kbd>—<kbd>4</kbd> pilih jawaban
          </span>
        </div>
      </div>
    </div>
  );
}

function Module({
  page,
  go,
  words,
  setWords,
  toast,
  xp,
  streak,
  cardsOpened,
  reviewCount,
  todayStats,
  days,
}: {
  page: Page;
  go: (p: Page) => void;
  words: Word[];
  setWords: React.Dispatch<React.SetStateAction<Word[]>>;
  toast: (x: string) => void;
  xp: number;
  streak: number;
  cardsOpened: number;
  reviewCount: number;
  todayStats: DayStats;
  days: Record<string, DayStats>;
}) {
  const info: Record<string, { title: string; desc: string; icon: any }> = {
    topics: {
      title: "Topik pembelajaran",
      desc: "Pilih topik yang paling dekat dengan tujuan belajarmu.",
      icon: LayoutGrid,
    },
    listening: {
      title: "Listening lab",
      desc: "Latih telinga, pahami konteks, dan dengarkan dengan percaya diri.",
      icon: Headphones,
    },
    pronunciation: {
      title: "Pronunciation studio",
      desc: "Perbaiki pengucapanmu satu suara demi satu suara.",
      icon: Mic2,
    },
    speaking: {
      title: "Speaking practice",
      desc: "Bicarakan ide-ide kamu dalam bahasa Inggris.",
      icon: MessageCircle,
    },
    games: {
      title: "Permainan bahasa",
      desc: "Belajar terasa lebih seru ketika kamu bermain.",
      icon: Gamepad2,
    },
    toeic: {
      title: "Ujian TOEIC",
      desc: "Latihan terarah untuk target skor TOEIC kamu.",
      icon: Target,
    },
    notes: {
      title: "Catatan Saya",
      desc: "Simpan insight penting dari perjalanan belajarmu.",
      icon: BookText,
    },
    stats: {
      title: "Statistik Belajar",
      desc: "Kenali pola belajarmu dan rayakan progresmu.",
      icon: BarChart3,
    },
    achievements: {
      title: "Pencapaian",
      desc: "Setiap langkah kecil layak dirayakan.",
      icon: Trophy,
    },
    settings: {
      title: "Pengaturan",
      desc: "Atur pengalaman belajar sesuai kebutuhanmu.",
      icon: Settings,
    },
    tutor: {
      title: "Zia Tutor",
      desc: "Teman belajar AI untuk membantu perjalanan bahasa Inggrismu.",
      icon: Sparkles,
    },
  };
  const x = info[page] || info.topics;
  const Icon = x.icon;
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ziaedu-notes") || "null");
      return Array.isArray(saved)
        ? saved
        : [
            "Small steps compound into remarkable results.",
            "Review new words before bedtime.",
          ];
    } catch {
      return [];
    }
  });
  const [lesson, setLesson] = useState<string | null>(null);
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">ZIaEDU / {page.toUpperCase()}</div>
          <h1>
            {x.title}
            <span className="blue-dot">.</span>
          </h1>
          <p>{x.desc}</p>
        </div>
        {page === "tutor" ? (
          <span className="pill purple">
            <Sparkles size={14} /> Mock AI active
          </span>
        ) : (
          <button
            className="btn primary"
            onClick={() => {
              if (page === "notes") toast("Catatan baru dibuat");
              else toast("Sesi baru dimulai");
            }}
          >
            <Play size={15} fill="currentColor" /> Mulai sesi
          </button>
        )}
      </div>
      <div className="module-hero">
        <div className="module-symbol">
          <Icon size={35} />
        </div>
        <div>
          <h2>
            {page === "tutor"
              ? "Apa yang ingin kamu pelajari hari ini?"
              : "Belajar dengan ritme yang cocok untukmu."}
          </h2>
          <p>
            {page === "tutor"
              ? "Tanyakan grammar, minta koreksi kalimat, atau mulai percakapan."
              : "Materi pilihan berdasarkan level B1 dan progres terakhir kamu."}
          </p>
        </div>
      </div>
      {lesson ? (
        <LessonDetail title={lesson} goBack={() => setLesson(null)} go={go} />
      ) : page === "speaking" ? (
        <SpeakingPractice />
      ) : page === "notes" ? (
        <div className="notes-area">
          <div className="note-compose">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tulis catatan baru..."
            />
            <button
              className="btn primary"
              onClick={() => {
                if (note) {
                  const nextNotes = [note.trim(), ...notes];
                  setNotes(nextNotes);
                  localStorage.setItem(
                    "ziaedu-notes",
                    JSON.stringify(nextNotes),
                  );
                  setNote("");
                  toast("Catatan tersimpan");
                }
              }}
            >
              <Plus size={16} /> Simpan catatan
            </button>
          </div>
          {notes.map((n, i) => (
            <div className="note-item" key={i}>
              <div className="note-pin">
                <BookText size={16} />
              </div>
              <div>
                <b>{n}</b>
                <small>Catatan belajar · baru saja</small>
              </div>
              <button
                className="icon-btn note-menu"
                title="Hapus catatan"
                onClick={() => {
                  if (window.confirm("Hapus catatan ini?")) {
                    const nextNotes = notes.filter((_, index) => index !== i);
                    setNotes(nextNotes);
                    localStorage.setItem(
                      "ziaedu-notes",
                      JSON.stringify(nextNotes),
                    );
                    toast("Catatan dihapus");
                  }
                }}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : page === "tutor" ? (
        <Tutor toast={toast} />
      ) : page === "stats" ? (
        <Statistics
          days={days}
          todayStats={todayStats}
          streak={streak}
          words={words}
        />
      ) : page === "achievements" ? (
        <Achievements
          cardsOpened={cardsOpened}
          reviewCount={reviewCount}
          streak={streak}
          toast={toast}
        />
      ) : (
        <div className="module-grid">
          {[
            "Daily Life",
            "Travel & Culture",
            "Work & Business",
            "Academic English",
            "Technology & AI",
            "TOEIC Essentials",
          ].map((t, i) => (
            <div className="lesson-card" key={t}>
              <div className={`lesson-art art-${i}`}>
                <span>{["Aa", "✈", "◈", "∑", "⌘", "730"][i]}</span>
              </div>
              <div>
                <span className="pill blue">{i % 2 ? "B1" : "B2"}</span>
                <h3>{t}</h3>
                <p>
                  {i + 3} lessons · {12 + i * 4} words
                </p>
                <button className="text-btn" onClick={() => setLesson(t)}>
                  Lihat materi <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
type Achievement = {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  type: string;
  value: number;
  reward: number;
};
const legacyAchievementDefs: Achievement[] = [
  {
    id: "first-word",
    name: "First Word",
    description: "Pelajari 1 kosakata.",
    category: "Vocabulary",
    icon: "📚",
    type: "words",
    value: 1,
    reward: 10,
  },
  {
    id: "vocab-explorer",
    name: "Vocabulary Explorer",
    description: "Pelajari 100 kosakata.",
    category: "Vocabulary",
    icon: "📚",
    type: "words",
    value: 100,
    reward: 50,
  },
  {
    id: "vocab-builder",
    name: "Vocabulary Builder",
    description: "Pelajari 500 kosakata.",
    category: "Vocabulary",
    icon: "📚",
    type: "words",
    value: 500,
    reward: 75,
  },
  {
    id: "vocab-master",
    name: "Vocabulary Master",
    description: "Kuasai 1,000 kosakata.",
    category: "Vocabulary",
    icon: "🏆",
    type: "mastered",
    value: 1000,
    reward: 100,
  },
  {
    id: "word-collector",
    name: "Word Collector",
    description: "Tambahkan 100 kosakata ke koleksi.",
    category: "Vocabulary",
    icon: "📖",
    type: "words",
    value: 100,
    reward: 40,
  },
  {
    id: "first-listen",
    name: "First Listen",
    description: "Selesaikan 1 latihan listening.",
    category: "Listening",
    icon: "🎧",
    type: "listening",
    value: 1,
    reward: 10,
  },
  {
    id: "good-listener",
    name: "Good Listener",
    description: "Selesaikan 50 latihan listening.",
    category: "Listening",
    icon: "🎧",
    type: "listening",
    value: 50,
    reward: 50,
  },
  {
    id: "listening-master",
    name: "Listening Master",
    description: "Selesaikan 100 latihan listening.",
    category: "Listening",
    icon: "🎧",
    type: "listening",
    value: 100,
    reward: 100,
  },
  {
    id: "first-speaker",
    name: "First Speaker",
    description: "Selesaikan 1 latihan speaking.",
    category: "Speaking",
    icon: "🎤",
    type: "speaking",
    value: 1,
    reward: 15,
  },
  {
    id: "confident-speaker",
    name: "Confident Speaker",
    description: "Selesaikan 25 latihan speaking.",
    category: "Speaking",
    icon: "🎤",
    type: "speaking",
    value: 25,
    reward: 60,
  },
  {
    id: "speaking-master",
    name: "Speaking Master",
    description: "Selesaikan 100 latihan speaking.",
    category: "Speaking",
    icon: "🎤",
    type: "speaking",
    value: 100,
    reward: 120,
  },
  {
    id: "first-game",
    name: "First Game",
    description: "Selesaikan 1 permainan.",
    category: "Games",
    icon: "🎮",
    type: "games",
    value: 1,
    reward: 10,
  },
  {
    id: "game-player",
    name: "Game Player",
    description: "Selesaikan 50 permainan.",
    category: "Games",
    icon: "🎮",
    type: "games",
    value: 50,
    reward: 50,
  },
  {
    id: "game-master",
    name: "Game Master",
    description: "Dapatkan 10 skor sempurna.",
    category: "Games",
    icon: "🎮",
    type: "games",
    value: 10,
    reward: 100,
  },
  {
    id: "toeic-beginner",
    name: "TOEIC Beginner",
    description: "Selesaikan latihan TOEIC pertama.",
    category: "TOEIC",
    icon: "📝",
    type: "toeic",
    value: 1,
    reward: 15,
  },
  {
    id: "toeic-practice",
    name: "TOEIC Practice",
    description: "Selesaikan 50 soal TOEIC.",
    category: "TOEIC",
    icon: "📝",
    type: "toeic",
    value: 50,
    reward: 60,
  },
  {
    id: "toeic-challenger",
    name: "TOEIC Challenger",
    description: "Selesaikan 10 mock test.",
    category: "TOEIC",
    icon: "📝",
    type: "toeic",
    value: 10,
    reward: 80,
  },
  {
    id: "toeic-master",
    name: "TOEIC Master",
    description: "Dapatkan skor TOEIC 800+.",
    category: "TOEIC",
    icon: "🏆",
    type: "toeicScore",
    value: 800,
    reward: 150,
  },
  {
    id: "first-day",
    name: "First Day",
    description: "Belajar selama 1 hari.",
    category: "Learning Streak",
    icon: "🔥",
    type: "streak",
    value: 1,
    reward: 10,
  },
  {
    id: "seven-streak",
    name: "7 Day Streak",
    description: "Belajar 7 hari berturut-turut.",
    category: "Learning Streak",
    icon: "🔥",
    type: "streak",
    value: 7,
    reward: 35,
  },
  {
    id: "thirty-streak",
    name: "30 Day Streak",
    description: "Belajar 30 hari berturut-turut.",
    category: "Learning Streak",
    icon: "🔥",
    type: "streak",
    value: 30,
    reward: 100,
  },
  {
    id: "hundred-streak",
    name: "100 Day Streak",
    description: "Belajar 100 hari berturut-turut.",
    category: "Learning Streak",
    icon: "🔥",
    type: "streak",
    value: 100,
    reward: 250,
  },
  {
    id: "consistency",
    name: "Consistency Master",
    description: "Belajar selama 365 hari.",
    category: "Learning Streak",
    icon: "🔥",
    type: "streak",
    value: 365,
    reward: 500,
  },
  {
    id: "daily-starter",
    name: "Daily Starter",
    description: "Selesaikan target harian pertama.",
    category: "Daily Goals",
    icon: "🎯",
    type: "daily",
    value: 1,
    reward: 10,
  },
  {
    id: "daily-learner",
    name: "Daily Learner",
    description: "Selesaikan target harian 7 kali.",
    category: "Daily Goals",
    icon: "🎯",
    type: "daily",
    value: 7,
    reward: 30,
  },
  {
    id: "daily-champion",
    name: "Daily Champion",
    description: "Selesaikan target harian 30 kali.",
    category: "Daily Goals",
    icon: "🎯",
    type: "daily",
    value: 30,
    reward: 80,
  },
  {
    id: "xp-starter",
    name: "XP Starter",
    description: "Dapatkan 100 XP.",
    category: "XP",
    icon: "⭐",
    type: "xp",
    value: 100,
    reward: 10,
  },
  {
    id: "xp-hunter",
    name: "XP Hunter",
    description: "Dapatkan 1,000 XP.",
    category: "XP",
    icon: "⭐",
    type: "xp",
    value: 1000,
    reward: 50,
  },
  {
    id: "xp-master",
    name: "XP Master",
    description: "Dapatkan 10,000 XP.",
    category: "XP",
    icon: "⭐",
    type: "xp",
    value: 10000,
    reward: 150,
  },
  {
    id: "first-pronunciation",
    name: "First Pronunciation",
    description: "Selesaikan 1 latihan pronunciation.",
    category: "Pronunciation",
    icon: "🔊",
    type: "pronunciation",
    value: 1,
    reward: 10,
  },
  {
    id: "clear-speaker",
    name: "Clear Speaker",
    description: "Dapatkan skor pronunciation 80+ sebanyak 10 kali.",
    category: "Pronunciation",
    icon: "🔊",
    type: "pronunciation",
    value: 10,
    reward: 50,
  },
  {
    id: "pronunciation-master",
    name: "Pronunciation Master",
    description: "Dapatkan skor pronunciation 90+ sebanyak 50 kali.",
    category: "Pronunciation",
    icon: "🔊",
    type: "pronunciation",
    value: 50,
    reward: 100,
  },
];
const achievementDefs: Achievement[] = [
  {
    id: "first-step",
    name: "First Step",
    description: "Pelajari 1 kartu.",
    category: "Vocabulary",
    icon: "📖",
    type: "words",
    value: 1,
    reward: 10,
  },
  {
    id: "vocabulary-beginner",
    name: "Vocabulary Beginner",
    description: "Pelajari 10 kartu.",
    category: "Vocabulary",
    icon: "📚",
    type: "words",
    value: 10,
    reward: 20,
  },
  {
    id: "vocabulary-learner",
    name: "Vocabulary Learner",
    description: "Pelajari 50 kartu.",
    category: "Vocabulary",
    icon: "📚",
    type: "words",
    value: 50,
    reward: 40,
  },
  {
    id: "vocabulary-builder",
    name: "Vocabulary Builder",
    description: "Pelajari 100 kartu.",
    category: "Vocabulary",
    icon: "📚",
    type: "words",
    value: 100,
    reward: 60,
  },
  {
    id: "vocabulary-master",
    name: "Vocabulary Master",
    description: "Kuasai 500 kartu.",
    category: "Vocabulary",
    icon: "🏆",
    type: "mastered",
    value: 500,
    reward: 100,
  },
  {
    id: "review-starter",
    name: "Review Starter",
    description: "Selesaikan 10 review kartu.",
    category: "Vocabulary",
    icon: "🔄",
    type: "reviews",
    value: 10,
    reward: 20,
  },
  {
    id: "review-learner",
    name: "Review Learner",
    description: "Selesaikan 100 review kartu.",
    category: "Vocabulary",
    icon: "🔄",
    type: "reviews",
    value: 100,
    reward: 50,
  },
  {
    id: "three-day-streak",
    name: "3 Day Streak",
    description: "Belajar selama 3 hari berturut-turut.",
    category: "Vocabulary",
    icon: "🔥",
    type: "streak",
    value: 3,
    reward: 20,
  },
  {
    id: "seven-day-streak",
    name: "7 Day Streak",
    description: "Belajar selama 7 hari berturut-turut.",
    category: "Vocabulary",
    icon: "🔥",
    type: "streak",
    value: 7,
    reward: 40,
  },
  {
    id: "thirty-day-streak",
    name: "30 Day Streak",
    description: "Belajar selama 30 hari berturut-turut.",
    category: "Vocabulary",
    icon: "🔥",
    type: "streak",
    value: 30,
    reward: 100,
  },
];
function LegacyAchievements({
  words,
  cardsOpened,
  reviewCount,
  streak,
  toast,
}: {
  words: Word[];
  cardsOpened: number;
  reviewCount: number;
  streak: number;
  toast: (message: string) => void;
}) {
  const [selected, setSelected] = useState<Achievement | null>(null);
  const [celebration, setCelebration] = useState<Achievement | null>(null);
  const metrics: Record<string, number> = {
    words: cardsOpened,
    mastered: words.filter((w) => w.mastery >= 80).length,
    streak,
    reviews: reviewCount,
  };
  const getProgress = (achievement: Achievement) =>
    Math.min(metrics[achievement.type] || 0, achievement.value);
  const unlocked = achievementDefs.filter((a) => getProgress(a) >= a.value);
  useEffect(() => {
    const seen = JSON.parse(
      localStorage.getItem("ziaedu-achievements") || "[]",
    ) as string[];
    const fresh = unlocked.find((a) => !seen.includes(a.id));
    if (fresh) {
      localStorage.setItem(
        "ziaedu-achievements",
        JSON.stringify([...new Set([...seen, ...unlocked.map((a) => a.id)])]),
      );
      setCelebration(fresh);
      toast(`Pencapaian terbuka: ${fresh.name}`);
      const timer = window.setTimeout(() => setCelebration(null), 5000);
      return () => window.clearTimeout(timer);
    }
  }, [unlocked.length]);
  const visible = achievementDefs;
  return (
    <div className="achievement-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">ZIaEDU / GAMIFICATION</div>
          <h1>
            Pencapaian Saya<span className="blue-dot">.</span>
          </h1>
          <p>
            Setiap langkah kecil dalam perjalanan belajar kamu tercatat di sini.
          </p>
        </div>
        <span className="pill purple">
          <Trophy size={14} /> {unlocked.length} terbuka
        </span>
      </div>
      <section className="achievement-overview panel">
        <div className="achievement-count">
          <strong>
            {unlocked.length} <small>/ {achievementDefs.length}</small>
          </strong>
          <span>Pencapaian Terbuka</span>
        </div>
        <div className="achievement-progress">
          <div className="bar">
            <span
              style={{
                width: `${(unlocked.length / achievementDefs.length) * 100}%`,
              }}
            />
          </div>
          <small>
            {achievementDefs.length - unlocked.length} pencapaian masih terkunci
          </small>
        </div>
        <div className="achievement-stats">
          <span>
            <b>{achievementDefs.length}</b>Total
          </span>
          <span className="green-text">
            <b>{unlocked.length}</b>Terbuka
          </span>
          <span className="orange-text">
            <b>{achievementDefs.length - unlocked.length}</b>Terkunci
          </span>
        </div>
      </section>
      <div className="achievement-grid">
        {visible.map((a) => {
          const progress = getProgress(a);
          const isUnlocked = progress >= a.value;
          return (
            <button
              className={`achievement-card ${isUnlocked ? "unlocked" : "locked"}`}
              key={a.id}
              onClick={() => setSelected(a)}
            >
              <div className="achievement-icon">
                {isUnlocked ? a.icon : "🔒"}
              </div>
              <div className="achievement-card-body">
                <span className="achievement-category">{a.category}</span>
                <h3>{a.name}</h3>
                <p>{a.description}</p>
                <div className="achievement-card-progress">
                  <div className="bar">
                    <span style={{ width: `${(progress / a.value) * 100}%` }} />
                  </div>
                  <small>
                    {progress} / {a.value}
                  </small>
                </div>
              </div>
              <div className="achievement-reward">
                {isUnlocked ? (
                  <>
                    <Check size={13} /> Terbuka
                  </>
                ) : (
                  "🔒 Belum terbuka"
                )}
              </div>
              {isUnlocked && (
                <small className="achievement-unlock-date">
                  Dibuka pada {new Date().toLocaleDateString("id-ID")}
                </small>
              )}
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="modal-backdrop">
          <div className="import-modal achievement-modal">
            <div className="modal-head">
              <div className="achievement-detail-icon">
                {getProgress(selected) >= selected.value ? selected.icon : "🔒"}
              </div>
              <button className="icon-btn" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <span className="achievement-category">{selected.category}</span>
            <h2>{selected.name}</h2>
            <p className="modal-copy">{selected.description}</p>
            <div className="detail-requirement">
              <span>Progress saat ini</span>
              <b>
                {getProgress(selected)} / {selected.value}
              </b>
              <div className="bar">
                <span
                  style={{
                    width: `${(getProgress(selected) / selected.value) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="achievement-detail-meta">
              <span>
                Progress{" "}
                <b>
                  {getProgress(selected)} / {selected.value}
                </b>
              </span>
              <span>
                Status{" "}
                <b>
                  {getProgress(selected) >= selected.value
                    ? "Unlocked"
                    : "Locked"}
                </b>
              </span>
            </div>
            {getProgress(selected) >= selected.value && (
              <p className="achievement-unlocked-date">
                Dibuka pada {new Date().toLocaleDateString("id-ID")}
              </p>
            )}
            {getProgress(selected) < selected.value && (
              <p className="locked-message">
                Terus belajar untuk membuka pencapaian ini.
              </p>
            )}
            <button
              className="btn primary full-btn"
              onClick={() => setSelected(null)}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
      {celebration && (
        <div className="achievement-toast">
          <div className="celebration-icon">🎉</div>
          <div>
            <small>PENCAPAIAN BARU!</small>
            <b>
              {celebration.icon} {celebration.name}
            </b>
            <span>{celebration.description}</span>
          </div>
          <button
            className="icon-btn"
            onClick={() => {
              setSelected(celebration);
              setCelebration(null);
            }}
          >
            <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
function Achievements({
  cardsOpened,
  reviewCount,
  streak,
}: {
  cardsOpened: number;
  reviewCount: number;
  streak: number;
  toast: (message: string) => void;
}) {
  const target = 20;
  const todayKey = localKey();
  const [range, setRange] = useState("week");
  const [daily] = useState<Record<string, number>>(() => {
    const stored = JSON.parse(
      localStorage.getItem("ziaedu-daily-stats") || "{}",
    );
    return Object.fromEntries(
      Object.entries(stored).map(([key, value]) => [
        key,
        (value as DayStats).studied,
      ]),
    );
  });
  const today = Math.min(daily[todayKey] || 0, target);
  const percentage = Math.min(100, Math.round((today / target) * 100));
  const yesterdayKey = new Date(Date.now() - 86400000)
    .toISOString()
    .slice(0, 10);
  const yesterday = Math.min(daily[yesterdayKey] || 0, target);
  const change = percentage - Math.round((yesterday / target) * 100);
  const dateList = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return {
      key: localKey(d),
      label: d
        .toLocaleDateString("id-ID", { weekday: "short" })
        .replace(".", ""),
      value: Math.min(
        100,
        Math.round(((daily[localKey(d)] || 0) / target) * 100),
      ),
    };
  });
  const average = Math.round(
    dateList.reduce((sum, item) => sum + item.value, 0) / dateList.length,
  );
  const completedDays = dateList.filter((item) => item.value > 0).length;
  const mastered = 0;
  const reviewProgress = Math.min(
    100,
    Math.round((reviewCount / target) * 100),
  );
  return (
    <div className="achievement-page ranking-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">ZIaEDU / DAILY PROGRESS</div>
          <h1>
            Pencapaian Saya<span className="blue-dot">.</span>
          </h1>
          <p>Ukur konsistensi belajar kosakata kamu setiap hari.</p>
        </div>
        <select
          className="select-sm range-select"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="today">Hari Ini</option>
          <option value="week">Minggu Ini</option>
          <option value="month">Bulan Ini</option>
        </select>
      </div>
      <div className="ranking-summary">
        <div>
          <span>Pencapaian hari ini</span>
          <strong>{percentage}%</strong>
          <small className={change >= 0 ? "green-text" : "orange-text"}>
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% dibandingkan kemarin
          </small>
        </div>
        <div>
          <span>Kemarin</span>
          <strong>{Math.round((yesterday / target) * 100)}%</strong>
          <small>
            {yesterday} / {target} kartu
          </small>
        </div>
        <div>
          <span>Current streak</span>
          <strong>🔥 {streak}</strong>
          <small>hari berturut-turut</small>
        </div>
        <div>
          <span>Weekly average</span>
          <strong>{average}%</strong>
          <small>{completedDays} hari aktif minggu ini</small>
        </div>
        <div>
          <span>Current ranking</span>
          <strong>#1</strong>
          <small>papan minggu ini</small>
        </div>
      </div>
      <div className="ranking-main-grid">
        <section className="panel daily-progress-card">
          <div className="card-head">
            <div>
              <h3>Progress Hari Ini</h3>
              <p>Target harian: {target} kartu kosakata</p>
            </div>
            <span className="pill blue">
              {today} / {target} kartu
            </span>
          </div>
          <div className="progress-ring-wrap">
            <div
              className="progress-ring"
              style={
                {
                  "--progress": `${percentage * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <b>{percentage}%</b>
              <small>tercapai</small>
            </div>
            <div>
              <h3>
                {today >= target
                  ? "Target selesai!"
                  : `${target - today} kartu lagi`}
              </h3>
              <p>Kartu dibuka: {cardsOpened}</p>
              <p>Review selesai: {reviewCount}</p>
              <p>Kartu dikuasai: {mastered}</p>
              <div className="bar">
                <span style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </div>
        </section>
      </div>
      <section className="panel day-chart-card">
        <div className="card-head">
          <div>
            <h3>Progress harian</h3>
            <p>Lihat apakah performamu meningkat dari hari ke hari.</p>
          </div>
          <span className="chart-total">
            {change >= 0 ? "↑" : "↓"} {Math.abs(change)}% kemarin
          </span>
        </div>
        <div className="daily-bars">
          {dateList.map((day) => (
            <div className="daily-column" key={day.key}>
              <b>{day.value}%</b>
              <div className="daily-bar">
                <span style={{ height: `${Math.max(day.value, 4)}%` }} />
              </div>
              <small>{day.label}</small>
            </div>
          ))}
        </div>
      </section>
      <section className="panel streak-week">
        <div className="card-head">
          <div>
            <h3>🔥 Learning streak</h3>
            <p>Jaga ritmemu setiap hari.</p>
          </div>
          <strong className="streak-large">{streak} hari</strong>
        </div>
        <div className="streak-days">
          {dateList.map((day) => (
            <div key={day.key}>
              <span className={day.value > 0 ? "done" : ""}>
                {day.value > 0 ? "✓" : "·"}
              </span>
              <small>{day.label.slice(0, 1).toUpperCase()}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function Statistics({
  days,
  todayStats,
  streak,
  words,
}: {
  days: Record<string, DayStats>;
  todayStats: DayStats;
  streak: number;
  words: Word[];
}) {
  const labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const recent = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000);
    return days[localKey(date)] || blankDay();
  });
  const activity = recent.map((day) =>
    Math.min(100, Math.round(day.seconds / 60)),
  );
  const accuracy = recent.map((day) =>
    day.reviewed ? Math.round((day.correct / day.reviewed) * 100) : 0,
  );
  const learned = recent.reduce((sum, day) => sum + day.studied, 0);
  const mastered = recent.reduce((sum, day) => sum + day.mastered, 0);
  const reviews = recent.reduce((sum, day) => sum + day.reviewed, 0);
  const seconds = recent.reduce((sum, day) => sum + day.seconds, 0);
  const accuracyTotal = reviews
    ? Math.round(
        (recent.reduce((sum, day) => sum + day.correct, 0) / reviews) * 100,
      )
    : 0;
  const formatTime = (value: number) =>
    `${Math.floor(value / 3600)}j ${Math.floor((value % 3600) / 60)}m`;
  return (
    <div className="stats-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">ZIaEDU / INSIGHT BELAJAR</div>
          <h1>
            Statistik Belajar<span className="blue-dot">.</span>
          </h1>
          <p>
            Lihat pola belajar dan perkembangan bahasa Inggris kamu secara lebih
            detail.
          </p>
        </div>
      </div>
      <div className="stats-summary">
        <Stat
          icon={BookOpen}
          label="Kata dipelajari"
          value={learned}
          note="kartu dipelajari minggu ini"
        />
        <Stat
          icon={Trophy}
          label="Kata dikuasai"
          value={mastered}
          note="kartu mastered minggu ini"
          accent="green"
        />
        <Stat
          icon={RotateCcw}
          label="Total review"
          value={reviews}
          note={`${accuracyTotal}% akurasi aktual`}
          accent="purple"
        />
        <Stat
          icon={Flame}
          label="Waktu belajar"
          value={formatTime(seconds)}
          note="waktu aktif minggu ini"
          accent="orange"
        />
      </div>
      <div className="stats-grid">
        <section className="panel analytics-card">
          <div className="card-head">
            <div>
              <h3>Aktivitas belajar</h3>
              <p>Menit belajar per hari</p>
            </div>
            <span className="chart-total">{formatTime(seconds)}</span>
          </div>
          <div className="large-chart">
            <div className="y-axis">
              <span>60</span>
              <span>40</span>
              <span>20</span>
              <span>0</span>
            </div>
            <div className="bars">
              {activity.map((value, i) => (
                <div className="bar-column" key={labels[i]}>
                  <div className="activity-bar" style={{ height: `${value}%` }}>
                    <b>{value}</b>
                  </div>
                  <small>{labels[i]}</small>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel analytics-card">
          <div className="card-head">
            <div>
              <h3>Akurasi review</h3>
              <p>Performa jawaban kamu</p>
            </div>
            <span className="chart-total green-text">{accuracyTotal}%</span>
          </div>
          <div className="line-chart">
            <svg viewBox="0 0 600 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="statsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#54d7a2" stopOpacity=".28" />
                  <stop offset="1" stopColor="#54d7a2" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 130 C70 125 72 90 145 105 S220 130 285 72 S350 88 410 72 S490 80 600 28 L600 180 L0 180Z"
                fill="url(#statsFill)"
              />
              <path
                d="M0 130 C70 125 72 90 145 105 S220 130 285 72 S350 88 410 72 S490 80 600 28"
                fill="none"
                stroke="#54d7a2"
                strokeWidth="3"
              />
            </svg>
            <div className="chart-labels">
              {labels.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </section>
        <section className="panel analytics-card">
          <div className="card-head">
            <div>
              <h3>Pertumbuhan kosakata</h3>
              <p>Total kata tersimpan</p>
            </div>
            <span className="chart-total">{words.length}</span>
          </div>
          <div className="growth-chart">
            <div className="growth-line">
              {recent.map((day, index) => (
                <span
                  key={index}
                  style={{ height: `${Math.min(100, day.studied * 5)}%` }}
                />
              ))}
            </div>
            <div className="chart-labels">
              {labels.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </section>
        <section className="panel analytics-card mastered-card">
          <div className="card-head">
            <div>
              <h3>Status penguasaan</h3>
              <p>Distribusi semua kartu kamu</p>
            </div>
          </div>
          <div className="mastered-visual">
            <div className="donut">
              <b>{words.length}</b>
              <small>total kartu</small>
            </div>
            <div className="legend">
              <span>
                <i className="legend-mastered" />
                Dikuasai{" "}
                <b>{words.filter((word) => word.mastery >= 80).length}</b>
              </span>
              <span>
                <i className="legend-review" />
                Ditinjau <b>{reviews}</b>
              </span>
              <span>
                <i className="legend-learning" />
                Dipelajari <b>{learned}</b>
              </span>
            </div>
          </div>
        </section>
      </div>
      <section className="panel weekly-detail">
        <div className="card-head">
          <div>
            <h3>Ringkasan minggu ini</h3>
            <p>Dibandingkan dengan minggu sebelumnya.</p>
          </div>
          <span className="pill purple">
            {learned
              ? `${Math.round(learned / 7)} kartu / hari`
              : "Belum ada aktivitas"}
          </span>
        </div>
        <div className="weekly-row">
          <div>
            <span>Hari aktif</span>
            <b>{recent.filter((day) => day.studied > 0).length} / 7</b>
            <small className="green-text">data aktual</small>
          </div>
          <div>
            <span>Rata-rata sesi</span>
            <b>
              {recent.filter((day) => day.seconds > 0).length
                ? Math.round(
                    seconds /
                      60 /
                      recent.filter((day) => day.seconds > 0).length,
                  )
                : 0}{" "}
              menit
            </b>
            <small className="green-text">rata-rata aktual</small>
          </div>
          <div>
            <span>Review terbaik</span>
            <b>
              {
                labels[
                  recent.reduce(
                    (best, day, index) =>
                      day.reviewed > recent[best].reviewed ? index : best,
                    0,
                  )
                ]
              }
            </b>
            <small>
              {Math.max(...recent.map((day) => day.reviewed))} kartu
            </small>
          </div>
          <div>
            <span>Streak saat ini</span>
            <b>{streak} hari</b>
            <small className="orange-text">data aktual</small>
          </div>
        </div>
      </section>
    </div>
  );
}
function SpeakingPractice() {
  const topics = [
    {
      name: "My daily routine",
      prompt: "Tell us about your typical day from morning until night.",
    },
    {
      name: "A memorable journey",
      prompt: "Describe a trip that taught you something new.",
    },
    {
      name: "My future goals",
      prompt: "Talk about one goal you want to achieve and why it matters.",
    },
  ];
  const [topic, setTopic] = useState(0);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<
    {
      topic: string;
      date: string;
      duration: number;
      score: number;
      url: string;
    }[]
  >([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    fetch("/api/speaking/recordings")
      .then((response) => (response.ok ? response.json() : []))
      .then((items) =>
        setHistory(
          items.map(
            (item: {
              topic: string;
              created_at: string;
              duration: number;
              audio_file_url: string;
            }) => ({
              topic: item.topic,
              date: new Date(item.created_at).toLocaleDateString("id-ID"),
              duration: item.duration,
              score: 84,
              url: item.audio_file_url,
            }),
          ),
        ),
      )
      .catch(() => undefined);
  }, []);
  const format = (value: number) =>
    `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  const reset = () => {
    setAudioUrl("");
    setBlob(null);
    setSaved(false);
    setSeconds(0);
    setError("");
  };
  const start = async () => {
    setError("");
    reset();
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Browser ini belum mendukung perekaman suara.");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const instance = new MediaRecorder(stream.current, { mimeType: mime });
      chunks.current = [];
      instance.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      instance.onstop = () => {
        const result = new Blob(chunks.current, {
          type: instance.mimeType || "audio/webm",
        });
        setBlob(result);
        setAudioUrl(URL.createObjectURL(result));
        stream.current?.getTracks().forEach((track) => track.stop());
        setRecording(false);
        if (timer.current) window.clearInterval(timer.current);
      };
      instance.onerror = () =>
        setError("Perekaman mengalami masalah. Silakan coba lagi.");
      recorder.current = instance;
      instance.start();
      setRecording(true);
      timer.current = window.setInterval(
        () => setSeconds((value) => value + 1),
        1000,
      );
    } catch (reason) {
      setError(
        reason instanceof DOMException && reason.name === "NotAllowedError"
          ? "Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser lalu coba lagi."
          : "Mikrofon tidak ditemukan atau sedang digunakan aplikasi lain.",
      );
    }
  };
  const stop = () => {
    if (recorder.current?.state !== "inactive") recorder.current?.stop();
  };
  const save = async () => {
    if (!blob || !audioUrl) return;
    const item = {
      topic: topics[topic].name,
      date: new Date().toLocaleDateString("id-ID"),
      duration: seconds,
      score: 84,
      url: audioUrl,
    };
    setHistory((items) => [item, ...items]);
    setSaved(true);
    const data = new FormData();
    data.append("audio", blob, "ziaedu-speaking.webm");
    data.append("topic", item.topic);
    data.append("prompt", topics[topic].prompt);
    data.append("duration", String(item.duration));
    void fetch("/api/speaking/recordings", {
      method: "POST",
      body: data,
    }).catch(() => undefined);
  };
  const current = topics[topic];
  return (
    <div className="speaking-page">
      <div className="page-head">
        <div>
          <div className="eyebrow">SPEAKING PRACTICE · REAL VOICE</div>
          <h1>
            Latihan Speaking<span className="blue-dot">.</span>
          </h1>
          <p>
            Rekam suara kamu, dengarkan kembali, lalu tingkatkan kemampuanmu.
          </p>
        </div>
        <span className="pill purple">
          <Mic2 size={14} /> MediaRecorder aktif
        </span>
      </div>
      <div className="speaking-layout">
        <section className="panel speaking-card">
          <div className="card-head">
            <div>
              <span className="section-kicker">
                <MessageCircle size={15} /> PILIH TOPIK
              </span>
              <h2>{current.name}</h2>
            </div>
            <span className="pill blue">B1</span>
          </div>
          <select
            className="topic-select"
            value={topic}
            onChange={(e) => {
              setTopic(Number(e.target.value));
              reset();
            }}
          >
            {topics.map((item, index) => (
              <option value={index} key={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="prompt-box">
            <span>PROMPT</span>
            <p>“{current.prompt}”</p>
          </div>
          <div className={`record-stage ${recording ? "is-recording" : ""}`}>
            <div className="mic-circle">
              <Mic2 size={28} />
            </div>
            {recording ? (
              <>
                <b className="recording-status">● Sedang merekam...</b>
                <strong className="record-timer">{format(seconds)}</strong>
                <div className="waveform">
                  {Array.from({ length: 28 }, (_, i) => (
                    <i
                      key={i}
                      style={{ height: `${18 + ((i * 17) % 30)}px` }}
                    />
                  ))}
                </div>
                <button className="btn stop-btn" onClick={stop}>
                  ■ Stop Rekam
                </button>
              </>
            ) : audioUrl ? (
              <>
                <b className="recording-ready">Rekaman siap didengarkan</b>
                <strong className="record-timer">{format(seconds)}</strong>
                <audio className="audio-player" controls src={audioUrl} />
                <div className="record-actions">
                  <button className="btn ghost" onClick={start}>
                    ↻ Rekam Ulang
                  </button>
                  <button className="btn ghost danger-btn" onClick={reset}>
                    🗑 Hapus
                  </button>
                </div>
              </>
            ) : (
              <>
                <b>Siap untuk berbicara?</b>
                <p className="record-hint">
                  Klik mulai dan izinkan akses mikrofon.
                </p>
                <button className="btn primary" onClick={start}>
                  <Mic2 size={16} /> Mulai Rekam
                </button>
              </>
            )}
          </div>
          {error && (
            <div className="record-error">
              <CircleHelp size={15} />
              {error}
            </div>
          )}
          {audioUrl && !recording && (
            <div className="evaluation">
              <div>
                <span>Evaluasi mock</span>
                <strong>
                  84 <small>/ 100</small>
                </strong>
              </div>
              <div className="score-list">
                <span>
                  Pronunciation <b>85%</b>
                </span>
                <span>
                  Fluency <b>82%</b>
                </span>
                <span>
                  Grammar <b>88%</b>
                </span>
                <span>
                  Vocabulary <b>80%</b>
                </span>
              </div>
              <p>
                Your pronunciation is clear, but try to improve sentence
                fluency.
              </p>
              <button className="btn primary" onClick={save}>
                {saved ? (
                  <>
                    <Check size={15} /> Tersimpan di Riwayat
                  </>
                ) : (
                  <>
                    <Check size={15} /> Simpan Rekaman
                  </>
                )}
              </button>
            </div>
          )}
        </section>
        <section className="panel history-card">
          <div className="card-head">
            <div>
              <h3>Riwayat Speaking</h3>
              <p>Rekaman yang pernah kamu simpan.</p>
            </div>
            <span className="pill blue">{history.length}</span>
          </div>
          {history.length === 0 ? (
            <div className="empty history-empty">
              <Mic2 size={25} />
              <b>Belum ada rekaman</b>
              <span>Rekaman tersimpan akan muncul di sini.</span>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item, index) => (
                <div className="history-item" key={`${item.date}-${index}`}>
                  <div className="history-play">
                    <Volume2 size={15} />
                  </div>
                  <div>
                    <b>{item.topic}</b>
                    <small>
                      {item.date} · {format(item.duration)}
                    </small>
                  </div>
                  <audio className="history-audio" controls preload="metadata">
                    <source src={item.url} type="audio/webm" />
                  </audio>
                  <strong>{item.score}</strong>
                  <button
                    className="icon-btn"
                    onClick={() =>
                      setHistory((items) => items.filter((_, i) => i !== index))
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
function LessonDetail({
  title,
  goBack,
  go,
}: {
  title: string;
  goBack: () => void;
  go: (p: Page) => void;
}) {
  const lessons = [
    "Warm-up: everyday expressions",
    "Useful words in context",
    "Practice and quick review",
  ];
  return (
    <div className="lesson-detail">
      <button className="back-link" onClick={goBack}>
        ← Kembali ke daftar materi
      </button>
      <div className="lesson-detail-head">
        <div>
          <span className="pill blue">B1 · {title}</span>
          <h2>{title}</h2>
          <p>
            Materi belajar pilihan untuk membangun pemahaman dan kosakata yang
            bisa langsung kamu gunakan.
          </p>
        </div>
        <div className="lesson-detail-progress">
          <b>0%</b>
          <small>belum dimulai</small>
        </div>
      </div>
      <div className="lesson-detail-grid">
        <section className="panel">
          <div className="card-head">
            <div>
              <h3>Urutan pelajaran</h3>
              <p>Selesaikan secara berurutan atau pilih sesuai kebutuhanmu.</p>
            </div>
            <BookOpen size={20} color="#8391ff" />
          </div>
          <div className="lesson-steps">
            {lessons.map((item, i) => (
              <button
                key={item}
                onClick={() => (i === 1 ? go("flashcards") : undefined)}
              >
                <span className="step-number">{i + 1}</span>
                <div>
                  <b>{item}</b>
                  <small>
                    {i === 1
                      ? "12 kosakata · 5 menit"
                      : "5 menit · pemahaman konteks"}
                  </small>
                </div>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>
        <section className="panel lesson-side">
          <div className="round-icon blue">
            <Target size={18} />
          </div>
          <h3>Target materi</h3>
          <p>Pelajari 12 kata baru dan gunakan dalam kalimat sederhana.</p>
          <div className="bar">
            <span style={{ width: "0%" }} />
          </div>
          <button
            className="btn primary full-btn"
            onClick={() => go("flashcards")}
          >
            <Play size={15} fill="currentColor" /> Mulai belajar
          </button>
        </section>
      </div>
    </div>
  );
}
function Tutor({ toast }: { toast: (x: string) => void }) {
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi Andi! I am Zia, your English learning companion. What would you like to practice today?",
    },
  ]);
  const [input, setInput] = useState("");
  return (
    <div className="tutor-box">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div className={`chat ${m.role}`} key={i}>
            <div className="chat-avatar">
              {m.role === "ai" ? <Sparkles size={15} /> : "AR"}
            </div>
            <p>{m.text}</p>
          </div>
        ))}
      </div>
      <div className="quick-prompts">
        <button
          onClick={() =>
            setInput("Correct my sentence: I have went to the store")
          }
        >
          Correct my sentence
        </button>
        <button onClick={() => setInput("Explain the word resilient")}>
          Explain a word
        </button>
        <button onClick={() => setInput("Give me a short quiz")}>
          Give me a quiz
        </button>
      </div>
      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input) {
              setMessages([
                ...messages,
                { role: "user", text: input },
                {
                  role: "ai",
                  text: "Great question! Let us explore that together. Consistent practice is the key to making this feel natural.",
                },
              ]);
              setInput("");
              toast("Zia Tutor replied");
            }
          }}
          placeholder="Tulis pesan untuk Zia..."
        />
        <button
          className="btn primary"
          onClick={() => {
            if (input) {
              setMessages([
                ...messages,
                { role: "user", text: input },
                {
                  role: "ai",
                  text: "Great question! Let us explore that together. Consistent practice is the key to making this feel natural.",
                },
              ]);
              setInput("");
            }
          }}
        >
          Kirim <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
