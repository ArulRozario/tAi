// ============================================================
// Detailed Review View — full error analysis
// ============================================================

const Review = ({ onNavigate, onBack }) => {
  const { PASSAGE, ERRORS, QUALITY } = window.tAIData;
  const [selectedSeg, setSelectedSeg] = React.useState(3);
  const [expandedError, setExpandedError] = React.useState("e1");
  const [appliedErrors, setAppliedErrors] = React.useState({});

  const segErrors = ERRORS.filter(e => e.segment === selectedSeg);
  const currentSeg = PASSAGE.segments.find((s, i) => i === selectedSeg - 1) || PASSAGE.segments[2];

  return (
    <div className="page page--full fade-in">
      <div className="toolbar">
        <Btn kind="ghost" icon="arrowLeft" size="sm" onClick={onBack}>Back to queue</Btn>
        <div className="toolbar__sep" />
        <span style={{ fontSize: 12 }}>
          <span className="muted">Page</span> <strong>P78</strong> <span className="dim">·</span> Ch. 8 <span className="dim">·</span> Mere Christianity
        </span>
        <div className="toolbar__spacer" />
        <Pill kind="error" dot>Quality 45% · below threshold</Pill>
        <div className="toolbar__sep" />
        <Btn icon="chevronLeft" size="sm">Skip</Btn>
        <Btn kind="ghost" icon="download" size="sm">Export report</Btn>
        <Btn kind="success" icon="check" size="sm">Save & next</Btn>
      </div>

      <div className="workbench" style={{ gridTemplateColumns: "240px 1fr 360px" }}>
        {/* Segment list */}
        <aside className="workbench__sidebar">
          <div className="card-eyebrow" style={{ padding: "0 0 8px" }}>Segments · 25 total</div>
          {PASSAGE.segments.map((s, i) => {
            const segNum = i + 1;
            const hasErr = ERRORS.some(e => e.segment === segNum && e.severity !== "low");
            return (
              <div
                key={s.id}
                className={`page-pill ${segNum === selectedSeg ? "is-active" : ""}`}
                onClick={() => setSelectedSeg(segNum)}
              >
                <span className={`status-dot status-dot--${s.status === "good" ? "approved" : s.status === "error" ? "changes" : "review"}`} />
                <span style={{ fontWeight: 500 }}>Seg {segNum}</span>
                <span className="dim ellipsis" style={{ fontSize: 11, marginLeft: 4 }}>
                  {s.en.slice(0, 18)}…
                </span>
                {hasErr && <span className="tag" style={{ marginLeft: "auto", color: "var(--error)" }}>{ERRORS.filter(e => e.segment === segNum).length}</span>}
              </div>
            );
          })}
          <div className="divider" />
          <div className="card-eyebrow">Page progress</div>
          <div style={{ marginTop: 8 }}>
            <div className="row row--between" style={{ fontSize: 11, marginBottom: 4 }}>
              <span>3 of 25 reviewed</span>
              <span className="mono">12%</span>
            </div>
            <Progress value={12} />
          </div>
        </aside>

        {/* Center analysis */}
        <div className="workbench__main" style={{ overflowY: "auto", padding: "var(--sp-6)" }}>
          {/* Side-by-side */}
          <div className="card" style={{ padding: 0, marginBottom: "var(--sp-5)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }} className="row row--between">
              <div className="row">
                <h3 className="card-title">Side-by-side comparison</h3>
                <Pill>Segment {selectedSeg}</Pill>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <Btn kind="ghost" size="sm" icon="copy">Copy</Btn>
                <Btn kind="ghost" size="sm" icon="eye">Diff view</Btn>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: 16, borderRight: "1px solid var(--border)" }}>
                <div className="card-eyebrow">English · Original</div>
                <p style={{ fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>{currentSeg.en}</p>
              </div>
              <div style={{ padding: 16 }}>
                <div className="row row--between">
                  <div className="card-eyebrow">Tamil · Current translation</div>
                  <Pill kind="error">3 issues</Pill>
                </div>
                <p className="ta" style={{ marginTop: 8 }}>
                  தேவன் உலகத்தை அவ்வளவாய் <mark className="diff-bad">நேசித்தார்</mark>, அவரை <mark className="diff-bad">நம்பினால்</mark> கெட்டுப்போகாமல் <mark className="diff-warn">[..nithiya jeevanai..]</mark> தம்முடைய ஒரே பேறான குமாரனை அளித்தார்.
                </p>
              </div>
            </div>
          </div>

          {/* Suggested correction */}
          <div className="card" style={{ marginBottom: "var(--sp-5)", borderColor: "var(--success)", boxShadow: "0 0 0 1px var(--success-soft)" }}>
            <div className="row row--between" style={{ marginBottom: 12 }}>
              <div className="row">
                <Icon name="sparkles" size={14} style={{color: "var(--success)"}} />
                <h3 className="card-title">Suggested correction</h3>
                <Pill kind="success">All fixes applied</Pill>
              </div>
              <div className="row">
                <Btn size="sm" icon="edit">Edit</Btn>
                <Btn kind="success" size="sm" icon="check">Apply suggestion</Btn>
              </div>
            </div>
            <p className="ta" style={{ fontSize: 14, lineHeight: 1.8 }}>
              தேவன் உலகத்தின்மேல் அவ்வளவாய் <mark className="diff-good">அன்புகூர்ந்தார்</mark>, அவரிடம் <mark className="diff-good">விசுவாசம் வைக்கிற</mark> எவனும் கெட்டுப்போகாமல் <mark className="diff-good">நித்திய ஜீவனை அடையும்படி</mark> தம்முடைய ஒரே பேறான குமாரனை அளித்தார்.
            </p>
          </div>

          {/* Error analysis */}
          <div className="row row--between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Error analysis · {segErrors.length || 3} issues in segment {selectedSeg}</h3>
            <div className="row" style={{ gap: 6 }}>
              <Btn kind="ghost" size="sm">Collapse all</Btn>
            </div>
          </div>

          {(segErrors.length ? segErrors : ERRORS.slice(0, 3)).map(err => {
            const expanded = expandedError === err.id;
            const applied = appliedErrors[err.id];
            return (
              <div key={err.id} className={`error-card severity-${err.severity}`}>
                <div className="error-card__head">
                  <div className="row">
                    <Pill kind={err.severity === "critical" || err.severity === "high" ? "error" : err.severity === "medium" ? "warning" : "default"} dot>
                      {err.severity}
                    </Pill>
                    <span className="error-card__title" style={{ color: err.severity === "critical" ? "var(--error)" : err.severity === "high" ? "var(--accent)" : err.severity === "medium" ? "var(--warning)" : "var(--text-2)" }}>{err.category}</span>
                    <span className="dim" style={{ fontSize: 11 }}>· {err.location}</span>
                  </div>
                  <div className="row">
                    {applied && <Pill kind="success" dot>Applied</Pill>}
                    <Btn kind="ghost" icon={expanded ? "chevronDown" : "chevronRight"} size="sm" onClick={() => setExpandedError(expanded ? null : err.id)} />
                  </div>
                </div>

                <div className="grid grid--2" style={{ gap: 16, fontSize: 13 }}>
                  <div>
                    <div className="card-eyebrow">Current</div>
                    <div className="ta" style={{ background: "var(--error-soft)", color: "var(--error)", padding: "6px 10px", borderRadius: 4, marginTop: 4 }}>{err.current}</div>
                  </div>
                  <div>
                    <div className="card-eyebrow">Should be</div>
                    <div className="ta" style={{ background: "var(--success-soft)", color: "var(--success)", padding: "6px 10px", borderRadius: 4, marginTop: 4 }}>{err.suggested}</div>
                  </div>
                </div>

                {expanded && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    <div style={{ marginBottom: 12 }}>
                      <div className="card-eyebrow">Issue</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>{err.issue}</div>
                    </div>
                    <div className="grid grid--2" style={{ marginBottom: 12 }}>
                      <div>
                        <div className="card-eyebrow">Reference</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}><Icon name="book" size={12} style={{verticalAlign: -2, marginRight: 4}}/> {err.reference}</div>
                      </div>
                      <div>
                        <div className="card-eyebrow">AI analysis</div>
                        <div className="dim" style={{ fontSize: 12, marginTop: 4, fontStyle: "italic" }}>"{err.aiNote}"</div>
                      </div>
                    </div>
                    <div className="row" style={{ gap: 6, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                      <Btn size="sm" kind="success" icon="check" onClick={() => setAppliedErrors({ ...appliedErrors, [err.id]: true })}>Apply</Btn>
                      <Btn size="sm" icon="edit">Edit manually</Btn>
                      <Btn size="sm" icon="plus">Add to exceptions</Btn>
                      <Btn size="sm" kind="ghost" icon="flag">Escalate</Btn>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Summary */}
          <div className="card" style={{ marginTop: "var(--sp-6)" }}>
            <div className="card-header">
              <h3 className="card-title">Review summary</h3>
              <Btn kind="ghost" size="sm" icon="download">Export report</Btn>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 12px" }}><strong>AI feedback:</strong> "This translation uses modern colloquial Tamil instead of Thiruviviliam style. Multiple terminology errors detected. Recommend re-translation with explicit Thiruviviliam prompt and term locking."</p>
              <p style={{ margin: 0 }}><strong>Reviewer notes:</strong> "Chapter 8 contains many theological terms — careful review of Christology terminology needed. Suggest checking against BHSI Tamil glossary."</p>
            </div>
            <div className="divider" />
            <div className="row" style={{ gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Btn icon="refresh">Regenerate</Btn>
              <Btn icon="flag">Escalate</Btn>
              <Btn icon="x" kind="danger">Request changes</Btn>
              <Btn kind="success" icon="check">Approve with notes</Btn>
            </div>
          </div>
        </div>

        {/* Right inspector */}
        <aside className="workbench__inspector">
          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="card-eyebrow" style={{ marginBottom: 8 }}>Quality score</div>
            <div className="row" style={{ gap: 16, marginBottom: 14 }}>
              <QualityRing value={QUALITY.overall} size={72} />
              <div style={{ flex: 1, fontSize: 12 }}>
                <div className="dim">Overall</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--error)" }}>Below threshold</div>
                <div className="dim" style={{ marginTop: 4 }}>Threshold: 70%</div>
              </div>
            </div>
            <div className="col" style={{ gap: 10 }}>
              {[
                { k: "Accuracy", v: QUALITY.accuracy, kind: "error" },
                { k: "Fluency", v: QUALITY.fluency, kind: "error" },
                { k: "Style", v: QUALITY.style, kind: "error" },
                { k: "Terminology", v: QUALITY.terminology, kind: "warning" },
              ].map(r => (
                <div key={r.k}>
                  <div className="row row--between" style={{ fontSize: 11, marginBottom: 4 }}>
                    <span>{r.k}</span>
                    <span className="mono tabnums">{r.v}%</span>
                  </div>
                  <Progress value={r.v} kind={r.kind} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="row row--between" style={{ marginBottom: 10 }}>
              <div className="card-eyebrow">Errors · {ERRORS.length} total</div>
              <Pill kind="error">15 found</Pill>
            </div>
            <div className="col" style={{ gap: 4 }}>
              {ERRORS.map(e => (
                <div key={e.id} onClick={() => { setSelectedSeg(e.segment); setExpandedError(e.id); }} className="row" style={{ padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12, background: expandedError === e.id ? "var(--surface-2)" : "transparent" }}>
                  <span className={`status-dot status-dot--${e.severity === "critical" || e.severity === "high" ? "changes" : e.severity === "medium" ? "review" : "pending"}`} />
                  <span style={{ fontWeight: 500 }}>{e.category}</span>
                  <span className="dim ellipsis" style={{ marginLeft: "auto", maxWidth: 110, fontSize: 11 }}>seg {e.segment}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 16, borderBottom: "1px solid var(--border)" }}>
            <div className="card-eyebrow" style={{ marginBottom: 10 }}>Quick actions</div>
            <div className="col" style={{ gap: 6 }}>
              <Btn icon="refresh" className="btn--block">Regenerate translation</Btn>
              <Btn icon="copy" className="btn--block">Copy original</Btn>
              <Btn icon="book" className="btn--block">Use term from glossary</Btn>
              <Btn icon="note" className="btn--block">Add reviewer note</Btn>
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div className="card-eyebrow" style={{ marginBottom: 10 }}>Glossary lookup</div>
            <div className="card card--inline" style={{ background: "var(--bg)", fontSize: 12 }}>
              <div className="row row--between" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>"faith" (divine)</span>
                <Pill>v3.2</Pill>
              </div>
              <div className="ta" style={{ fontSize: 14, color: "var(--success)" }}>விசுவாசம்</div>
              <div className="dim" style={{ fontSize: 11, marginTop: 4 }}>Not "நம்பிக்கை" — that's generic trust/hope</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

window.Review = Review;
