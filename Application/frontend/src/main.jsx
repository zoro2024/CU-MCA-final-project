import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./index.css";
import { mountBackground } from "./background3d.js";

// Use relative path by default so frontend can talk to backend via the ingress
const API = import.meta.env.VITE_API_URL || "";

const sevColor = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
  medium: "bg-amber-500/15 text-amber-300 border-amber-400/40",
  high: "bg-orange-500/15 text-orange-300 border-orange-400/40",
  critical: "bg-red-500/20 text-red-300 border-red-400/50",
};
const sevGlow = {
  low: "#34d399", medium: "#fbbf24", high: "#fb923c", critical: "#f87171",
};

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 blur-md opacity-70" />
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-indigo-500 to-fuchsia-500 flex items-center justify-center text-[#05060f] font-bold">
          ⚡
        </div>
      </div>
      <div className="leading-tight">
        <div className="font-display font-semibold text-[15px]">LogLens<span className="text-cyan-300">.AI</span></div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Observability</div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#05060f]/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
        <Link to="/"><Logo /></Link>
        <nav className="text-sm flex gap-1 text-slate-400">
          <Link to="/" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition">Analyze</Link>
          <Link to="/history" className="px-3 py-1.5 rounded-md hover:text-white hover:bg-white/5 transition">History</Link>
          <a href="#" onClick={(e)=>e.preventDefault()} className="px-3 py-1.5 rounded-md text-slate-500 cursor-default">Docs</a>
        </nav>
      </div>
    </header>
  );
}

const SAMPLE = `ERROR Connection refused to PostgreSQL
WARNING Redis timeout
ERROR OOMKilled detected
INFO Application started`;

