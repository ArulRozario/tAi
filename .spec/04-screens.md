# tAI — Screen Specifications

> **Authority:** These specs are derived directly from the Claude designs in `Claude designs/TranslationAI/screens/`. When any other document conflicts with this file, this file wins.

---

## General Design Language & Tokens

The application strictly adheres to the high-density "Intelligence Core" design language extracted from the React mockups, implemented natively in the wireframes via **Angular 21**, **PrimeNG 21**, and **Tailwind CSS**.

### Colors & Hierarchy
- **Surfaces & Borders:** `var(--bg)`, `var(--surface-1)`, `var(--surface-2)`, `var(--border)`
- **Text Hierarchy:** `var(--text-1)` (primary), `var(--text-2)` (dim), `var(--text-3)` (muted)
- **Status Severities:** Mapped natively to PrimeNG severities (`success`, `info`, `warn`, `danger`).
- **Typography:** `--font-sans` for main UI elements, `--font-mono` (with `tabular-nums`) for data grids, percentages, and segment counts.

### Global CSS Utilities
- `.card` → `@apply bg-surface-1 border border-border rounded-lg shadow-sm p-4;`
- `.card-eyebrow` → `@apply text-xs font-semibold text-color-secondary uppercase tracking-wider mb-2;`
- `.page-pill` → `@apply flex items-center p-2 rounded-md hover:bg-surface-2 cursor-pointer transition-colors;`

### PrimeNG Component Mappings
- **Buttons (`<Btn>`):** `<p-button>` (use `[text]="true"` for ghost variants).
- **Badges/Pills (`<Pill>`):** `<p-tag>` or `<p-badge>` with `[rounded]="true"`.
- **Progress (`<Progress>`, `<QualityRing>`):** `<p-progressBar>` or `<p-knob [readonly]="true">`.
- **Icons (`<Icon>`):** `<i class="pi pi-..."></i>` (PrimeIcons).

---

## Navigation Shell

Top bar present on all non-workbench screens:

```
tAI  |  Dashboard  Projects  Queue  Genres  [Admin ▼]
```

Admin dropdown contains: **Team**, **Settings**.

The genre editor and workbench use full-page layouts with their own toolbars instead of the top nav.

---

## Screen 1: Auth (`auth.jsx`)

Single centered card. Switches between `login` and `forgot` modes — no page navigation.

### Login mode
```
tAI
TRANSLATION INTELLIGENCE

Sign in
Welcome back. Pick up where you left off.

Email         [ravi@tai.ws________________]
Password      [••••••••________________]

[✓] Remember me            Forgot password?

[          Sign in          ]

Any language · Any domain
```

### Forgot mode
```
tAI
TRANSLATION INTELLIGENCE

Reset password
Enter your email and we'll send a reset link.

Email         [________________________]

[      Send reset link      ]

← Back to sign in
```

After "Send reset link": show a success card with a checkmark and "Reset link sent to {email}".

Password reset itself lives at `/reset-password/:token` (separate route, same card style).

---

## Screen 2: Dashboard (`dashboard.jsx`)

```
Good morning, Ravi
5 pages need your review · 3 escalations open · last sync 2 min ago
                                                          [New project]

┌────────────── ┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│Active projects│ │Pages transl. │ │Pending review│ │Avg quality   │
│     12        │ │   1,240      │ │    350       │ │    82%       │
│↑ +2 this month│ │↑ 132 this wk │ │↓ −18 since Mo│ │↑ +4pts       │
└────────────── ┘ └──────────────┘ └──────────────┘ └──────────────┘

┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│ Throughput · last 12 weeks            │ │ My queue            View all→ │
│ [Pages] [Words]                       │ │ ● P45 · Pilgrim's  3err Medium│
│ ██ ██ ██ █ ██ ██ ██ ██ ██ █ ██ ██     │ │ ● P46 · Pilgrim's  2err Low   │
│                                       │ │ ● P12 · Don Quixo  8err High  │
│ Total: 1,061 pages  peak 132 · avg 88 │ │ ● P78 · 1984      15err Crit  │
└───────────────────────────────────────┘ │ ● P23 · Alchemist  5err Med   │
                                          └───────────────────────────────┘

┌───────────────────────────────────────┐ ┌───────────────────────────────┐
│ Recent projects             View all→ │ │ Recent activity     View all→ │
│ Pilgrim's Progress     ████░░░  45%   │ │ 👤 RK approved P12  2m ago    │
│ Mere Christianity      ██████  100%   │ │ 👤 DA requested…    5m ago    │
│ Don Quixote            ██░░░░   25%   │ │ 👤 MR escalated P78 12m ago   │
│ Cost of Discipleship   ░░░░░░    0%   │ │ System translated Ch2  1h ago │
└───────────────────────────────────────┘ └───────────────────────────────┘
```

### Components
- **Layout:** Top section uses `grid-cols-4 gap-6`. Bottom section uses `grid-cols-2 gap-6`.
- 4 stat cards: value + delta with arrow icon (up/down colored)
- Throughput: bar chart with bar heights proportional to weekly pages; `[Pages]` (active pill) / `[Words]` (default pill) toggle; last-bar label shown
- My queue rows: `StatusDot` + page name + project (ellipsis) + error tag + `PriorityPill`
- Recent projects: name + `Progress` bar + percentage (mono)
- Recent activity: `Avatar` (initials + color) + user bold + action muted + target + time

