// ============================================================
// Review Queue
// ============================================================

const Queue = ({ onNavigate }) => {
  const { QUEUE, ESCALATED, ERROR_BREAKDOWN } = window.tAIData;
  const [filters, setFilters] = React.useState({ Terminology: false, Style: false, Accuracy: false, Fluency: false });
  const [sort, setSort] = React.useState("Priority");

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My queue</h1>
          <p className="page-subtitle">{QUEUE.length} pages awaiting your review · 3 escalated to master</p>
        </div>
        <div className="row">
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 160 }}>
            <option>Sort: Priority</option>
            <option>Sort: Quality</option>
            <option>Sort: Time waiting</option>
          </select>
          <Btn icon="filter">Filters</Btn>
          <label className="checkbox" style={{ marginLeft: 8 }}>
            <input type="checkbox" /> Low quality only
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--sp-6)" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Page</th>
              <th>Project</th>
              <th>Ch.</th>
              <th>Quality</th>
              <th>Errors</th>
              <th>Priority</th>
              <th>Wait</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {QUEUE.map(q => (
              <tr key={q.id} onClick={() => onNavigate("review")}>
                <td className="mono" style={{ fontWeight: 500 }}>{q.page}</td>
                <td>{q.project}</td>
                <td className="mono dim">{q.chapter}</td>
                <td>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="mono tabnums" style={{ minWidth: 32, color: q.quality < 60 ? "var(--error)" : q.quality < 80 ? "var(--warning)" : "var(--success)" }}>{q.quality}%</span>
                    <div style={{ width: 60 }}><Progress value={q.quality} kind={q.quality < 60 ? "error" : q.quality < 80 ? "warning" : "success"} /></div>
                  </div>
                </td>
                <td>
                  <span className="tag" style={{ color: q.errors > 8 ? "var(--error)" : q.errors > 4 ? "var(--warning)" : "var(--text-2)" }}>
                    {q.errors} {q.errors === 1 ? "issue" : "issues"}
                  </span>
                </td>
                <td><PriorityPill level={q.priority} /></td>
                <td className="mono dim">{q.time}</td>
                <td><StatusPill status={q.status} /></td>
                <td><Btn kind="primary" size="sm">Review →</Btn></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Error distribution · across queue</h3>
            <span className="dim mono" style={{ fontSize: 11 }}>33 issues</span>
          </div>
          <div className="col" style={{ gap: 14 }}>
            {ERROR_BREAKDOWN.map(b => (
              <div key={b.type}>
                <div className="row row--between" style={{ marginBottom: 6 }}>
                  <div className="row">
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
                    <span style={{ fontWeight: 500 }}>{b.type}</span>
                    <span className={`pill ${b.severity === "high" ? "pill--accent" : b.severity === "medium" ? "pill--warning" : ""}`}>{b.severity}</span>
                  </div>
                  <span className="mono tabnums">{b.count}</span>
                </div>
                <div className="dim" style={{ fontSize: 11, marginBottom: 6 }}>{b.example}</div>
                <Progress value={(b.count / 8) * 100} kind={b.severity === "high" ? "error" : b.severity === "medium" ? "warning" : null} />
              </div>
            ))}
          </div>
          <div className="divider" />
          <div className="row" style={{ flexWrap: "wrap", gap: 6 }}>
            <span className="dim" style={{ fontSize: 11, marginRight: 4 }}>Quick filter:</span>
            {Object.keys(filters).map(k => (
              <label key={k} className="checkbox">
                <input type="checkbox" checked={filters[k]} onChange={(e) => setFilters({ ...filters, [k]: e.target.checked })} />
                {k}
              </label>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Needs attention</h3>
              <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>Escalated to master reviewer</div>
            </div>
            <Pill kind="accent">{ESCALATED.length} open</Pill>
          </div>
          <div className="col" style={{ gap: 12 }}>
            {ESCALATED.map((e, i) => (
              <div key={i} className="card card--inline" style={{ background: "var(--bg)" }}>
                <div className="row row--between" style={{ marginBottom: 6 }}>
                  <div className="row">
                    <span className="mono" style={{ fontWeight: 500 }}>{e.page}</span>
                    <span className="dim">·</span>
                    <span className="muted">{e.project}</span>
                    <span className="dim">·</span>
                    <span className="dim">Ch. {e.chapter}</span>
                  </div>
                  <Pill kind="accent">{e.issue}</Pill>
                </div>
                <div style={{ fontSize: 12, marginBottom: 8 }}>"{e.summary}"</div>
                <div className="row row--between" style={{ fontSize: 11 }}>
                  <span className="dim">Escalated by <strong style={{ color: "var(--text-2)" }}>{e.by}</strong></span>
                  <Btn size="sm">Resolve</Btn>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Queue = Queue;
