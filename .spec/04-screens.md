# tAI — Screen Specifications

> **Authority:** These specs are derived directly from the Claude designs in `Claude designs/TranslationAI/screens/`. When any other document conflicts with this file, this file wins.

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
│     PDF, text-based · up to 200MB                      │
└────────────────────────────────────────────────────────┘

[Cancel]                              [Create project]
```

- Source and target language selects are fully functional; present a searchable dropdown of common languages (ISO 639-1 names)
- Genre: radio card list — icon in colored circle, name bold, description dim ellipsis, version pill
- Dropzone: drag-over state adds `is-active` class
- Create project → POST /projects then auto-trigger EXTRACT_PDF job → navigate to /projects/:id

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
- Export button: split button — default label "Export PDF"; dropdown reveals "Export as Text" and "Export as HTML"; all scopes default to approved-only; clicking any option opens a small confirm dialog: "Export N approved pages as {format}? [Cancel] [Export]" → POST /export/project/:id
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

## Screen 6: Workbench (`workbench.jsx`)

Full-page layout. Three columns: **15%** left sidebar (Page Navigation) | **35%** middle column (Source Document) | **50%** main editor (Target Document).

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
- Action buttons: Skip, Complete

### Left Sidebar — Page Navigation
- Eyebrow: "Chapter 8 · 15 pages"
- Page pill list: `StatusDot` + `P{nn}` (mono) + active class on current; click switches page

### Middle Column — Source Document
- Displays the original text, broken visually into numbered sentences.
- Read-only.
- Clicking a source sentence highlights it and scrolls the right column to the corresponding translated sentence.

### Right Column — Target Document Editor
- Displays the translated text continuously, looking like a standard document editor (e.g., Google Docs).
- **Inline Highlights:** Sentences with AI-detected errors or suggestions have colored underlines (e.g., red for critical/high severity, yellow for style/low severity).
- **Sentence Approval:** Next to each sentence in the source document, there is an approval toggle. Unapproved sentences show a hollow box `[ ]`, and approved sentences show a filled green checkmark `[✓]`.
  - When the user clicks `[✓ Accept suggestion]` or performs an inline chat rewrite, the sentence is automatically marked as approved.
  - The reviewer can also manually click the toggle `[ ]` -> `[✓]` to mark a sentence as approved after manually editing it or deciding it requires no changes.
- **Inline Chat Popover:** Clicking on any sentence opens a floating popover directly below it.
  - **Suggestion List:** If the AI has found errors, they are listed here with a `[✓ Accept suggestion]` button.
  - **Inline Chat:** An input box allows the reviewer to type a prompt (e.g., "Make it more poetic", "Use the word 'abogado'"). Sending this calls the Chat Agent in BUILD mode to rewrite the specific sentence.
- **Inline Diff:** When a sentence is replaced (either by accepting a suggestion or via a chat rewrite), the editor displays the change inline using standard diff colors (`<mark class="diff-bad">` with strikethrough for removed words, `<mark class="diff-good">` for added words).
- **Manual Editing:** The reviewer can click into the text and type freely to make manual adjustments at any time.

### Actions
| Element | Endpoint |
|---------|----------|
| Skip | Navigate to next page in queue (client-side) |
| Complete | POST /pages/:id/approve → GET /pages/:id/next-in-queue → navigate to returned pageId; if null → navigate to /queue with "Queue complete" toast |
| Apply suggestion | POST /errors/:id/apply |
| Inline Chat Rewrite | POST /chat/sessions/:id/stream (with BUILD mode) |
| Toggle sentence approval | PATCH /sentences/:id {isApproved} |
| Manual Edit | PATCH /sentences/:id {translatedText} (debounced) |
| Request changes | POST /pages/:id/request-changes (modal, note required) |
| Escalate | POST /pages/:id/escalate |

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
│  | protagonist | protagonista |                       │ "What terminology gaps exist?"    │
│  | narrator    | narrador/a   |                       │                                   │
│  | metaphor    | metáfora     |                       │ ✦ Assistant          [📝 plan]    │
│  | irony       | ironía       |                       │ Here's what I'd propose:          │
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
- Segment unit select: Verse / Paragraph / Sentence / Page
- Version select (shows versions with "· current" suffix on active)
- History button (icon="history")
- Test button (icon="play") → modal with sample text input + shows translation output
- Save button (primary, icon="check") → POST /genres/:id/versions

### View tabs + status bar
- Tabs: **Split** (columns icon) / **Edit** (edit icon) / **Preview** (eye icon)
- Right of tabs: "{lines} lines · {chars} chars" (dim 11px)

### Doc area
**Edit mode:** Markdown editor with toolbar (B / I / H1 / H2 / H3 / List / Table / Quote / Code / Copy) + full-width textarea (spellcheck off)
**Preview mode:** Rendered markdown (`md-preview` + `md-preview__inner`) — headings, tables, lists, blockquotes, bold/italic/code
**Split mode:** Editor left + Preview right side by side

### Chat panel (`.genre-chat`)

**Header:** ✦ sparkles icon + "Genre assistant" brand + ⋮ more button

**Mode pills:** Two buttons with icon + label + hint text:
- 📝 Plan — "Discuss"
- ⚡ Build — "Edit doc"

**Thread (`.genre-chat__thread`):** Scrollable. Messages:
- User: right-aligned, no avatar header
- Assistant: left-aligned, shows "Assistant" label + mode badge (plan/build) with icon

Build-mode assistant messages include a `.chat-diff` block showing what changed. When the stream ends with `{revisedContent}`, the editor content is automatically replaced with `revisedContent` — the user sees the result immediately in the editor. They review it, then click **Save** to create a new version (no auto-save). If they discard, they can restore from version history.

**Quick prompts (`.genre-chat__quick`):** 4 buttons that populate composer. Change by mode:
- Plan: "Suggest improvements", "Review terminology coverage", "Find inconsistencies", "Compare with previous version"
- Build: "Add missing domain terms", "Tighten tone consistency", "Generate example sentences", "Add common pitfall"

**Composer:**
- Mode indicator line: icon + "Plan mode — discuss before editing" | "Build mode — edits will write to the doc"
- Textarea (2 rows) + ⌘↵ hint + Send button
- Cmd+Enter / Ctrl+Enter sends

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
- Footer: Close + "Restore {selected}" (primary)
- Restore → POST /genres/:id/restore/:versionId

---

## Screen 10: Admin (`admin.jsx::Admin`)

```
Admin · all pages
Master view across every project · override and resolve escalations