### Actions
| Element | Behaviour |
|---------|-----------|
| New project | Navigate to `/projects?new=true`; ProjectListComponent detects query param on init and opens the modal |
| Pages/Words pills | Refetch /dashboard/throughput?metric=pages\|words |
| Queue row click | Navigate to /review/:pageId |
| View all (queue) | Navigate to /queue |
| Recent project click | Navigate to /projects/:id |
| Activity item click | Navigate to entityHref from ActivityLog |

---

## Screen 3: Projects List (`projects.jsx::ProjectsList`)

```
Projects
12 projects · 4,840 total pages
                              [Search projects]  [All ▼]  [+ New project]

┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Project                │Ch│ Pages │   Progress    │Quality│ Status │Owner│ Actions          │
├────────────────────────┼──┼───────┼───────────────┼───────┼────────┼────┼──────────────────┤
│ Pilgrim's Progress     │  │       │               │       │        │    │                  │
│ English → Tamil · Lit  │ 9│   180 │ ████████░░ 45%│  82%  │ Active │ RK │ [✎] [⏸] [⏹] [🗑] │
├────────────────────────┼──┼───────┼───────────────┼───────┼────────┼────┼──────────────────┤
│ Mere Christianity      │  │       │               │       │        │    │                  │
│ English → French · Lit │12│   328 │ ██████████100%│  91%  │Complete│ RK │ [✎] [▶] [⏹] [🗑] │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

- Project cell shows name (bold) and subtitle "English → Tamil · Literary Translation" (dim, 11px)
- Quality cell: colored (green ≥80%, warning color otherwise); "—" if zero
- Owner: `Avatar` initials only
- Row click → navigate to /projects/:id
- Actions: Inline icon buttons replacing the hidden menu: Edit `[✎]`, Pause `[⏸]` or Resume `[▶]`, Cancel Jobs `[⏹]`, and Delete `[🗑]`.
- Status filter: All / Active / Paused / Complete / New
- Search is live (client-side filter on name)

### New Project Modal (`projects.jsx::NewProjectModal`)

```
Create new project                                               [×]

Project name  [The Cost of Discipleship_________________]

Source language [English ▼]    Target language [Tamil ▼]

Genre
(●) [📖] Literary Translation                      v1.0
( ) [⚖] Legal Documents                            v2.1
( ) [🏥] Medical Reports                           v1.3

┌────────────────────────────────────────────────────────┐
│              [↑ upload icon]                           │
│              Drop PDF here                             │
│                   or                                   │
│              [Browse files]                            │
│     Scanned PDF · up to 500MB                          │
└────────────────────────────────────────────────────────┘

[Cancel]                              [Create project]
```

- Source and target language selects are fully functional; present a searchable dropdown of common languages (ISO 639-1 names)
- Genre: radio card list — icon in colored circle, name bold, description dim ellipsis, version pill
- Dropzone: drag-over state adds `is-active` class
- Create project → POST /files/upload → POST /projects → auto-triggers PROCESS_DOCUMENT job → navigate to /projects/:id

---

## Screen 4: Project Detail (`projects.jsx::ProjectDetail`)

```
← Back  /  Projects  /  Pilgrim's Progress

Pilgrim's Progress
English → Tamil · Literary Translation · 94 pages · 5 chapters
Genre  [● Literary Translation  v1.0  ▼]

                                     [Pause ⏸]  [Edit]  [Export ▼]  [Open workbench]

┌─────────────────────┐ ┌─────────────────────┐ ┌────────────┐ ┌──────────────────────┐
│ Approved            │ │ In review           │ │ Pending    │ │ Avg quality          │
│ 38  ████████░░      │ │ 12  ███░░░░░░░      │ │ 44  ████░░ │ │ ◎ 82%                │
│                     │ │                     │ │            │ │ across 38 approved   │
│                     │ │                     │ │            │ │ 👤SJ 👤DA 👤MR       │
└─────────────────────┘ └─────────────────────┘ └────────────┘ └──────────────────────┘

┌─────────────────────────────────────────┐ ┌──────────────────────────────────────────┐
│ Chapters                   [+ Add chap] │ │ Pages · Chapter 3         Click to open  │
├─────────────────────────────────────────┤ ├──────────────────────────────────────────┤
│ > Chapter 1  · 20p  ████████████  20/20 │ │  1  2  3  4  5  6  7  8  9 10 11 12      │
│              [Done]                     │ │ 13 14 15 16 17 18 19 20 21 22            │
│ > Chapter 2  · 18p  ████████░░░  18/18  │ │ (each cell colored by status)            │
│              [Done]                     │ │                                          │
│ > Chapter 3  · 22p  █████░░░░░░  12/22  │ │ ● Approved  ◐ In review  ○ Pending       │
│              [In progress]              │ │ ⚠ Changes   ▶ Processing                 │
│ > Chapter 4  · 15p  ░░░░░░░░░░   0/15   │ │                                          │
│              [Queued]                   │ │                                          │
│ > Chapter 5  · 19p  ░░░░░░░░░░   0/19   │ │                                          │
│              [Queued]                   │ │                                          │
└─────────────────────────────────────────┘ └──────────────────────────────────────────┘
```

- Genre picker: colored dot + name + version pill + chevron; click navigates to `/genres/:id`
- Export button: split button — default label "Export PDF"; dropdown reveals "Export as DOCX", "Export as Text", and "Export as HTML"; all scopes default to approved-only; clicking any option opens a small confirm dialog: "Export N approved pages as {format}? [Cancel] [Export]" → POST /export/project/:id
- 4 stat cards: Approved/InReview/Pending show count + `Progress` bar; Avg quality shows `QualityRing` + "across N approved pages" + reviewer avatar row
- Chapter rows: expand icon + "Chapter N" + page count (dim) + progress bar (100px) + "done/total" (mono) + status pill (Done/In progress/Queued)
- Page grid: each cell is `page-grid__cell` with status class (`s-approved`, `s-review`, `s-pending`, `s-changes`, `s-processing`, `s-error`); click navigates to `/workbench/:pageId`
- ERROR cells show a red ⚠ icon; clicking opens the workbench where the error message and a "Retry" button are shown in the job banner
- "Add chapter" button in chapters card header

---



## Screen 5: Queue (`queue.jsx`)

```
My queue
5 pages awaiting your review · 3 escalated to master

                        [Sort: Priority ▼]  [Filters]  [ ] Low quality only