function Home() {
  const nav = useNavigate();
  const [logs, setLogs] = React.useState("");
  const [source, setSource] = React.useState("pasted-logs");
  const [loading, setLoading] = React.useState(false);
  const [recent, setRecent] = React.useState([]);

  React.useEffect(() => {
    fetch(`${API}/api/reports?limit=5`).then(r => r.json()).then(setRecent).catch(() => {});
  }, []);

  async function submit() {
    if (!logs.trim()) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/logs/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_name: source, logs }),
      });
      if (!r.ok) throw new Error((await r.json()).detail || "Failed");
      const data = await r.json();
      nav(`/reports/${data.id}`);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }

  const lineCount = logs ? logs.split("\n").length : 0;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-10 fade-in">
      {/* Hero */}
      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-slate-300 mb-5">
          <span className="sev-dot text-emerald-400 pulse-soft" /> AI engine online · sub-second analysis
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-semibold gradient-text leading-[1.05]">
          Read your logs<br/>like a senior engineer.
        </h1>
        <p className="text-slate-400 mt-4 max-w-xl text-[15px]">
          Paste application or Kubernetes logs and receive root causes, severity, patterns,
          and actionable fixes — rendered in a calm, focused interface.
        </p>
      </div>

      {/* Analyzer */}
      <div className="ring-grad">
        <div className="glass-strong rounded-[13px] p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <input value={source} onChange={e => setSource(e.target.value)}
              className="flex-1 min-w-[200px] input-field rounded-md px-3.5 py-2.5 text-sm"
              placeholder="source name (e.g. api-gateway.log)" />
            <label className="btn-ghost px-3.5 py-2.5 rounded-md cursor-pointer text-sm flex items-center gap-2">
              <span>📎</span> Upload
              <input type="file" accept=".log,.txt" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) { setLogs(await f.text()); setSource(f.name); } }} />
            </label>
            <button onClick={() => { setLogs(SAMPLE); setSource("sample.log"); }}
              className="btn-ghost px-3.5 py-2.5 rounded-md text-sm">Try sample</button>
          </div>

          <div className="relative">
            <textarea value={logs} onChange={e => setLogs(e.target.value)}
              placeholder="Paste logs here…"
              className="w-full h-72 input-field rounded-md p-4 font-mono text-[12.5px] leading-relaxed resize-none" />
            <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
              {lineCount} lines
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-xs text-slate-500 font-mono">
              {logs.length.toLocaleString()} chars · ready for inference
            </span>
            <button onClick={submit} disabled={loading || !logs.trim()}
              className="btn-primary px-5 py-2.5 rounded-md text-sm flex items-center gap-2">
              {loading ? <><span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Analyzing…</> : <>Analyze <span>→</span></>}
            </button>
          </div>
        </div>
      </div>

      {/* Recent */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="font-display text-xl font-semibold">Recent reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest 5 analyses</p>
          </div>
          <Link to="/history" className="text-sm text-cyan-300 hover:text-cyan-200 transition">View all →</Link>
        </div>
        <div className="space-y-2.5">
          {recent.map(r => <ReportRow key={r.id} r={r} />)}
          {recent.length === 0 && (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-sm text-slate-500">No reports yet — paste some logs above to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportRow({ r }) {
  return (
    <Link to={`/reports/${r.id}`} className="block glass card-hover rounded-xl p-4">
      <div className="flex justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="sev-dot" style={{ color: sevGlow[r.severity] }} />
            <span className="font-medium truncate">{r.source_name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${sevColor[r.severity]}`}>{r.severity}</span>
          </div>
          <p className="text-sm text-slate-400 line-clamp-2 mt-1.5">{r.summary}</p>
        </div>
        <div className="text-xs text-slate-500 text-right whitespace-nowrap">
          {new Date(r.created_at).toLocaleString()}
          <div className="font-mono mt-1.5 flex gap-2 justify-end">
            <span className="text-red-400">{r.counts.error}E</span>
            <span className="text-amber-300">{r.counts.warning}W</span>
            <span className="text-sky-300">{r.counts.info}I</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Report() {
  const { id } = useParams();
  const [r, setR] = React.useState(null);
  const [err, setErr] = React.useState(null);
  React.useEffect(() => {
    fetch(`${API}/api/reports/${id}`).then(x => x.ok ? x.json() : Promise.reject(x.statusText))
      .then(setR).catch(setErr);
  }, [id]);
  if (err) return <div className="max-w-6xl mx-auto p-6 text-red-400">{String(err)}</div>;
  if (!r) return (
    <div className="max-w-6xl mx-auto p-10 text-slate-500 flex items-center gap-3">
      <span className="inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      Loading report…
    </div>
  );

  const chart = [
    { name: "Info", value: r.counts.info, fill: "#38bdf8" },
    { name: "Warn", value: r.counts.warning, fill: "#fbbf24" },
    { name: "Error", value: r.counts.error, fill: "#f87171" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6 fade-in">
      <Link to="/" className="text-sm text-slate-400 hover:text-white transition inline-flex items-center gap-1">← Back</Link>

      <div className="ring-grad">
        <div className="glass-strong rounded-[13px] p-6 md:p-7">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="sev-dot" style={{ color: sevGlow[r.severity] }} />
            <h1 className="font-display text-3xl font-semibold gradient-text">{r.source_name}</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${sevColor[r.severity]}`}>{r.severity}</span>
            <span className="text-xs text-slate-500 font-mono ml-auto">
              confidence <span className="text-slate-300">{(r.confidence * 100).toFixed(0)}%</span>
            </span>
          </div>
          <p className="text-slate-300 mt-3 text-[15px] leading-relaxed">{r.summary}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total lines" v={r.total_lines} />
        <Stat label="Errors" v={r.counts.error} c="text-red-400" />
        <Stat label="Warnings" v={r.counts.warning} c="text-amber-300" />
        <Stat label="Info" v={r.counts.info} c="text-sky-300" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Log level distribution" icon="📊">
          <div className="h-60">
            <ResponsiveContainer><BarChart data={chart}>
              <CartesianGrid stroke="rgba(148,163,184,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ background: "rgba(10,12,24,0.95)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 8 }} />
              <Bar dataKey="value" radius={[8,8,0,0]}>{chart.map(d => <Cell key={d.name} fill={d.fill} />)}</Bar>
            </BarChart></ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Top error patterns" icon="🔎">
          <ul className="space-y-2 font-mono text-xs">
            {r.top_patterns.map((p, i) => (
              <li key={i} className="flex gap-3 p-2 rounded bg-white/[0.02] border border-white/5">
                <span className="text-cyan-300/70">{String(i+1).padStart(2,"0")}</span>
                <span className="text-slate-300 break-all">{p}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Probable root causes" icon="🧠">
          <ul className="text-sm space-y-2">
            {r.root_causes.map((c,i) => (
              <li key={i} className="flex gap-2.5">
                <span className="text-fuchsia-400 mt-1">◆</span>
                <span className="text-slate-300">{c}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Suggested fixes" icon="🛠">
          <ol className="text-sm space-y-2">
            {r.suggested_fixes.map((f,i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/30 border border-white/10 flex items-center justify-center text-[11px] font-mono text-cyan-200">{i+1}</span>
                <span className="text-slate-300">{f}</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="Raw log (truncated)" icon="📝">
        <pre className="text-xs font-mono bg-[#05060f]/80 border border-white/5 rounded-lg p-4 max-h-80 overflow-auto whitespace-pre-wrap text-slate-300">{r.raw_log}</pre>
      </Panel>
    </div>
  );
}

const Stat = ({ label, v, c }) => (
  <div className="glass rounded-xl p-4 card-hover">
    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
    <div className={`font-display text-3xl font-semibold mt-1.5 ${c || "text-slate-100"}`}>{v}</div>
  </div>
);

const Panel = ({ title, icon, children }) => (
  <div className="glass rounded-xl p-5">
    <h3 className="font-display font-semibold mb-3 flex items-center gap-2 text-[15px]">
      {icon && <span className="text-base opacity-80">{icon}</span>}{title}
    </h3>
    {children}
  </div>
);

function History() {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState([]);
  React.useEffect(() => {
    const url = new URL(`${API}/api/reports`);
    if (q) url.searchParams.set("q", q);
    url.searchParams.set("limit", "100");
    fetch(url).then(r => r.json()).then(setItems);
  }, [q]);
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-5 fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold gradient-text">History</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} report{items.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="relative">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by source, summary, severity…"
          className="w-full input-field rounded-md pl-10 pr-3 py-2.5 text-sm" />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
      </div>
      <div className="space-y-2.5">
        {items.map(r => <ReportRow key={r.id} r={r} />)}
        {items.length === 0 && (
          <div className="glass rounded-xl p-8 text-center text-sm text-slate-500">No matching reports.</div>
        )}
      </div>
    </div>
  );
}

// Mount the 3D background once.
mountBackground();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/history" element={<History />} />
      <Route path="/reports/:id" element={<Report />} />
    </Routes>
  </BrowserRouter>
);