┌──────────────────────────────────────────────────────────────────────────────┐
│ [All projects ▼]  [All chapters ▼]  [All statuses ▼]  [All reviewers ▼]     │
│ [Apply filters]                         [Reassign selected]  [Batch approve] │
└──────────────────────────────────────────────────────────────────────────────┘

┌──┬──────────────────┬───┬──────┬──────────────┬──────────┬────────┬──────────────────┐
│☐ │ Project          │Ch.│ Page │ Reviewer     │ Status   │Quality │ Actions          │
├──┼──────────────────┼───┼──────┼──────────────┼──────────┼────────┼──────────────────┤
│☑ │ Pilgrim's Progr. │ 3 │ P45  │ 👤 Selvi     │ Pending  │   78%  │ [View] [Override]│
│☑ │ Pilgrim's Progr. │ 3 │ P46  │ 👤 Daniel    │ Changes  │   65%  │ [View] [Override]│
│  │ Imitation Christ │ 1 │ P12  │ 👤 Mary      │ Approved │   92%  │ [View]           │
│  │ Mere Christianity│ 8 │ P78  │ 👤 Selvi     │ Escalated│   45%  │ [View] [Resolve] │
│  │ Confessions      │ 2 │ P23  │ 👤 Daniel    │ Pending  │   71%  │ [View] [Override]│
└──┴──────────────────┴───┴──────┴──────────────┴──────────┴────────┴──────────────────┘
```

- Filters card above table (not inline)
- Checkbox column; row highlight when checked (`is-selected` class)
- Reviewer: avatar + name inline
- Quality: colored mono value (<60 error, <80 warning, ≥80 success)
- Actions: always "View" (ghost) + "Override" (default) unless status = Escalated → "Resolve" (primary)
- Bulk actions: "Reassign selected" + "Batch approve" (success) — in filter card, right-aligned
- Export report → POST /export/admin-report → jobId → download

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
```

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
