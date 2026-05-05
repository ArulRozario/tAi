// ============================================================
// Workbench - main translation interface
// ============================================================

const Workbench = ({ onNavigate, onBack }) => {
  const { PASSAGE } = window.tAIData;
  const [pageNum, setPageNum] = React.useState(12);
  const [view, setView] = React.useState("side"); // side | overlay
  const [zoom, setZoom] = React.useState(100);

  const pages = [
    { n: 10, status: "review" }, { n: 11, status: "review" }, { n: 12, status: "review" },
    { n: 13, status: "pending" }, { n: 14, status: "pending" }, { n: 15, status: "pending" },
    { n: 16, status: "pending" }, { n: 17, status: "processing" }, { n: 18, status: "pending" },
  ];

  return (
    <div className="page page--full fade-in">
      <div className="toolbar">
        <Btn kind="ghost" icon="arrowLeft" size="sm" onClick={onBack}>Back</Btn>
        <div className="toolbar__sep" />
        <span style={{ fontSize: 12 }}>
          <span className="muted">Project</span> <strong>Pilgrim's Progress</strong> <span className="dim">·</span> Ch. 3 <span className="dim">·</span> Page {pageNum}
        </span>
        <div className="toolbar__sep" />
        <div className="toolbar__group">
          <Btn kind="ghost" icon="chevronLeft" size="sm" onClick={() => setPageNum(Math.max(1, pageNum - 1))} />
          <span className="mono tag tabnums">{pageNum} / 22</span>
          <Btn kind="ghost" icon="chevronRight" size="sm" onClick={() => setPageNum(pageNum + 1)} />
        </div>
        <div className="toolbar__spacer" />
        <div className="toolbar__group">
          <Btn kind="ghost" size="sm" onClick={() => setZoom(Math.max(50, zoom - 25))}>−</Btn>
          <span className="mono tag tabnums" style={{minWidth: 48, textAlign: "center"}}>{zoom}%</span>
          <Btn kind="ghost" size="sm" onClick={() => setZoom(zoom + 25)}>+</Btn>
        </div>
        <div className="toolbar__sep" />
        <div className="toolbar__group">
          <Btn icon="columns" kind={view === "side" ? "default" : "ghost"} size="sm" onClick={() => setView("side")}>Side-by-side</Btn>
          <Btn icon="layout" kind={view === "overlay" ? "default" : "ghost"} size="sm" onClick={() => setView("overlay")}>Overlay</Btn>
        </div>
        <Btn kind="primary" size="sm" icon="sparkles" onClick={() => onNavigate("review")}>Open analysis</Btn>
      </div>

      <div className="workbench">
        {/* Left sidebar - page list */}
        <aside className="workbench__sidebar">
          <div className="card-eyebrow" style={{padding: "0 0 8px"}}>Chapter 3 · 22 pages</div>
          {pages.map(p => (
            <div key={p.n} className={`page-pill ${p.n === pageNum ? "is-active" : ""}`} onClick={() => setPageNum(p.n)}>
              <StatusDot status={p.status} />
              <span className="mono">P{String(p.n).padStart(2, "0")}</span>
              <span className="dim" style={{ marginLeft: "auto", fontSize: 11 }}>—</span>
            </div>
          ))}
          <div className="divider" />
          <div className="card-eyebrow" style={{padding: "0 0 8px"}}>Reviewer notes</div>
          <textarea className="textarea" placeholder="Add a note for this page…" defaultValue="Ch.8 has dense theological terminology — verify against BHSI Tamil glossary." style={{ fontSize: 12, minHeight: 100 }} />
        </aside>

        {/* Center - PDF panes */}
        <div className="workbench__main">
          <div style={{ flex: 1, display: "flex", gap: 12, padding: 12, minHeight: 0 }}>
            <div className="pdf-pane">
              <div className="pdf-pane__header">
                <span>Original · English</span>
                <Pill>Page {pageNum}</Pill>
              </div>
              <div className="pdf-pane__body">
                <p style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Chapter 3 · Section 2</p>
                <p style={{ fontWeight: 600, fontSize: 16, marginTop: 8 }}>Of Faith and the World</p>
                {PASSAGE.segments.map((s, i) => (
                  <p key={s.id} style={{ background: s.selected ? "var(--accent-soft)" : "transparent", borderRadius: 4, padding: s.selected ? "4px 8px" : 0, margin: s.selected ? "0 -8px 1em" : "0 0 1em" }}>
                    <span className="mono dim" style={{ fontSize: 10, marginRight: 8 }}>{i+1}</span>{s.en}
                  </p>
                ))}
              </div>
            </div>

            <div className="pdf-pane">
              <div className="pdf-pane__header">
                <span>Translation · Tamil</span>
                <Pill kind="warning" dot>In review</Pill>
              </div>
              <div className="pdf-pane__body ta">
                <p style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>அதிகாரம் ௩ · பகுதி ௨</p>
                <p style={{ fontWeight: 600, fontSize: 17, marginTop: 8 }}>விசுவாசத்தையும் உலகையும் குறித்து</p>
                {PASSAGE.segments.map((s, i) => (
                  <p key={s.id} style={{ background: s.selected ? "var(--accent-soft)" : "transparent", borderRadius: 4, padding: s.selected ? "4px 8px" : 0, margin: s.selected ? "0 -8px 1em" : "0 0 1em" }}>
                    <span className="mono dim" style={{ fontSize: 10, marginRight: 8, fontFamily: "var(--font-mono)" }}>{i+1}</span>{s.ta}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Extraction details */}
          <div style={{ padding: "0 12px 12px" }}>
            <div className="card card--inline">
              <div className="row row--between">
                <div className="row">
                  <Icon name="sparkles" size={14} style={{ color: "var(--accent)" }}/>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>Extraction · selected segment</span>
                  <Pill>Confidence 75%</Pill>
                </div>
                <Btn kind="ghost" icon="chevronDown" size="sm">Expand</Btn>
              </div>
              <div className="grid grid--2" style={{ marginTop: 12, gap: 16, fontSize: 13 }}>
                <div>
                  <div className="card-eyebrow">Original</div>
                  <div>"For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish."</div>
                </div>
                <div>
                  <div className="card-eyebrow">Translation</div>
                  <div className="ta">"<mark className="diff-bad">தேவன் உலகத்தை அவ்வளவாய் நேசித்தார்</mark>, <mark className="diff-bad">அவரை நம்பினால்</mark> கெட்டுப்போகாமல்…"</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right - inspector */}
        <aside className="workbench__inspector">
          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="card-eyebrow">Page #12</div>
            <div className="row row--between" style={{ marginTop: 4 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Chapter 3 · 1984</h3>
              <StatusPill status="review" />
            </div>
            <div className="row" style={{ gap: 16, marginTop: 12, fontSize: 12 }}>
              <div><div className="dim">Assigned</div><div>You</div></div>
              <div><div className="dim">Last AI run</div><div>2m ago</div></div>
            </div>
          </div>

          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="card-eyebrow" style={{ marginBottom: 10 }}>Quality</div>
            <div className="quality-meter">
              <QualityRing value={78} size={64} />
              <div style={{ flex: 1 }}>
                <div className="row row--between" style={{ fontSize: 11, marginBottom: 4 }}><span>Accuracy</span><span className="mono">82%</span></div>
                <Progress value={82} kind="success" />
                <div className="row row--between" style={{ fontSize: 11, margin: "8px 0 4px" }}><span>Style</span><span className="mono">71%</span></div>
                <Progress value={71} kind="warning" />
                <div className="row row--between" style={{ fontSize: 11, margin: "8px 0 4px" }}><span>Terms</span><span className="mono">65%</span></div>
                <Progress value={65} kind="warning" />
              </div>
            </div>
          </div>

          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="card-eyebrow" style={{ marginBottom: 10 }}>AI feedback</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              "Translation reads naturally but uses modern register where Thiruviviliam expects formal Bible vocabulary. Two terminology substitutions recommended."
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div className="card-eyebrow" style={{ marginBottom: 10 }}>Actions</div>
            <div className="col" style={{ gap: 8 }}>
              <Btn kind="success" icon="check" className="btn--block">Approve page</Btn>
              <Btn icon="refresh" className="btn--block">Request changes</Btn>
              <Btn kind="ghost" icon="users" className="btn--block">Reassign</Btn>
              <Btn kind="ghost" icon="flag" className="btn--block">Escalate to master</Btn>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

window.Workbench = Workbench;
