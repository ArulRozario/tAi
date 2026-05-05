// ============================================================
// Projects list + Project detail + New project modal
// ============================================================

const ProjectsList = ({ onNavigate }) => {
  const { PROJECTS } = window.tAIData;
  const [showModal, setShowModal] = React.useState(false);
  const [filter, setFilter] = React.useState("All");
  const [search, setSearch] = React.useState("");

  const filtered = PROJECTS.filter(p =>
    (filter === "All" || p.status === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{PROJECTS.length} projects · {PROJECTS.reduce((s, p) => s + p.pages, 0).toLocaleString()} total pages</p>
        </div>
        <div className="row">
          <div className="input-group" style={{ width: 240 }}>
            <Icon name="search" size={14} />
            <input className="input" placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="select" style={{ width: 130 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option><option>Active</option><option>Complete</option><option>New</option>
          </select>
          <Btn kind="primary" icon="plus" onClick={() => setShowModal(true)}>New project</Btn>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Chapters</th>
              <th>Pages</th>
              <th style={{ width: 200 }}>Progress</th>
              <th>Quality</th>
              <th>Status</th>
              <th>Owner</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} onClick={() => onNavigate("projectDetail", p)}>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div className="dim" style={{ fontSize: 11 }}>English → Tamil · Thiruviviliam</div>
                </td>
                <td className="mono tabnums">{p.chapters}</td>
                <td className="mono tabnums">{p.pages}</td>
                <td>
                  <div className="row" style={{ gap: 10 }}>
                    <Progress value={p.progress} kind={p.progress === 100 ? "success" : null} />
                    <span className="mono dim" style={{ minWidth: 32 }}>{p.progress}%</span>
                  </div>
                </td>
                <td>{p.quality > 0 ? <span className={p.quality >= 80 ? "" : "sev-medium"}>{p.quality}%</span> : <span className="dim">—</span>}</td>
                <td><StatusPill status={p.status} /></td>
                <td><Avatar initials="RK" color="#e94560" /></td>
                <td><Btn kind="ghost" icon="more" size="sm" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <NewProjectModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

const NewProjectModal = ({ onClose }) => {
  const [dragOver, setDragOver] = React.useState(false);
  return (
    <Modal
      title="Create new project"
      onClose={onClose}
      footer={<>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn kind="primary" onClick={onClose}>Create project</Btn>
      </>}
    >
      <div className="field">
        <label className="label">Project name</label>
        <input className="input" placeholder="The Cost of Discipleship" />
      </div>
      <div className="grid grid--2">
        <div className="field">
          <label className="label">Source language</label>
          <select className="select"><option>English</option></select>
        </div>
        <div className="field">
          <label className="label">Target language</label>
          <select className="select"><option>Tamil — Thiruviviliam</option></select>
        </div>
      </div>
      <div className="field">
        <label className="label">Genre</label>
        <div className="genre-select-list">
          {window.tAIData.GENRES.map((g, i) => (
            <label key={g.id} className={`genre-select-item ${i === 0 ? "is-selected" : ""}`}>
              <input type="radio" name="genre" defaultChecked={i === 0} />
              <div className="genre-select-item__icon" style={{ background: `${g.color}22`, color: g.color }}>
                <Icon name={g.icon} size={14} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{g.name}</div>
                <div className="dim ellipsis" style={{ fontSize: 11 }}>{g.description}</div>
              </div>
              <Pill kind="default">{g.version}</Pill>
            </label>
          ))}
        </div>
      </div>
      <div
        className={`dropzone ${dragOver ? "is-active" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        <Icon name="upload" size={28} />
        <div style={{ fontWeight: 500, marginTop: 8 }}>Drop PDF here</div>
        <div className="dim" style={{ fontSize: 12, margin: "4px 0 12px" }}>or</div>
        <Btn>Browse files</Btn>
        <div className="dim" style={{ fontSize: 11, marginTop: 12 }}>PDF, scanned images · up to 200MB</div>
      </div>
    </Modal>
  );
};

const ProjectDetail = ({ project, onNavigate, onBack }) => {
  const p = project || window.tAIData.PROJECTS[0];
  const chapters = [
    { n: 1, pages: 20, done: 20 },
    { n: 2, pages: 18, done: 18 },
    { n: 3, pages: 22, done: 12 },
    { n: 4, pages: 15, done: 0 },
    { n: 5, pages: 19, done: 0 },
  ];
  // generate page grid statuses
  const statuses = ["s-approved","s-approved","s-approved","s-approved","s-approved","s-approved","s-approved","s-approved","s-approved","s-approved","s-review","s-pending","s-pending","s-pending","s-pending","s-changes","s-pending","s-pending","s-processing","s-pending"];

  return (
    <div className="page fade-in">
      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
        <Btn kind="ghost" icon="arrowLeft" size="sm" onClick={onBack}>Back</Btn>
        <span className="dim">/</span>
        <span className="muted">Projects</span>
        <span className="dim">/</span>
        <span style={{ fontWeight: 500 }}>{p.name}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{p.name}</h1>
          <p className="page-subtitle">English → Tamil · Thiruviviliam · {p.pages} pages · {p.chapters} chapters</p>
          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <span className="dim" style={{ fontSize: 12 }}>Genre</span>
            <div className="genre-picker" onClick={() => onNavigate("genres")}>
              <span className="genre-picker__dot" style={{ background: "#e94560" }} />
              <span style={{ fontWeight: 500 }}>Tamil Protestant Bible (Thiruviviliam)</span>
              <Pill kind="default">v3.2</Pill>
              <Icon name="chevronDown" size={12} />
            </div>
          </div>
        </div>
        <div className="row">
          <Btn icon="edit">Edit</Btn>
          <Btn icon="download">Export PDF</Btn>
          <Btn icon="play" kind="primary" onClick={() => onNavigate("workbench")}>Open workbench</Btn>
        </div>
      </div>

      <div className="grid grid--4" style={{ marginBottom: "var(--sp-6)" }}>
        <div className="card">
          <div className="card-eyebrow">Approved</div>
          <div className="row" style={{ gap: 12 }}>
            <div className="stat__value tabnums" style={{ color: "var(--success)" }}>{p.completed}</div>
            <Progress value={(p.completed / p.pages) * 100} kind="success" />
          </div>
        </div>
        <div className="card">
          <div className="card-eyebrow">In review</div>
          <div className="row" style={{ gap: 12 }}>
            <div className="stat__value tabnums" style={{ color: "var(--warning)" }}>{p.inReview}</div>
            <Progress value={(p.inReview / p.pages) * 100} kind="warning" />
          </div>
        </div>
        <div className="card">
          <div className="card-eyebrow">Pending</div>
          <div className="row" style={{ gap: 12 }}>
            <div className="stat__value tabnums">{p.pending}</div>
            <Progress value={(p.pending / p.pages) * 100} />
          </div>
        </div>
        <div className="card">
          <div className="card-eyebrow">Avg quality</div>
          <div className="row" style={{ gap: 12 }}>
            <QualityRing value={p.quality} size={48} />
            <div>
              <div className="dim" style={{ fontSize: 11 }}>Across {p.completed} approved pages</div>
              <div className="row" style={{ gap: 4, marginTop: 6 }}>
                <Avatar initials="SJ" color="#6ea8ff" />
                <Avatar initials="DA" color="#4ecca3" />
                <Avatar initials="MR" color="#ffc107" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Chapters</h3>
            <Btn kind="ghost" icon="plus" size="sm">Add chapter</Btn>
          </div>
          <div className="col" style={{ gap: 0 }}>
            {chapters.map(c => (
              <div key={c.n} className="row row--between" style={{ padding: "12px 4px", borderBottom: "1px solid var(--border)" }}>
                <div className="row">
                  <Icon name="chevron" size={14} style={{ color: "var(--text-3)" }} />
                  <span style={{ fontWeight: 500 }}>Chapter {c.n}</span>
                  <span className="dim">· {c.pages} pages</span>
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <div style={{ width: 100 }}><Progress value={(c.done/c.pages)*100} kind={c.done === c.pages ? "success" : null} /></div>
                  <span className="mono dim tabnums" style={{ minWidth: 40, textAlign: "right" }}>{c.done}/{c.pages}</span>
                  {c.done === c.pages ? <Pill kind="success">Done</Pill> : c.done > 0 ? <Pill kind="warning">In progress</Pill> : <Pill>Queued</Pill>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pages · Chapter 3</h3>
            <div className="row" style={{ fontSize: 11 }}>
              <span className="dim">Click any page to open</span>
            </div>
          </div>
          <div className="page-grid">
            {Array.from({ length: 22 }).map((_, i) => {
              const s = statuses[i] || "s-pending";
              return (
                <div key={i} className={`page-grid__cell ${s}`} onClick={() => onNavigate("workbench")} title={`Page ${i+1}`}>
                  {i+1}
                </div>
              );
            })}
          </div>
          <div className="divider" />
          <div className="row" style={{ flexWrap: "wrap", gap: 12, fontSize: 11 }}>
            <span className="row" style={{gap:6}}><span className="status-dot status-dot--approved"/> Approved</span>
            <span className="row" style={{gap:6}}><span className="status-dot status-dot--review"/> In review</span>
            <span className="row" style={{gap:6}}><span className="status-dot status-dot--pending"/> Pending</span>
            <span className="row" style={{gap:6}}><span className="status-dot status-dot--changes"/> Changes</span>
            <span className="row" style={{gap:6}}><span className="status-dot status-dot--processing"/> Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

window.ProjectsList = ProjectsList;
window.ProjectDetail = ProjectDetail;
window.NewProjectModal = NewProjectModal;
