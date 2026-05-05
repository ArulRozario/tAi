// ============================================================
// Admin → Genres list + Genre Editor (markdown + AI chat)
// ============================================================

const GenresList = ({ onNavigate }) => {
  const { GENRES } = window.tAIData;
  const [search, setSearch] = React.useState("");
  const filtered = GENRES.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Genres</h1>
          <p className="page-subtitle">Translation contexts that drive agent behavior · {GENRES.length} defined</p>
        </div>
        <div className="row">
          <div className="input-group" style={{ width: 220 }}>
            <Icon name="search" size={14} />
            <input className="input" placeholder="Search genres" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Btn kind="primary" icon="plus" onClick={() => onNavigate("genreEditor", { id: "new" })}>New genre</Btn>
        </div>
      </div>

      <div className="grid grid--3">
        {filtered.map(g => (
          <div key={g.id} className="card genre-card" onClick={() => onNavigate("genreEditor", g)}>
            <div className="row row--between" style={{ marginBottom: 12 }}>
              <div className="genre-card__icon" style={{ background: `${g.color}22`, color: g.color }}>
                <Icon name={g.icon} size={18} />
              </div>
              <Pill kind="default">{g.version}</Pill>
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{g.name}</div>
            <p className="dim" style={{ fontSize: 12, lineHeight: 1.5, margin: "0 0 16px", minHeight: 36 }}>{g.description}</p>
            <div className="divider" style={{ margin: "0 0 12px" }} />
            <div className="row row--between" style={{ fontSize: 11 }}>
              <span className="dim">Segment · <strong style={{ color: "var(--text)" }}>{g.segmentUnit}</strong></span>
              <span className="dim">{g.projects} project{g.projects !== 1 ? "s" : ""}</span>
            </div>
            <div className="row row--between" style={{ fontSize: 11, marginTop: 8 }}>
              <span className="dim">Updated {g.updated}</span>
              <span className="dim">by {g.updatedBy.split(" ")[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Markdown rendering (lightweight) ----------
const renderMarkdown = (md) => {
  const lines = md.split("\n");
  const out = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    // headings
    if (/^# /.test(line)) { out.push(<h1 key={key++}>{line.slice(2)}</h1>); i++; continue; }
    if (/^## /.test(line)) { out.push(<h2 key={key++}>{line.slice(3)}</h2>); i++; continue; }
    if (/^### /.test(line)) { out.push(<h3 key={key++}>{line.slice(4)}</h3>); i++; continue; }
    // blockquote
    if (/^> /.test(line)) { out.push(<blockquote key={key++} dangerouslySetInnerHTML={{__html: inline(line.slice(2))}} />); i++; continue; }
    // table
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[-: |]+\|?$/.test(lines[i+1])) {
      const head = line.split("|").slice(1, -1).map(c => c.trim());
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map(c => c.trim()));
        i++;
      }
      out.push(
        <table key={key++} className="md-table">
          <thead><tr>{head.map((h, j) => <th key={j}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k} dangerouslySetInnerHTML={{__html: inline(c)}} />)}</tr>)}</tbody>
        </table>
      );
      continue;
    }
    // ordered list
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      out.push(<ol key={key++}>{items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{__html: inline(it)}} />)}</ol>);
      continue;
    }
    // unordered list
    if (/^- /.test(line)) {
      const items = [];
      while (i < lines.length && /^- /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      out.push(<ul key={key++}>{items.map((it, j) => <li key={j} dangerouslySetInnerHTML={{__html: inline(it)}} />)}</ul>);
      continue;
    }
    // blank
    if (!line.trim()) { i++; continue; }
    // paragraph (collect until blank)
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^[#>\-|]/.test(lines[i]) && !/^\d+\. /.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(<p key={key++} dangerouslySetInnerHTML={{__html: inline(para.join(" "))}} />);
  }
  return out;
};

const inline = (s) => s
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/\*([^*]+)\*/g, "<em>$1</em>")
  .replace(/`([^`]+)`/g, "<code>$1</code>");

// ---------- Genre Editor ----------
const GenreEditor = ({ genre, onBack }) => {
  const isNew = !genre || genre.id === "new";
  const seed = isNew
    ? { id: "new", name: "", short: "", description: "", segmentUnit: "Paragraph", version: "v0.1", versionCount: 0, content: "" }
    : genre;
  const { GENRE_VERSIONS, GENRE_CHAT_SEED } = window.tAIData;

  const [name, setName] = React.useState(seed.name);
  const [segmentUnit, setSegmentUnit] = React.useState(seed.segmentUnit);
  const [content, setContent] = React.useState(seed.content);
  const [view, setView] = React.useState("split"); // split | edit | preview
  const [showHistory, setShowHistory] = React.useState(false);
  const [chatMode, setChatMode] = React.useState("plan"); // plan | build
  const [messages, setMessages] = React.useState(GENRE_CHAT_SEED);
  const [draft, setDraft] = React.useState("");
  const chatRef = React.useRef(null);

  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    if (!draft.trim()) return;
    const userMsg = { role: "user", text: draft };
    setMessages(m => [...m, userMsg]);
    const text = draft;
    setDraft("");
    // simulated response
    setTimeout(() => {
      if (chatMode === "plan") {
        setMessages(m => [...m, {
          role: "assistant",
          mode: "plan",
          text: `Here's what I'd propose for "${text.slice(0, 40)}…":\n\n1. Add a new section under **Core Terminology** for the requested terms.\n2. Cross-reference glossary entry #042 for consistency.\n3. Update the **Common Pitfalls** list with two new examples.\n\nSwitch to **Build** mode and I'll apply this directly to the document.`,
        }]);
      } else {
        // build mode — simulate inserting into content
        const insertion = `\n\n## ${text.slice(0, 50)}\n\nDrafted section based on your request. Review and refine as needed.\n`;
        setContent(c => c + insertion);
        setMessages(m => [...m, {
          role: "assistant",
          mode: "build",
          text: `✓ Applied. Added new section to the document. View the diff in the editor — I appended after the last heading.`,
          diff: insertion.trim().split("\n").slice(0, 3).join(" / "),
        }]);
      }
    }, 600);
  };

  const quickPrompts = chatMode === "plan"
    ? ["Suggest improvements", "Review terminology coverage", "Find inconsistencies", "Compare with v3.1"]
    : ["Add Christology terms", "Tighten honorifics section", "Generate examples", "Add common pitfall"];

  return (
    <div className="genre-editor fade-in">
      {/* Header */}
      <div className="genre-editor__head">
        <div className="row" style={{ gap: 8, flex: 1, minWidth: 200 }}>
          <Btn kind="ghost" icon="arrowLeft" size="sm" onClick={onBack}>Back</Btn>
          <span className="dim">/</span>
          <span className="muted">Genres</span>
          <span className="dim">/</span>
          <input
            className="genre-editor__title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled genre"
          />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <select className="select" style={{ width: 130 }} value={segmentUnit} onChange={(e) => setSegmentUnit(e.target.value)}>
            <option>Verse</option>
            <option>Paragraph</option>
            <option>Sentence</option>
            <option>Page</option>
          </select>
          <select className="select" style={{ width: 100 }} defaultValue={seed.version}>
            {GENRE_VERSIONS.map(v => <option key={v.v}>{v.v}{v.current ? " · current" : ""}</option>)}
          </select>
          <Btn size="sm" icon="history" onClick={() => setShowHistory(true)}>History</Btn>
          <Btn size="sm" icon="play">Test</Btn>
          <Btn size="sm" kind="primary" icon="check">Save</Btn>
        </div>
      </div>

      {/* View tabs */}
      <div className="genre-editor__tabs">
        <div className="row" style={{ gap: 4 }}>
          {["split", "edit", "preview"].map(v => (
            <button key={v} className={`view-tab ${view === v ? "is-active" : ""}`} onClick={() => setView(v)}>
              <Icon name={v === "split" ? "columns" : v === "edit" ? "edit" : "eye"} size={13} />
              {v === "split" ? "Split" : v === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>
        <div className="dim" style={{ fontSize: 11 }}>
          {content.split("\n").length} lines · {content.length} chars · auto-saved 12s ago
        </div>
      </div>

      {/* Body: editor + chat */}
      <div className="genre-editor__body">
        <div className={`genre-editor__doc genre-editor__doc--${view}`}>
          {(view === "split" || view === "edit") && (
            <div className="md-editor">
              <div className="md-editor__toolbar">
                <Btn kind="ghost" size="sm" icon="edit">B</Btn>
                <Btn kind="ghost" size="sm">I</Btn>
                <span className="md-editor__sep" />
                <Btn kind="ghost" size="sm">H1</Btn>
                <Btn kind="ghost" size="sm">H2</Btn>
                <Btn kind="ghost" size="sm">H3</Btn>
                <span className="md-editor__sep" />
                <Btn kind="ghost" size="sm">List</Btn>
                <Btn kind="ghost" size="sm">Table</Btn>
                <Btn kind="ghost" size="sm">Quote</Btn>
                <Btn kind="ghost" size="sm">Code</Btn>
                <span className="toolbar__spacer" style={{ flex: 1 }} />
                <Btn kind="ghost" size="sm" icon="copy" />
              </div>
              <textarea
                className="md-editor__area"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start typing or ask the AI assistant on the right to draft this genre…"
                spellCheck={false}
              />
            </div>
          )}
          {(view === "split" || view === "preview") && (
            <div className="md-preview">
              <div className="md-preview__inner">
                {content ? renderMarkdown(content) : <div className="dim" style={{ padding: 24, textAlign: "center" }}>Preview will appear here</div>}
              </div>
            </div>
          )}
        </div>

        {/* Chat panel */}
        <aside className="genre-chat">
          <div className="genre-chat__head">
            <div className="row" style={{ gap: 8 }}>
              <div className="genre-chat__brand">
                <Icon name="sparkles" size={14} />
                <span>Genre assistant</span>
              </div>
            </div>
            <Btn kind="ghost" size="sm" icon="more" />
          </div>

          <div className="genre-chat__mode">
            <button
              className={`mode-pill ${chatMode === "plan" ? "is-active" : ""}`}
              onClick={() => setChatMode("plan")}
            >
              <Icon name="note" size={12} />
              Plan
              <span className="mode-pill__hint">Discuss</span>
            </button>
            <button
              className={`mode-pill ${chatMode === "build" ? "is-active" : ""}`}
              onClick={() => setChatMode("build")}
            >
              <Icon name="bolt" size={12} />
              Build
              <span className="mode-pill__hint">Edit doc</span>
            </button>
          </div>

          <div className="genre-chat__thread" ref={chatRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.role}`}>
                {m.role === "assistant" && (
                  <div className="chat-msg__head">
                    <div className="chat-msg__avatar"><Icon name="sparkles" size={11} /></div>
                    <span className="chat-msg__name">Assistant</span>
                    {m.mode && <span className={`chat-msg__mode chat-msg__mode--${m.mode}`}>
                      <Icon name={m.mode === "plan" ? "note" : "bolt"} size={10} />
                      {m.mode}
                    </span>}
                  </div>
                )}
                <div className="chat-msg__body">
                  {m.text.split("\n").map((line, j) => {
                    if (/^\d+\. /.test(line)) return <div key={j} className="chat-li">{renderInlineMd(line)}</div>;
                    return <div key={j}>{renderInlineMd(line) || <br />}</div>;
                  })}
                  {m.diff && (
                    <div className="chat-diff">
                      <Icon name="diff" size={10} />
                      <span>{m.diff}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="genre-chat__quick">
            {quickPrompts.map(q => (
              <button key={q} className="quick-prompt" onClick={() => setDraft(q)}>{q}</button>
            ))}
          </div>

          <div className="genre-chat__composer">
            <div className="composer-mode-indicator">
              <Icon name={chatMode === "plan" ? "note" : "bolt"} size={11} />
              <span>{chatMode === "plan" ? "Plan mode — discuss before editing" : "Build mode — edits will write to the doc"}</span>
            </div>
            <div className="composer-input">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
                placeholder={chatMode === "plan" ? "Ask about structure, terminology, gaps…" : "Tell me what to change…"}
                rows={2}
              />
              <div className="composer-actions">
                <span className="dim" style={{ fontSize: 10 }}>⌘↵ to send</span>
                <Btn kind="primary" size="sm" icon="send" onClick={send}>Send</Btn>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showHistory && <VersionHistoryDrawer onClose={() => setShowHistory(false)} />}
    </div>
  );
};

const renderInlineMd = (s) => {
  const parts = [];
  let key = 0;
  let rest = s;
  while (rest.length) {
    const m = rest.match(/\*\*([^*]+)\*\*/);
    if (!m) { parts.push(rest); break; }
    if (m.index > 0) parts.push(rest.slice(0, m.index));
    parts.push(<strong key={key++}>{m[1]}</strong>);
    rest = rest.slice(m.index + m[0].length);
  }
  return parts;
};

const VersionHistoryDrawer = ({ onClose }) => {
  const { GENRE_VERSIONS } = window.tAIData;
  const [selected, setSelected] = React.useState(GENRE_VERSIONS[0].v);
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__head">
          <div>
            <div className="card-eyebrow">Version history</div>
            <h3 style={{ margin: "4px 0 0", fontSize: 16 }}>Tamil Protestant Bible</h3>
          </div>
          <Btn kind="ghost" icon="x" onClick={onClose} />
        </div>
        <div className="drawer__body">
          {GENRE_VERSIONS.map(v => (
            <div
              key={v.v}
              className={`version-row ${selected === v.v ? "is-selected" : ""}`}
              onClick={() => setSelected(v.v)}
            >
              <div className="row row--between">
                <div className="row" style={{ gap: 8 }}>
                  <span className="version-row__tag mono">{v.v}</span>
                  {v.current && <Pill kind="success" dot>Current</Pill>}
                </div>
                <span className="dim" style={{ fontSize: 11 }}>{v.date}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 13 }}>{v.note}</div>
              <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>by {v.author}</div>
            </div>
          ))}
        </div>
        <div className="drawer__foot">
          <Btn onClick={onClose}>Close</Btn>
          <Btn kind="primary" icon="refresh">Restore {selected}</Btn>
        </div>
      </div>
    </div>
  );
};

window.GenresList = GenresList;
window.GenreEditor = GenreEditor;
