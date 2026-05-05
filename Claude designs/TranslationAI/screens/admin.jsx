// ============================================================
// Admin / Team / Settings / Rules
// ============================================================

const Admin = ({ onNavigate }) => {
  const allPages = [
    { project: "Pilgrim's Progress", ch: 3, page: "P45", reviewer: "Selvi", status: "Pending", quality: 78 },
    { project: "Pilgrim's Progress", ch: 3, page: "P46", reviewer: "Daniel", status: "Changes", quality: 65 },
    { project: "Imitation of Christ", ch: 1, page: "P12", reviewer: "Mary", status: "Approved", quality: 92 },
    { project: "Mere Christianity", ch: 8, page: "P78", reviewer: "Selvi", status: "Escalated", quality: 45 },
    { project: "Confessions", ch: 2, page: "P23", reviewer: "Daniel", status: "Pending", quality: 71 },
    { project: "Cost of Discipleship", ch: 4, page: "P102", reviewer: "Mary", status: "Approved", quality: 88 },
  ];
  const [selected, setSelected] = React.useState({});

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin · all pages</h1>
          <p className="page-subtitle">Master view across every project · override and resolve escalations</p>
        </div>
        <div className="row">
          <Btn icon="download">Export report</Btn>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <select className="select" style={{ width: 200 }}><option>All projects</option></select>
          <select className="select" style={{ width: 160 }}><option>All chapters</option></select>
          <select className="select" style={{ width: 160 }}><option>All statuses</option></select>
          <select className="select" style={{ width: 160 }}><option>All reviewers</option></select>
          <Btn>Apply filters</Btn>
          <span className="toolbar__spacer" style={{flex:1}} />
          <Btn size="sm">Reassign selected</Btn>
          <Btn size="sm" kind="success">Batch approve</Btn>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 30 }}><input type="checkbox" /></th>
              <th>Project</th>
              <th>Ch.</th>
              <th>Page</th>
              <th>Reviewer</th>
              <th>Status</th>
              <th>Quality</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allPages.map((p, i) => (
              <tr key={i} className={selected[i] ? "is-selected" : ""}>
                <td><input type="checkbox" checked={!!selected[i]} onChange={(e) => setSelected({ ...selected, [i]: e.target.checked })} /></td>
                <td>{p.project}</td>
                <td className="mono dim">{p.ch}</td>
                <td className="mono">{p.page}</td>
                <td>
                  <div className="row">
                    <Avatar initials={p.reviewer.slice(0, 2).toUpperCase()} color={["#6ea8ff","#4ecca3","#ffc107","#e94560"][i%4]} />
                    <span>{p.reviewer}</span>
                  </div>
                </td>
                <td><StatusPill status={p.status} /></td>
                <td>
                  <span className="mono tabnums" style={{ color: p.quality < 60 ? "var(--error)" : p.quality < 80 ? "var(--warning)" : "var(--success)" }}>{p.quality}%</span>
                </td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <Btn size="sm" kind="ghost" onClick={() => onNavigate("review")}>View</Btn>
                    {p.status === "Escalated" ? <Btn size="sm" kind="primary">Resolve</Btn> : <Btn size="sm">Override</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Team = () => {
  const { TEAM } = window.tAIData;
  const [showAdd, setShowAdd] = React.useState(false);
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{TEAM.length} members · 1 master · {TEAM.filter(t => t.role === "Reviewer").length} reviewers</p>
        </div>
        <Btn kind="primary" icon="plus" onClick={() => setShowAdd(true)}>Add member</Btn>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--sp-5)" }}>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Assigned</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {TEAM.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="row">
                    <Avatar initials={u.initials} color={u.color} />
                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td className="mono dim">{u.email}</td>
                <td><Pill kind={u.role === "Master" ? "accent" : "info"}>{u.role}</Pill></td>
                <td className="mono tabnums">{u.assigned}</td>
                <td><Pill kind={u.status === "Active" ? "success" : "default"} dot>{u.status}</Pill></td>
                <td><div className="row" style={{ gap: 4 }}><Btn size="sm" kind="ghost" icon="edit"/><Btn size="sm" kind="ghost" icon="more"/></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add reviewer" onClose={() => setShowAdd(false)} footer={<><Btn onClick={() => setShowAdd(false)}>Cancel</Btn><Btn kind="primary" onClick={() => setShowAdd(false)}>Send invite</Btn></>}>
          <div className="grid grid--2">
            <div className="field"><label className="label">Name</label><input className="input" placeholder="Jane Doe" /></div>
            <div className="field"><label className="label">Email</label><input className="input" placeholder="jane@org.com" /></div>
          </div>
          <div className="field">
            <label className="label">Role</label>
            <div className="row" style={{ gap: 16 }}>
              <label className="checkbox"><input type="radio" name="role" defaultChecked /> Reviewer</label>
              <label className="checkbox"><input type="radio" name="role" /> Master reviewer</label>
            </div>
          </div>
          <div className="field"><label className="label">Default projects</label><select className="select"><option>Select projects…</option></select></div>
        </Modal>
      )}
    </div>
  );
};

