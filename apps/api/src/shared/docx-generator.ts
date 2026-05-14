import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  PageBreak,
  Footer,
  PageNumber,
  convertInchesToTwip,
} from 'docx';

/* ------------------------------------------------------------------ */
/*  Font configuration – Latin vs. Complex Script (Tamil)             */
/* ------------------------------------------------------------------ */
const FONTS = {
  latin: 'Calibri',
  tamil: 'Noto Sans Tamil',
  fallback: 'Latha',
} as const;

const FONT_SIZE_PT = 11;
const FONT_SIZE_HALF_PT = FONT_SIZE_PT * 2; // docx uses half-points

/**
 * Build a font spec that tells Word to use one font for Latin characters
 * and another for Complex Script (Tamil) characters.
 */
function runFonts() {
  return {
    ascii: FONTS.latin,
    hAnsi: FONTS.latin,
    cs: FONTS.tamil,
    eastAsia: FONTS.tamil,
  };
}

/**
 * Shared run options so every piece of text gets the right fonts.
 */
function baseRun(text: string, extra?: Record<string, unknown>): TextRun {
  return new TextRun({
    text,
    font: runFonts(),
    size: FONT_SIZE_HALF_PT,
    language: { value: 'en-US', bidirectional: 'ta-IN' },
    ...extra,
  });
}

/* ------------------------------------------------------------------ */
/*  Tiny HTML → docx converter (tailored to our Gemini output)        */
/* ------------------------------------------------------------------ */

interface ParsedNode {
  tag?: string;
  text?: string;
  children: ParsedNode[];
  attrs: Record<string, string>;
}

/**
 * Parse a flat-ish HTML string into a lightweight AST.
 * We only handle the tags Gemini actually produces:
 *   h1-h6, p, span, b/strong, i/em, br, sup, sub
 */
function parseHtml(html: string): ParsedNode {
  const root: ParsedNode = { children: [], attrs: {} };
  const stack: ParsedNode[] = [root];

  // Clean up stray html/head/body tags that Gemini sometimes injects
  const cleaned = html
    .replace(/<\/?html[^>]*>/gi, '')
    .replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<\/?body[^>]*>/gi, '');

  const tagRe = /<(\/?)([a-zA-Z0-9]+)([^>]*)>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagRe.exec(cleaned)) !== null) {
    const [full, slash, tagName, attrStr] = match;
    const before = cleaned.slice(lastIndex, match.index);

    // Push text node before this tag
    if (before) {
      stack[stack.length - 1].children.push({
        text: before,
        children: [],
        attrs: {},
      });
    }

    if (slash) {
      // Closing tag – pop
      if (stack.length > 1) stack.pop();
    } else {
      // Opening tag – push new node
      const attrs: Record<string, string> = {};
      const attrRe = /([a-zA-Z-]+)="([^"]*)"/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRe.exec(attrStr)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2];
      }

      const node: ParsedNode = {
        tag: tagName.toLowerCase(),
        children: [],
        attrs,
      };
      stack[stack.length - 1].children.push(node);

      // Self-closing tags (br, hr, img, etc.)
      if (node.tag && !['br', 'hr', 'img', 'input', 'meta', 'link'].includes(node.tag)) {
        stack.push(node);
      }
    }

    lastIndex = match.index + full.length;
  }

  // Trailing text
  const trailing = cleaned.slice(lastIndex);
  if (trailing) {
    stack[stack.length - 1].children.push({
      text: trailing,
      children: [],
      attrs: {},
    });
  }

  return root;
}

/**
 * Recursively convert the lightweight AST into docx Paragraph children.
 * Returns an array of TextRuns (and the occasional PageBreak, etc.).
 */
function nodeToRuns(node: ParsedNode, inherited: { bold?: boolean; italics?: boolean } = {}): (TextRun | PageBreak)[] {
  const runs: (TextRun | PageBreak)[] = [];

  if (node.text !== undefined) {
    // Decode basic entities
    const text = node.text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (text) {
      runs.push(baseRun(text, { bold: inherited.bold, italics: inherited.italics }));
    }
    return runs;
  }

  const tag = node.tag;
  const nextInherited = { ...inherited };

  if (tag === 'b' || tag === 'strong') nextInherited.bold = true;
  if (tag === 'i' || tag === 'em') nextInherited.italics = true;

  for (const child of node.children) {
    if (child.tag === 'br') {
      runs.push(new TextRun({ break: 1 }));
      continue;
    }
    if (child.tag === 'sup') {
      // Superscript
      const inner = collectText(child);
      if (inner) {
        runs.push(baseRun(inner, { superScript: true, bold: inherited.bold, italics: inherited.italics }));
      }
      continue;
    }
    if (child.tag === 'sub') {
      // Subscript
      const inner = collectText(child);
      if (inner) {
        runs.push(baseRun(inner, { subScript: true, bold: inherited.bold, italics: inherited.italics }));
      }
      continue;
    }
    runs.push(...nodeToRuns(child, nextInherited));
  }

  return runs;
}