┌──────┬──────────────┬───┬────────────────────┬───────────────┬──────────┬───────┬──────────┬──────────┐
│ Page │ Project      │Ch.│ Quality            │ Errors        │ Priority │ Wait  │ Status   │          │
├──────┼──────────────┼───┼────────────────────┼───────────────┼──────────┼───────┼──────────┼──────────┤
│ P45  │ Pilgrim's    │ 3 │ 78% ████████░░     │ 3 issues      │ Medium   │  2m   │ Review   │Review→   │
│ P46  │ Pilgrim's    │ 3 │ 82% ████████░░     │ 2 issues      │ Low      │  5m   │ Review   │Review→   │
│ P12  │ Don Quixote  │ 1 │ 65% ██████░░░░     │ 8 issues      │ High     │  1h   │ Review   │Review→   │
│ P78  │ 1984         │ 8 │ 45% ████░░░░░░     │ 15 issues     │ Critical │  2h   │ Review   │Review→   │
│ P23  │ Alchemist    │ 2 │ 71% ███████░░░     │ 5 issues      │ Medium   │  3h   │ Review   │Review→   │
└──────┴──────────────┴───┴────────────────────┴───────────────┴──────────┴───────┴──────────┴──────────┘

┌──────────────────────────────────────────────────────────┐  ┌────────────────────────────────────────┐
│ Error distribution · across queue              33 issues  │  │ Needs attention                        │
│                                                           │  │ Escalated to master reviewer  3 open   │
│ Terminology  ▪ high  ████████████░░░ 8                    │  │                                        │
│ "attorney" → "avvokat" vs "abogado"                       │  │ ┌──────────────────────────────────┐   │
│                                                           │  │ │ P78 · Mere Christianity · Ch. 8  │   │
│ Style        ▪ med   █████████░░░░░░ 5                    │  │ │                    [Terminology] │   │
│ "Too colloquial"                                          │  │ │ "Style guide violation"          │   │
│                                                           │  │ │ Escalated by Selvi      [Resolve]│   │
│ Accuracy     ▪ high  ██████░░░░░░░░░ 3                    │  │ └──────────────────────────────────┘   │
│ "Meaning altered"                                         │  │ ┌──────────────────────────────────┐   │
│                                                           │  │ │ P156 · Pilgrim's · Ch. 12        │   │
│ Fluency      ▪ low   ████░░░░░░░░░░░ 2                    │  │ │                    [Style]       │   │
│ "Awkward phrasing"                                        │  │ │ "Register inconsistency"         │   │
│                                                           │  │ │ Escalated by Daniel     [Resolve]│   │
│ Quick filter: [ ] Terminology [ ] Style [ ] Accuracy [ ] Fluency │  └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘  └────────────────────────────────────────┘
```

### Queue table
- Quality cell: colored mono value + short `Progress` bar (60px) — red <60%, warning <80%, success ≥80%
- Errors cell: `tag` colored (error >8, warning >4, text-2 otherwise)
- Priority: `PriorityPill`
- Status: `StatusPill`
- Row click OR "Review→" button → navigate to /review/:pageId

### Error distribution card
Per error type: colored square + type name + severity pill + progress bar (proportional to count) + example text beneath

### Needs attention card (escalated)
Per escalation: page/project/chapter header row + issue type pill + summary quote + "by {name}" + **Resolve** button
Resolve → POST /pages/:id/resolve-escalation (modal with resolution note field)

### Sort options: Priority, Quality, Time waiting
### Filters button: opens filter drawer (error types, reviewer, status range)

---

## Screen 6: Workbench / Review (`workbench.jsx`)

> **One component, two routes:** `/workbench/:pageId` and `/review/:pageId` use the same `WorkbenchComponent`. The component detects its context from the route:
> - **`/workbench/:pageId`** (browse mode) — navigated from project detail page grid; "Back" returns to `/projects/:id`; no "Save & next" flow; all pages in the chapter visible in sidebar.
> - **`/review/:pageId`** (queue mode) — navigated from the review queue; "Back" returns to `/queue`; "Complete" calls `GET /pages/:id/next-in-queue` and navigates to the next queued page; sidebar shows only the reviewer's assigned queue pages.
>
> The toolbar and three-column layout are identical; only the back-navigation target, sidebar filter, and the Complete button behavior differ.

Full-page layout. Three columns defined strictly by CSS Grid (`gridTemplateColumns: "240px 1fr 360px"`): **240px** left sidebar (Page Navigation) | **1fr** middle column (PDF panes & translation diffs) | **360px** right inspector (Quality, Errors, Guidelines).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to queue │ Page P78 · Ch. 8 · Mere Christianity                                                     │
│ Progress: 1 / 4 accepted [████░░░░░░]                                        [Skip ◀]  [✓ Complete]        │
├─────────────────┬──────────────────────────────────────────┬───────────────────────────────────────────────┤
│ Chapter 8 · 15p │ Original (Source)                        │ Translation (Target)                          │
│                 │                                          │                                               │
│ ◐ P76           │ [✓] 1  For God so loved the world that he│ தேவன், தம்முடைய ஒரேபேறான குமாரனை            │
│ ◐ P77           │        gave his one and only Son, that   │ விசுவாசிக்கிறவன் எவனோ அவன் கெட்டுப்போகாமல்  │
│ ◐ P78 (active)  │        whoever believes in him shall not │ நித்தியஜீவனை அடையும்படிக்கு, அவரைத்          │
│ ○ P79           │        perish but have eternal life.     │ தந்தருளி, இவ்வளவாய் உலகத்தில் அன்புகூர்ந்தார். │
│ ○ P80           │                                          │                                               │
│                 │ [ ] 2  For God did not send his Son into │ உலகத்தை ஆக்கினைக்குள்ளாகத் தீர்க்கும்படி தேவன்  │
│                 │        the world to condemn the world,   │ தம்முடைய குமாரனை உலகத்தில் அனுப்பாமல்,      │
│                 │        but to save the world through him.│ அவராலே உலகம் இரட்சிக்கப்படுவதற்காகவே அனுப்பினார்.│
│                 │                                          │                                               │
│                 │ [ ] 3  Whoever believes in him is not    │ அவரை விசுவாசிக்கிறவன் ஆக்கினைக்குள்ளாகத்        │
│                 │        condemned, but whoever does not   │ தீர்க்கப்படான்; விசுவாசியாதவனோ தேவனுடைய குமாரன் │
│                 │        believe stands condemned already  │ நாமத்தில் விசுவாசமாயிராததால், அவன்            │
│                 │    because they have not believed in     │ [red-underline]ஏற்கனவே தண்டிக்கப்பட்டிருக்கிறான்[/].          │
│                 │    the name of God’s one and only        │  ┌─────────────────────────────────────────┐  │
│                 │    Son.                                  │  │ ✦ AI Suggestions                        │  │
│                 │                                          │  │ [high] TERMINOLOGY                      │  │
│                 │                                          │  │ Consider using 'ஆக்கினைக்குள்ளாகத்'      │  │
│                 │                                          │  │ to match formal theological register.   │  │
│                 │                                          │  │ [✓ Accept suggestion]                   │  │
│                 │                                          │  ├─────────────────────────────────────────┤  │
│                 │                                          │  │ Ask AI to rewrite...                    │  │
│                 │                                          │  │ [ Make it more poetic               ][→]│  │
│                 │                                          │  └─────────────────────────────────────────┘  │
│                 │                                          │                                               │
│                 │ [ ] 4  This is the verdict: Light has    │ ஒளியானது உலகத்திலே வந்திருந்தும் மனுஷருடைய     │
│                 │        come into the world, but people   │ கிரியைகள் பொல்லாதவைகளாயிருக்கிறபடியினால்      │
│                 │        loved darkness instead of light   │ அவர்கள் ஒளியைப்பார்க்கிலும் இருளை             │
│                 │        because their deeds were evil.    │ விரும்புகிறதே ஆக்கினைத்தீர்ப்புக்குக் காரணம். │
│                 │                                          │                                               │
└─────────────────┴──────────────────────────────────────────┴───────────────────────────────────────────────┘
```

