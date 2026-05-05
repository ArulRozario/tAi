// ============================================================
// Dashboard
// ============================================================

const Dashboard = ({ onNavigate }) => {
  const { PROJECTS, ACTIVITY, TEAM, QUEUE, WEEKLY_PAGES } = window.tAIData;

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good morning, Ravi</h1>
          <p className="page-subtitle">5 pages need your review · 3 escalations open · last sync 2 min ago</p>
        </div>
        <div className="row">
          <Btn icon="download">Export weekly</Btn>
          <Btn kind="primary" icon="plus" onClick={() => onNavigate("projects")}>New project</Btn>
        </div>
      </div>

      <div className="grid grid--4" style={{ marginBottom: "var(--sp-6)" }}>
        <div className="card">
          <div className="stat">
            <div className="stat__label">Active projects</div>
            <div className="stat__value tabnums">12</div>
            <div className="stat__delta"><Icon name="arrowUp" size={12}/> +2 this month</div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="stat__label">Pages translated</div>
            <div className="stat__value tabnums">1,240</div>
            <div className="stat__delta"><Icon name="arrowUp" size={12}/> 132 this week</div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="stat__label">Pending review</div>
            <div className="stat__value tabnums" style={{ color: "var(--warning)" }}>350</div>
            <div className="stat__delta stat__delta--down"><Icon name="arrowUp" size={12} style={{transform:"rotate(180deg)"}}/> −18 since Mon</div>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <div className="stat__label">Avg quality</div>
            <div className="stat__value tabnums" style={{ color: "var(--success)" }}>82%</div>
            <div className="stat__delta"><Icon name="arrowUp" size={12}/> +4pts</div>
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Throughput · last 12 weeks</h3>
            <div className="row" style={{ gap: 6 }}>
              <Pill>Pages</Pill>
              <Pill kind="default">Words</Pill>
            </div>
          </div>
          <div className="bar-chart">
            {WEEKLY_PAGES.map((v, i) => (
              <div key={i} className="bar-chart__bar" style={{ height: `${(v / 132) * 100}%`, opacity: 0.4 + (i / WEEKLY_PAGES.length) * 0.6 }} title={`Week ${i + 1}: ${v} pages`}>
                {i === WEEKLY_PAGES.length - 1 && <span className="bar-chart__label">w{i+1}</span>}
                {i === 0 && <span className="bar-chart__label">w1</span>}
              </div>
            ))}
          </div>
          <div className="row row--between" style={{ marginTop: 28, fontSize: 12, color: "var(--text-3)" }}>
            <span>Total: 1,061 pages</span>
            <span className="mono">peak 132 · avg 88</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">My queue</h3>
            <Btn kind="ghost" size="sm" onClick={() => onNavigate("queue")}>View all <Icon name="arrowRight" size={12}/></Btn>
          </div>
          <div className="col" style={{ gap: 0 }}>
            {QUEUE.slice(0, 5).map((q) => (
              <button key={q.id} onClick={() => onNavigate("review")} className="page-pill" style={{ justifyContent: "space-between", padding: "10px 12px" }}>
                <span className="row">
                  <StatusDot status={q.status} />
                  <span style={{ color: "var(--text)", fontWeight: 500 }}>{q.page}</span>
                  <span className="dim">·</span>
                  <span className="muted ellipsis" style={{maxWidth: 140}}>{q.project}</span>
                </span>
                <span className="row" style={{ gap: 8 }}>
                  <span className="tag">{q.errors} err</span>
                  <PriorityPill level={q.priority} />
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent projects</h3>
            <Btn kind="ghost" size="sm" onClick={() => onNavigate("projects")}>View all <Icon name="arrowRight" size={12}/></Btn>
          </div>
          <div className="col" style={{ gap: 14 }}>
            {PROJECTS.slice(0, 4).map((p) => (
              <div key={p.id} onClick={() => onNavigate("projectDetail", p)} style={{ cursor: "pointer" }}>
                <div className="row row--between" style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span className="mono dim">{p.progress}%</span>
                </div>
                <Progress value={p.progress} kind={p.progress === 100 ? "success" : null} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent activity</h3>
            <Btn kind="ghost" size="sm">View all <Icon name="arrowRight" size={12}/></Btn>
          </div>
          <div>
            {ACTIVITY.map((a, i) => (
              <div key={i} className="activity-item">
                <Avatar initials={a.initials} color={a.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div><strong>{a.user}</strong> <span className="muted">{a.action}</span> {a.target}</div>
                  <div className="activity-item__time">{a.time} ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