function collectText(node: ParsedNode): string {
  if (node.text !== undefined) return node.text;
  return node.children.map(collectText).join('');
}

/**
 * Convert a single HTML blob (one page's translatedHtml) into docx Paragraphs.
 */
function htmlToParagraphs(html: string): Paragraph[] {
  const root = parseHtml(html);
  const paragraphs: Paragraph[] = [];

  for (const child of root.children) {
    if (!child.tag) continue;

    const tag = child.tag;
    const runs = nodeToRuns(child);

    if (runs.length === 0) continue;

    if (tag.startsWith('h') && tag.length === 2 && /[1-6]/.test(tag[1])) {
      const level = parseInt(tag[1], 10);
      paragraphs.push(
        new Paragraph({
          children: runs,
          heading: HeadingLevel[`HEADING_${level}` as keyof typeof HeadingLevel],
          spacing: { after: convertInchesToTwip(0.1) },
        }),
      );
    } else if (tag === 'p' || tag === 'div') {
      paragraphs.push(
        new Paragraph({
          children: runs,
          spacing: { after: convertInchesToTwip(0.1) },
        }),
      );
    } else if (tag === 'ul' || tag === 'ol') {
      // List items
      for (const li of child.children) {
        if (li.tag !== 'li') continue;
        const liRuns = nodeToRuns(li);
        if (liRuns.length === 0) continue;
        paragraphs.push(
          new Paragraph({
            children: liRuns,
            bullet: { level: 0 },
            spacing: { after: convertInchesToTwip(0.05) },
          }),
        );
      }
    } else {
      // Fallback: wrap in a plain paragraph
      paragraphs.push(
        new Paragraph({
          children: runs,
          spacing: { after: convertInchesToTwip(0.1) },
        }),
      );
    }
  }

  return paragraphs;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

export interface DocxPage {
  pageNumber: number;
  content: string; // HTML
}

export interface DocxProject {
  name: string;
  description?: string | null;
  sourceLang: string;
  targetLang: string;
  styleGuideName?: string | null;
}

/**
 * Generate a DOCX Buffer from project metadata and translated page HTML.
 */
export async function generateDocxBuffer(
  project: DocxProject,
  pages: DocxPage[],
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // ── Title page ────────────────────────────────────────────────────
  children.push(
    new Paragraph({
      text: project.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(0.3) },
    }),
  );

  if (project.description) {
    children.push(
      new Paragraph({
        children: [baseRun(project.description)],
        alignment: AlignmentType.CENTER,
        spacing: { after: convertInchesToTwip(0.2) },
      }),
    );
  }

  const metaLine = `${project.sourceLang} → ${project.targetLang}${
    project.styleGuideName ? ' · ' + project.styleGuideName : ''
  }`;
  children.push(
    new Paragraph({
      children: [baseRun(metaLine)],
      alignment: AlignmentType.CENTER,
      spacing: { after: convertInchesToTwip(0.4) },
    }),
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── Content pages ─────────────────────────────────────────────────
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    children.push(
      new Paragraph({
        children: [
          baseRun(`Page ${page.pageNumber}`, {
            color: '666666',
            size: FONT_SIZE_HALF_PT + 2,
          }),
        ],
        spacing: { before: convertInchesToTwip(0.2), after: convertInchesToTwip(0.1) },
      }),
    );

    const pageParagraphs = htmlToParagraphs(page.content);
    children.push(...pageParagraphs);

    if (i < pages.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // ── Footer with page numbers ──────────────────────────────────────
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            children: ['Page ', PageNumber.CURRENT],
            font: runFonts(),
            size: FONT_SIZE_HALF_PT,
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1.25),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
            },
          },
        },
        children,
        footers: { default: footer },
      },
    ],
    title: project.name,
  });

  return Packer.toBuffer(doc);
}