### Toolbar
- Back button (ghost, arrowLeft) → navigate to `/projects/:projectId`
- Breadcrumb: "Project **Pilgrim's Progress** · Ch. 3 · Page {n}"
- Progress bar: "Progress: X / Y accepted" with visual bar
- Prev/next buttons
- Zoom: `−` / `100%` tag / `+`
- Action buttons: **Skip**, **Complete**, and a `[⋮]` overflow menu containing **Request changes** (opens modal — note required; `POST /pages/:id/request-changes`) and **Escalate** (opens modal — reason required; `POST /pages/:id/escalate`). The overflow menu is always visible; these actions are available to all REVIEWER+ users.

### Left Sidebar — Page Navigation
- Eyebrow: "Chapter 8 · 15 pages"
- Page pill list: `StatusDot` + `P{nn}` (mono) + active class on current; click switches page

### Middle Column — Source Document
- Renders `page.sourceMarkdown` as a structured document — headings render as headings, bullets as bullets, paragraphs as paragraphs.
- Each `{{SENTENCE_X}}` placeholder is replaced by an interactive **SentenceComponent** showing `sentence.originalText`.
- Each SentenceComponent has a numbered badge and an approval toggle (`[ ]` hollow / `[✓]` filled green).
- Read-only — no editing in this column.
- Clicking a SentenceComponent highlights it and scrolls the right column to the same sentence.

### Right Column — Target Document Editor
- Renders the same `page.sourceMarkdown` structure but each `{{SENTENCE_X}}` placeholder is replaced by an editable **SentenceComponent** showing `sentence.translatedText`.
- Structural formatting (headings, bullets, paragraphs) is identical to the source column — the translated document looks like the original, not a flat sentence list.
- **Inline Highlights:** SentenceComponents with AI-detected errors have colored underlines (red for CRITICAL/HIGH, yellow for MEDIUM/LOW).
- **Sentence Approval:** The approval toggle lives on the source column SentenceComponent; toggling it calls `PATCH /sentences/:id {isApproved}` and reflects on both columns.
  - When the user accepts an inline edit or suggestion, the sentence is automatically marked as approved.
  - Reviewers can manually toggle `[ ]` ↔ `[✓]` to bypass AI or confirm manual modifications.