const Settings = () => {
  const { MODELS } = window.tAIData;
  const [tab, setTab] = React.useState("Models");
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Model configuration, languages, and system defaults</p>
        </div>
      </div>

      <div className="tabs">
        {["Models", "Languages", "Rules", "System"].map(t => (
          <button key={t} className={`tab ${t === tab ? "is-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Models" && (
        <div className="col" style={{ gap: 16 }}>
          {MODELS.map(m => (
            <div key={m.agent} className="card">
              <div className="row row--between" style={{ marginBottom: 12 }}>
                <div>
                  <div className="card-eyebrow">{m.agent} agent</div>
                  <div className="row" style={{ marginTop: 4 }}>
                    <strong style={{ fontSize: 15 }}>{m.model}</strong>
                    <Pill>{m.note}</Pill>
                  </div>
                </div>
                <Pill kind="success" dot>Online</Pill>
              </div>
              <div className="grid grid--3">
                <div className="field"><label className="label">Provider</label><select className="select" defaultValue={m.provider}><option>Ollama</option><option>OpenAI</option><option>Anthropic</option></select></div>
                <div className="field"><label className="label">Model</label><select className="select" defaultValue={m.model}><option>{m.model}</option></select></div>
                <div className="field"><label className="label">Endpoint</label><input className="input mono" defaultValue={m.endpoint} /></div>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <Btn size="sm" icon="bolt">Test connection</Btn>
                <Btn size="sm" kind="ghost" icon="terminal">View logs</Btn>
                <span className="toolbar__spacer" style={{ flex: 1 }} />
                <Btn size="sm" kind="primary">Save</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab !== "Models" && (
        <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--text-3)" }}>
          <Icon name="settings" size={32} />
          <div style={{ marginTop: 12 }}>{tab} settings — coming soon</div>
        </div>
      )}
    </div>
  );
};

const Rules = () => {
  const { RULES, RULE_CONTENT } = window.tAIData;
  const [active, setActive] = React.useState("r1");
  const highlight = (text) => {
    return text.split("\n").map((line, i) => {
      let className = "";
      if (line.startsWith("#")) className = "h";
      else if (line.startsWith("---") || line.match(/^[a-z_]+:/)) className = "k";
      else if (line.includes(":") && line.match(/[\u0B80-\u0BFF]/)) className = "s";
      return <div key={i}><span className={className}>{line}</span></div>;
    });
  };
  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rules</h1>
          <p className="page-subtitle">Agent prompts, terminology, and project-level overrides</p>
        </div>
        <Btn kind="primary" icon="plus">New rule</Btn>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "320px 1fr", gap: "var(--sp-5)" }}>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }} className="card-eyebrow">Global rules</div>
          {RULES.slice(0, 3).map(r => (
            <div key={r.id} onClick={() => setActive(r.id)} style={{ padding: 12, borderBottom: "1px solid var(--border)", background: active === r.id ? "var(--surface-2)" : "transparent", cursor: "pointer" }}>
              <div className="row row--between" style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{r.agent}</span>
                <Pill kind={r.active ? "success" : "default"} dot>{r.version}</Pill>
              </div>
              <div className="dim ellipsis" style={{ fontSize: 11 }}>{r.name}</div>
              <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>Updated {r.updated}</div>
            </div>
          ))}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }} className="card-eyebrow">Project overrides</div>
          {RULES.slice(3).map(r => (
            <div key={r.id} onClick={() => setActive(r.id)} style={{ padding: 12, borderBottom: "1px solid var(--border)", background: active === r.id ? "var(--surface-2)" : "transparent", cursor: "pointer" }}>
              <div className="row row--between" style={{ marginBottom: 4 }}>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{r.agent}</span>
                <Pill kind="warning" dot>Override</Pill>
              </div>
              <div className="dim ellipsis" style={{ fontSize: 11 }}>{r.name}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-eyebrow">Editing</div>
              <h3 style={{ margin: "4px 0 0", fontSize: 16 }}>Translation Agent — Thiruviviliam Tamil</h3>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <select className="select" style={{ width: 110 }}><option>v2.0</option><option>v1.9</option><option>v1.8</option></select>
              <Btn size="sm" icon="play">Test</Btn>
              <Btn size="sm" kind="primary" icon="check">Save</Btn>
            </div>
          </div>

          <div className="grid grid--2" style={{ gap: 16 }}>
            <div>
              <div className="card-eyebrow" style={{ marginBottom: 8 }}>Rule content (Markdown)</div>
              <div className="code-editor" style={{ height: 380, overflow: "auto" }}>
                {highlight(RULE_CONTENT)}
              </div>
            </div>
            <div>
              <div className="card-eyebrow" style={{ marginBottom: 8 }}>Live preview</div>
              <div className="card card--inline" style={{ background: "var(--bg)", height: 380, overflow: "auto" }}>
                <div className="card-eyebrow">Sample input</div>
                <p style={{ fontSize: 13, marginTop: 4 }}>"For God so loved the world that He gave His only begotten Son…"</p>
                <div className="divider" />
                <div className="card-eyebrow">Output (Tamil)</div>
                <p className="ta" style={{ marginTop: 4 }}>தேவன் உலகத்தின்மேல் அவ்வளவாய் <mark className="diff-good">அன்புகூர்ந்தார்</mark>; தம்முடைய ஒரே பேறான குமாரனை அளித்தார்…</p>
                <div className="divider" />
                <div className="card-eyebrow">Term substitutions applied</div>
                <div className="row" style={{ flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  <Pill kind="success">love → அன்புகூர்</Pill>
                  <Pill kind="success">faith → விசுவாசம்</Pill>
                  <Pill kind="success">God → தேவன்</Pill>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.Admin = Admin;
window.Team = Team;
window.Settings = Settings;
window.Rules = Rules;