- **Cursor-Style Inline Prompt (Cmd+K / Ctrl+K):**
  - Selecting any sentence or paragraph and pressing `Cmd+K` (or clicking a floating `[Prompt AI]` button) opens a sleek, capsule-shaped input pill directly over the selection (matching Cursor's inline prompt bar).
  - The input bar supports typing prompts with `@`-mentions (`@genre`, `@glossary`, `@page`) for context indexing.
  - On submit, it calls the AI Agent in **Build (Composer)** mode to rewrite the selection.
  - **Live Inline Diff:** The editor renders red/green inline diff blocks inside the document body (`<mark class="diff-bad">` red strikethrough for removals, `<mark class="diff-good">` green highlight for additions).
  - **Inline Actions Bar:** A small floating toolbar hovers below the active diff, providing `[Accept (Y)]`, `[Reject (N)]`, `[Retry]`, and an input to refine the prompt.
- **Cursor Chat Panel (Cmd+I / Right Sidebar):**
  - Toggle tabs: **Chat** (Plan mode for discussion/explanation) and **Composer** (Build mode for direct page editing).
  - Supports full context search and `@`-mentions.
  - Displays whole-page diffs that can be accepted or rejected incrementally.
- **Manual Editing:** Reviewers can click anywhere and type freely; debounced auto-saves trigger in the background.

### Reviewer Panel
The right column footer (below the last sentence) shows the list of assigned reviewers for the page as Avatar chips. MASTER+ sees an **Add reviewer** button (opens a user-picker modal → `POST /pages/:id/add-reviewer`) and a **Reassign** button (opens multi-select user picker → `POST /pages/:id/reassign`). Individual sentence rows have a small `[👤 Assign]` icon in the gutter — clicking opens a single reviewer picker → `POST /sentences/:id/assign`.

Each SentenceComponent in the right column has a context menu (⋮ or right-click) with:
- **Reset to AI translation** → `POST /sentences/:id/reset-translation` (clears manual edits; prompts for confirmation)
- **Assign to reviewer** (MASTER+) → `POST /sentences/:id/assign`

### Actions
| Element | Endpoint |
|---------|----------|
| Skip | Navigate to next page in queue (client-side) |
| Complete | POST /pages/:id/approve → GET /pages/:id/next-in-queue → navigate to returned pageId; if null → navigate to /queue with "Queue complete" toast |
| Apply suggestion | POST /errors/:id/apply |
| Inline Chat Rewrite | POST /chat/sessions/:id/stream (with BUILD mode) |
| Toggle sentence approval | PATCH /sentences/:id {isApproved} |
| Manual Edit | PATCH /sentences/:id {translatedText} (debounced) |
| Reset to AI translation | POST /sentences/:id/reset-translation |
| Request changes | POST /pages/:id/request-changes (modal, note required) |
| Escalate | POST /pages/:id/escalate |
| Add reviewer (MASTER+) | POST /pages/:id/add-reviewer |
| Reassign (MASTER+) | POST /pages/:id/reassign |
| Assign sentence (MASTER+) | POST /sentences/:id/assign |

---

## Screen 8: Genres List (`genres.jsx::GenresList`)

```
Genres
Translation contexts that drive agent behavior · 3 defined

                                         [Search genres]  [+ New genre]

┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────┐
│ [📖 colored icon]      v1.0  │ │ [⚖ colored icon]       v2.1  │ │ [🏥 colored icon]  v1.3  │
│                              │ │                              │ │                          │
│ Literary Translation         │ │ Legal Documents              │ │ Medical Reports          │
│ General literary prose       │ │ Formal legal register        │ │ Clinical terminology     │
│ fiction and non-fiction…     │ │ and contract language…       │ │ and patient records…     │
│ ─────────────────────────    │ │ ─────────────────────────    │ │ ─────────────────────    │
│ Segment · Paragraph  12 proj │ │ Segment · Sentence   3 proj  │ │ Segment · Page    2 proj │
│ Updated 2d ago      by Admin │ │ Updated 1w ago      by Selvi │ │ Updated 3w ago  by Daniel│
└──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────┘
```

3-column grid (`grid--3`). Each card:
- Top row: icon in colored circle (`{color}22` bg) + version pill
- Name (bold 15px) + description (dim 12px, min-height 36px for alignment)
- Divider
- "Segment · **{unit}**" (dim) + "{n} projects" (dim)
- "Updated {date}" + "by {firstName}" (both dim 11px)
- Card click → navigate to /genres/:id (genre editor)

---

## Screen 9: Genre Editor (`genres.jsx::GenreEditor`)

Full-layout screen (`.genre-editor`, not `page`). No top nav — its own header.

```
← Back  /  Genres  /  [Literary Translation (editable input)        ]
                        [Paragraph ▼]  [v1.0 ▼]  [History]  [Test]  [Save]

[Split] [Edit] [Preview]             382 lines · 14,201 chars

┌──────────────────────────────────────────────────────┬───────────────────────────────────┐
│  B  I  │ H1 H2 H3 │ List Table Quote Code  [📋 Copy]│ ✦ Genre assistant             [⋮] │
│                                                       │ ┌────────────────────────────────┐│
│  # Translation Guidelines                             │ │ [📝 Plan   Discuss]             ││
│  Use formal literary register throughout.             │ │ [⚡ Build  Edit doc]            ││
│  Preserve the author's narrative voice…               │ └────────────────────────────────┘│
│                                                       │                                   │
│  ## Core Terminology                                  │ 👤 You                            │
│  | protagonist | கதாநாயகன்   |                       │ "What terminology gaps exist?"    │
│  | narrator    | கதைசொல்லி    |                       │                                   │
│  | metaphor    | உருவகம்      |                       │ ✦ Assistant          [📝 plan]    │
│  | irony       | முரண்        |                       │ Here's what I'd propose:          │
│                                                       │ 1. Add a new section under        │
│  (Preview pane shown in Split mode on right half)     │    **Core Terminology**            │
│                                                       │ 2. Cross-reference glossary #042   │
│                                                       │ 3. Update **Common Pitfalls**      │
│                                                       │                                   │
│                                                       │ Switch to **Build** mode to apply. │
│                                                       │ ─────────────────────────────────  │
│                                                       │ [Suggest improvements]             │
│                                                       │ [Review terminology coverage]      │
│                                                       │ [Find inconsistencies]             │
│                                                       │ [Compare with v1.1]               │
│                                                       │ ─────────────────────────────────  │
│                                                       │ 📝 Plan mode — discuss before edit │
│                                                       │ [Ask about structure, gaps…  ][→]  │
│                                                       │                       ⌘↵ to send   │
└──────────────────────────────────────────────────────┴───────────────────────────────────┘
```

### Header
- Back button + breadcrumb (Genres / {name})
- Editable name input (`.genre-editor__title` — inline, not a bordered input)
- Segment unit select: Verse / Paragraph / Sentence / Page — persisted to `genre.segmentUnit`; controls how sentences are grouped for display in the workbench (verse-by-verse, paragraph-by-paragraph, etc.). Change saved via `PATCH /genres/:id`.
- Version select (shows versions with "· current" suffix on active)
- History button (icon="history")
- Glossary button (icon="book") → toggles left pane between Markdown editor and Glossary table (see § Glossary Panel below)
- Test button (icon="play") → modal with sample text input + shows translation output
- Save button (primary, icon="check") → POST /genres/:id/versions

### View tabs + status bar
- Tabs: **Split** (columns icon) / **Edit** (edit icon) / **Preview** (eye icon)
- Right of tabs: "{lines} lines · {chars} chars" (dim 11px)

### Doc area
**Edit mode:** Markdown editor with toolbar (B / I / H1 / H2 / H3 / List / Table / Quote / Code / Copy) + full-width textarea (spellcheck off)
**Preview mode:** Rendered markdown (`md-preview` + `md-preview__inner`) — headings, tables, lists, blockquotes, bold/italic/code
**Split mode:** Editor left + Preview right side by side

### Cursor AI Assistant Panel (`.genre-chat`)

The sidebar panel is organized with a scrollable conversation thread on top and a powerful, floating composer box anchored at the very bottom.

**Header:** ✦ sparkles icon + "Genre Assistant" brand + ⋮ more options button

**Thread (`.genre-chat__thread`):** Scrollable. Automatically scrolls to bottom on new replies.
- User messages: right-aligned, speech bubble. Supports `@`-mentions for linking other glossary sections or pages.
- Assistant responses: left-aligned, branded badge, with icon. Shows `.chat-diff` blocks when editing code/markdown.

**Composer Mode Interaction (Write / Composer):**
- When triggered in **Write (Build)** mode, the assistant streams edits directly.
- **Visual Diffs:** Displays changes inline using red strikethroughs and green background highlight blocks.
- **Floating Accept/Reject:** The editor displays a floating panel: `[Accept All]`, `[Reject All]` or lets the user incrementally accept chunks of the generated changes (matching Cursor's inline accept bar).
- No auto-save on assistant edits: after accepting, the user must click the main **Save** button to create a new version (`POST /genres/:id/versions`).

**Quick prompts (`.genre-chat__quick`):** Hover-state quick pills appearing directly above the input box:
- "Suggest improvements", "Review terminology", "Find inconsistencies", "Add domain terms", "Generate example sentences", "Add common pitfall"

**Bottom Chat Input Box (`.genre-chat__composer`):**
- Anchored to the very bottom of the sidebar.
- **Input Textarea:** Multi-line text input (2-3 rows) with support for autocomplete on `@`-mentions (`@page`, `@glossary`, `@genre`).
- **Control Bar (inside input box, bottom row):**
  - Left-aligned: Keyboard shortcut hint (e.g. `⌘↵ Write · ⌥↵ Plan`)
  - Right-aligned: Two primary execution buttons:
    *   **`[Plan 📝]` (Chat Mode):** Send the prompt to discuss guidelines, ask questions, or retrieve context *without modifying* files.
    *   **`[Write ⚡]` (Composer Mode):** Send the prompt to directly edit the guidelines or terms with live inline diffs.

### Version History Drawer (`.drawer`)

Triggered by History button. Slides in from right. Backdrop click closes.

```
Version history
Literary Translation                                [×]

  v1.2  [Current ●]                       today
  "Added 10 narrative register terms"
  by Ravi

  v1.1                                    3d ago
  "Tightened tone consistency section"
  by Selvi

  v1.0                                    1w ago
  "Initial genre version"
  by Admin

[Close]                         [Restore v1.1]
```

- Each row: version tag (mono) + Current pill (if active) + date (right) | note | "by author" (dim 11px)
- Clicking a row selects it (highlighted background)
- Each row has a `[↔ Diff]` button (icon-only, ghost) — clicking it switches the main editor pane to Diff mode (see § Diff Mode below) comparing the selected version against the current version
- Footer: Close + "Restore {selected}" (primary)
- Restore → POST /genres/:id/restore/:versionId

---

### Diff Mode (`.genre-editor--diff`)

Triggered by the `[↔ Diff]` button in the Version History Drawer. The main editor pane switches from the Markdown editor to an inline diff view. The Version History Drawer stays open.

```
← Back  /  Genres  /  [Literary Translation]
                        [Paragraph ▼]  [v1.0 ▼]  [History]  [Glossary]  [Test]  [Save]

[Split] [Edit] [Preview] [↔ Diff ← v1.1]        Showing changes v1.1 → v1.2

┌──────────────────────────────────────────────────────┬───────────────────────┐
│  Showing changes from v1.1 → v1.2 (current)  [Close] │ ✦ Genre assistant     │
│                                                       │                       │
│  # Translation Guidelines                             │  ...                  │
│  Use formal literary register throughout.             │                       │
│                                                       │                       │
│  ~~## Core Terminology~~                              │                       │
│  ## Core Terminology (expanded)                       │                       │
│  | protagonist | கதாநாயகன்   |                       │                       │
│  | narrator    | கதைசொல்லி    |                       │                       │
│+ | metaphor    | உருவகம்      |  (green — added)      │                       │
│+ | irony       | முரண்        |  (green — added)      │                       │
│- | archetype   | முன்னோடி     |  (red — removed)      │                       │
└──────────────────────────────────────────────────────┴───────────────────────┘
```

- Added lines: green left-border + green background highlight (`diff-add`)
- Removed lines: red left-border + red background highlight + strikethrough text (`diff-del`)
- Unchanged lines: normal styling
- The `[↔ Diff ← v1.1]` tab appears in the view mode bar alongside Split/Edit/Preview; clicking it or clicking `[Close]` banner returns to the previous edit mode
- Data source: `GET /genres/:id/versions/:versionId/diff` → unified diff string; rendered client-side as line-level colored blocks

---

### Glossary Panel (`.genre-editor__glossary`)

Triggered by the Glossary button in the header. Replaces the Markdown editor in the left pane; the chat assistant panel remains on the right.

```
[+ Add term]       [Search terms________________________]      57 terms

┌─────────────────┬──────────────────────────────────┬──────────────────────┬──────────┐
│ Source term     │ Target term                       │ Context              │          │
├─────────────────┼──────────────────────────────────┼──────────────────────┼──────────┤
│ God             │ தேவன்                            │ theological — never  │ [✎] [🗑] │
│                 │                                   │ கடவுள்              │          │
│ Lord            │ கர்த்தர்                          │ Protestant term      │ [✎] [🗑] │
│ Faith           │ விசுவாசம்                        │ never நம்பிக்கை    │ [✎] [🗑] │
└─────────────────┴──────────────────────────────────┴──────────────────────┴──────────┘
```

- MASTER+ sees `[+ Add term]` and `[✎]` / `[🗑]` action icons; REVIEWER sees the table read-only
- ADMIN additionally sees `[↑ Import CSV]` button — opens a file-picker accepting `.csv` with columns `sourceTerm,targetTerm,context`; on confirm calls `POST /glossary/bulk`
- **Add term**: opens an inline form row at the top of the table — Source term, Target term, Context (optional) fields + `[Save]` / `[Cancel]`
- **Edit**: inline row editing — same fields, `[Save]` / `[Cancel]`
- **Delete**: confirmation toast before deleting
- Search: live client-side filter on sourceTerm
- Pagination: "Load more" button when > 50 terms (matches global pagination spec)
- Endpoints: `GET /glossary?genreId=`, `POST /glossary`, `PUT /glossary/:id`, `DELETE /glossary/:id`, `POST /glossary/bulk` (ADMIN, via CSV import)
- Clicking the Glossary button again (or Edit/Split/Preview tabs) returns to the Markdown editor

---

## Screen 10: Admin (`admin.jsx::Admin`)

```
Admin · all pages
Master view across every project · override and resolve escalations

┌──────────────────────────────────────────────────────────────────────────────┐
│ [All projects ▼]  [All chapters ▼]  [All statuses ▼]  [All reviewers ▼]     │
│ [Apply filters]    [Export report ↓]    [Reassign selected]  [Batch approve] │
└──────────────────────────────────────────────────────────────────────────────┘

┌──┬──────────────────┬───┬──────┬──────────────────────┬──────────┬────────┬──────────────────┐
│☐ │ Project          │Ch.│ Page │ Reviewers            │ Status   │Quality │ Actions          │
├──┼──────────────────┼───┼──────┼──────────────────────┼──────────┼────────┼──────────────────┤
│☑ │ Pilgrim's Progr. │ 3 │ P45  │ 👤 Selvi 👤 Daniel   │ Pending  │   78%  │ [View] [Override]│
│☑ │ Pilgrim's Progr. │ 3 │ P46  │ 👤 Daniel            │ Changes  │   65%  │ [View] [Override]│
│  │ Imitation Christ │ 1 │ P12  │ 👤 Mary              │ Approved │   92%  │ [View]           │
│  │ Mere Christianity│ 8 │ P78  │ 👤 Selvi             │ Escalated│   45%  │ [View] [Resolve] │
│  │ Confessions      │ 2 │ P23  │ 👤 Daniel            │ Pending  │   71%  │ [View] [Override]│
└──┴──────────────────┴───┴──────┴──────────────────────┴──────────┴────────┴──────────────────┘
```

- Filters card above table (not inline)
- Checkbox column; row highlight when checked (`is-selected` class)
- Reviewers: all assigned reviewer avatars inline (from `PageReviewer` list); if more than 3, show `+N` overflow
- Quality: colored mono value (<60 error, <80 warning, ≥80 success)
- Actions: always "View" (ghost) + "Override" (default) unless status = Escalated → "Resolve" (primary)
- Bulk actions: "Reassign selected" + "Batch approve" (success) — in filter card, right-aligned
- Export report → POST /export/admin-report → jobId → download (MASTER+; generates aggregate quality report across selected projects)

---

## Screen 11: Team (`admin.jsx::Team`)

```
Team
4 members · 1 master · 3 reviewers
                                               [+ Add member]

┌──────────────────────────────────────────────────────────────────────┐
│ Name           │ Email          │ Role     │Assigned│ Status │        │
├────────────────┼────────────────┼──────────┼────────┼────────┼────────┤
│ 👤 Ravi Kumar  │ ravi@tai.ws    │ [Master] │  All   │ Active●│ [✎][⋮]│
│ 👤 Selvi Arjun │ selvi@tai.ws   │ [Review] │   12   │ Active●│ [✎][⋮]│
│ 👤 Daniel Anbu │ daniel@tai.ws  │ [Review] │    8   │ Active●│ [✎][⋮]│
│ 👤 Mary Rose   │ mary@tai.ws    │ [Review] │    5   │Inactive│ [✎][⋮]│
└──────────────────────────────────────────────────────────────────────┘
```

- Role pill: Master = `pill--accent`, Reviewer = `pill--info`
- Status pill: Active = success dot, Inactive = default
- Actions: edit icon button + more icon button (⋮)

### Add member modal
```
Add reviewer                                              [×]

Name [Jane Doe_____________]  Email [jane@org.com_________]

Role
(●) Reviewer   ( ) Master reviewer

[Cancel]                           [Send invite]
```

Send invite → POST /users/invite (sends email)

> **Design decision**: The invite modal exposes only `REVIEWER` and `MASTER` roles. `ADMIN` accounts are provisioned exclusively via the seed script or direct database access — they cannot be invited through the UI. This prevents accidental privilege escalation.

---

## Screen 12: Settings (`admin.jsx::Settings`)

```
Settings
Model configuration, languages, and system defaults

[Models] [Languages] [System]

┌────────────────────────────────────────────────────────────────────────────┐
│ TRANSLATION agent                                           Online ●        │
│ qwen2.5:7b  [default]                                                       │
│ Provider [Ollama ▼]   Model [qwen2.5:7b ▼]   Endpoint [http://ollama:11434]│
│ [⚡ Test connection]  [⌨ View logs]                               [Save]   │
└────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────┐
│ REVIEW agent                                                Online ●         │
│ phi4:mini  [fast]                                                            │
│ Provider [Ollama ▼]   Model [phi4:mini ▼]     Endpoint [http://ollama:11434]│
│ [⚡ Test connection]  [⌨ View logs]                               [Save]   │
└────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────┐
│ CHAT agent                                                  Online ●         │
│ claude-3-haiku  [fast, affordable]                                           │
│ Provider [Anthropic ▼] Model [claude-3-haiku ▼]  Endpoint [—]              │
│ [⚡ Test connection]  [⌨ View logs]                               [Save]   │
└────────────────────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────────────────────┐
│ EMBEDDING agent                                             Online ●         │
│ nomic-embed-text  [Translation Memory indexing]                              │
│ Provider [Ollama ▼]   Model [nomic-embed-text ▼]  Endpoint [http://ollama:11434]│
│ [⚡ Test connection]  [⌨ View logs]                               [Save]   │
└────────────────────────────────────────────────────────────────────────────┘
```

- EMBEDDING agent only supports Ollama (Anthropic has no embedding API). Changing provider to ANTHROPIC shows an inline warning: "Anthropic does not support embeddings. Only Ollama is supported."

Non-Models tabs (Languages, System) show an empty-state placeholder: settings icon (32px) + "{tab} settings — coming soon".

---

## Cross-Cutting Behaviors

| Behavior | Spec |
|----------|------|
| Browser tab title | `{Page Name} \| tAI` |
| Toast | Success and error on all async actions |
| Loading skeletons | All data-fetch states |
| Empty states | No projects, no queue items, no genres, no errors |
| 403 / unauthorized | Error page or redirect to /login |
| Session expiry | Redirect to /login with "Session expired" toast |
| Job polling | Frontend polls /jobs/:id every 2s while status is QUEUED or RUNNING |
| Theme toggle | Light/dark persisted to localStorage; defaults to system preference |
| Correlation ID | X-Correlation-Id on every request; shown in error details |
| Responsive | Min 1024px (tablet landscape). Below 1024px: show "Use a larger screen" message |
| Pagination | All lists use "Load more" button (not traditional pagination). Default limits: projects=20, queue=25, admin pages=50, glossary=50. Button hidden when all items loaded. |
| Project auto-pipeline | After PDF upload, the full pipeline runs automatically: extraction → translation → review → human queue. No user action needed between steps. |
