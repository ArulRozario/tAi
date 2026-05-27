/**
 * Local dev seed — safe to run on every `docker compose up` via the db-init container.
 * Uses upserts throughout so existing data is never overwritten.
 *
 * Set SEED_RESET=true to wipe all tables first (destructive — dev only).
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/modules/auth/password.util';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Database Seeding Started ---');

  // ── Optional destructive reset (SEED_RESET=true) ──────────────────────────
  if (process.env.SEED_RESET === 'true') {
    console.log('⚠️  SEED_RESET=true — wiping all tables...');
    await prisma.activityLog.deleteMany({});
    await prisma.modelConfig.deleteMany({});
    await prisma.glossaryTerm.deleteMany({});
    await prisma.translationMemory.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.chatSession.deleteMany({});
    await prisma.error.deleteMany({});
    await prisma.pageEdit.deleteMany({});
    await prisma.pageReviewer.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.chapter.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.styleGuideVersion.deleteMany({});
    await prisma.styleGuide.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('All tables wiped.');
  }

  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log('Seeding users...');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tai.local' },
    update: {},
    create: {
      email: 'admin@tai.local',
      passwordHash: hashPassword('admin123'),
      name: 'System Admin',
      role: 'ADMIN',
    },
  });

  const master = await prisma.user.upsert({
    where: { email: 'master@tai.local' },
    update: {},
    create: {
      email: 'master@tai.local',
      passwordHash: hashPassword('master123'),
      name: 'Master Reviewer',
      role: 'MASTER',
    },
  });

  await prisma.user.upsert({
    where: { email: 'reviewer@tai.local' },
    update: {},
    create: {
      email: 'reviewer@tai.local',
      passwordHash: hashPassword('reviewer123'),
      name: 'Tamil Bible Reviewer',
      role: 'REVIEWER',
    },
  });

  console.log('Users seeded.');

  // ── 2. Style guide ────────────────────────────────────────────────────────
  console.log('Seeding style guide...');

  const pdfTemplate = {
    pageSize: 'A5',
    columns: 2,
    columnGutter: 6,
    margins: { top: 16, bottom: 20, inner: 18, outer: 12 },
    fonts: {
      body: { family: 'Noto Serif Tamil', sizePt: 10, lineHeight: 1.4 },
      heading: { family: 'Noto Serif Tamil', sizePt: 14, weight: 'bold' },
      caption: { family: 'Noto Sans Tamil', sizePt: 8 },
      verseNumber: { sizePt: 7, position: 'superscript' }
    },
    runningHeader: { enabled: true, format: '{chapterTitle} · {pageNumber}' },
    footer: { enabled: true, format: '{pageNumber}' },
    justify: true,
    chapterDropCap: false
  };

  // StyleGuide has no unique constraint on name — use findFirst + conditional create.
  let styleGuide = await prisma.styleGuide.findFirst({
    where: { name: 'Tamil Bible (Parisutha Vedagamam)' },
  });

  if (!styleGuide) {
    styleGuide = await prisma.styleGuide.create({
      data: {
        name: 'Tamil Bible (Parisutha Vedagamam)',
        description: 'Authoritative register and style guide for translating Christian theological and scripture texts into the traditional Protestant Tamil Bible style.',
        icon: '📖',
        color: '#7c3aed',
        segmentUnit: 'VERSE',
        pdfTemplate,
        createdById: admin.id,
      },
    });
  }

  const styleGuideContent = `# Tamil Bible (Parisutha Vedagamam) Translation Style Guide
English → Tamil (Parisutha Vedagamam Protestant Tamil Bible style)

## Purpose
This genre defines the rules for translating English Protestant Christian texts into Tamil following
the Parisutha Vedagamam (பரிசுத்த வேதாகமம்) tradition — the authoritative Tamil Protestant Bible
used by Protestant churches. All translations must conform to the register, terminology, and
theological precision of the Parisutha Vedagamam text.

## Core Rules
1. Use ONLY Parisutha Vedagamam terminology as defined in the Terminology section below.
2. Maintain formal, dignified Old Tamil literary register (செந்தமிழ் நடை) throughout.
3. Preserve verse and paragraph structure exactly — do not merge or split.
4. Keep proper nouns (place names, people names) in their established Parisutha Vedagamam transliteration.
5. Preserve the original meaning without adding interpretation, commentary, or paraphrase.
6. Translate idioms and figures of speech into equivalent Tamil literary forms, not literally.
7. Reflect the grammatical weight of Hebrew/Greek source structures where the English preserves them.

## Terminology — Non-Negotiable Terms

These terms are fixed. Any deviation is a CRITICAL error.

| English | Correct Tamil | Incorrect (never use) |
|---------|--------------|----------------------|
| God | தேவன் | கடவுள், இறைவன் |
| Lord | கர்த்தர் | ஆண்டவர் (Catholic/Thiruviviliam term), இறைவர் |
| Jesus | இயேசு | ஏசு |
| Christ | கிறிஸ்து | — |
| Holy Spirit | பரிசுத்த ஆவி | தூய ஆவி (Catholic term) |
| Father (God) | பிதா | தந்தை (for God) |
| Faith | விசுவாசம் | நம்பிக்கை (when meaning theological faith) |
| Believe | விசுவாசி | நம்பு (in theological context) |
| Grace | கிருபை | அருள் (in theological context) |
| Salvation | இரட்சிப்பு | மீட்பு (Catholic/Thiruviviliam term), விடுதலை |
| Gospel | சுவிசேஷம் | நற்செய்தி (in theological context) |
| Scripture | வேதவசனம் | திருவசனம் (Catholic term) |
| Bible | பரிசுத்த வேதாகமம் | திருவிவிலியம் (Catholic Bible) |
| Word (of God) | வாக்கு | மந்திரம், சொல் |
| Church (assembly) | சபை | கூட்டம், திருச்சபை (Catholic term) |
| Church (building) | தேவாலயம் | — |
| Prayer | ஜெபம் | வேண்டுதல் (for personal prayer) |
| Righteousness | நீதி | — |
| Sin | பாவம் | தவறு (in theological context) |
| Repentance | மனந்திரும்புதல் | மனமாற்றம் |
| Covenant | உடன்படிக்கை | — |
| Resurrection | உயிர்த்தெழுதல் | — |
| Baptism | ஞானஸ்நானம் | திருமுழுக்கு (Catholic term) |
| Love (agape) | அன்பு | நேசம், நேசி |
| Peace | சமாதானம் | அமைதி (in theological context) |
| Eternal life | நித்திய ஜீவன் | — |
| Heaven | பரலோகம் | வான், சொர்க்கம் |
| Kingdom | ராஜ்யம் | வான்ராஜ்யம் (acceptable), நாடு |
| Lamb (of God) | ஆட்டுக்குட்டி | — |
| Cross | சிலுவை | — |
| Blood | இரத்தம் | குருதி (in theological context) |
| Blessing | ஆசீர்வாதம் | வாழ்த்து (in theological context) |
| Prophet | தீர்க்கதரிசி | — |
| Apostle | அப்போஸ்தலன் | — |
| Disciple | சீஷன் | — |

## Register
- All prose: formal Old Tamil literary register (செந்தமிழ் நடை)
- Dialogue (speech of characters): maintain the formality level appropriate to the speaker's role
- Narration: elevated, reverent register throughout
- Doxologies and poetry (Psalms, Revelation): heightened poetic form; preserve parallelism
- Do not use spoken/colloquial Tamil (வட்டார வழக்கு) under any circumstances

## Sentence Structure
- Mirror the syntactic weight of the English source where Tamil grammar permits
- Preserve emphatic constructions (e.g., "truly, truly I say to you" → "மெய்யாகவே மெய்யாகவே")
- Do not simplify complex subordinate clauses for readability — preserve theological precision

## Proper Nouns
Use the established Parisutha Vedagamam transliterations:
- Abraham → ஆபிரகாம், Moses → மோசே, David → தாவீது, Jerusalem → எருசலேம்
- Israel → இஸ்ரவேல், Egypt → எகிப்து, Jordan → யோர்தான்

## Common Pitfalls
- Using கடவுள் instead of தேவன் — CRITICAL error
- Using ஆண்டவர் instead of கர்த்தர் — Catholic/Thiruviviliam term, not Protestant
- Using மீட்பு instead of இரட்சிப்பு for salvation — CRITICAL error
- Using திருவசனம் instead of வேதவசனம் — Catholic term
- Using நம்பிக்கை for theological faith — use விசுவாசம்
- Using modern Tamil equivalents for any term in the Terminology table
- Adding explanatory words not present in the source text
- Softening theological statements for readability

## Examples

English: In the beginning God created the heavens and the earth.
Tamil: ஆதியிலே தேவன் வானத்தையும் பூமியையும் சிருஷ்டித்தார்.

English: For God so loved the world that he gave his one and only Son.
Tamil: தேவன், தம்முடைய ஒரேபேறான குமாரனை விசுவாசிக்கிறவன் எவனோ அவன் கெட்டுப்போகாமல் நித்தியஜீவனை அடையும்படிக்கு, அவரை அளித்தார்; ஏனெனில் அவர் உலகத்தை இவ்வளவாய் அன்புகூர்ந்தார்.

English: The righteous will live by faith.
Tamil: நீதிமான் விசுவாசத்தினால் பிழைப்பான்.

English: Grace and peace to you from God our Father and the Lord Jesus Christ.
Tamil: நம்முடைய பிதாவாகிய தேவனாலும் கர்த்தராகிய இயேசுகிறிஸ்துவினாலும் உங்களுக்கு கிருபையும் சமாதானமும் உண்டாவதாக.
`;

  // StyleGuideVersion has no unique constraint — use findFirst + conditional create.
  let styleGuideVersion = await prisma.styleGuideVersion.findFirst({
    where: { styleGuideId: styleGuide.id, version: '1.0' },
  });

  if (!styleGuideVersion) {
    styleGuideVersion = await prisma.styleGuideVersion.create({
      data: {
        styleGuideId: styleGuide.id,
        version: '1.0',
        content: styleGuideContent,
        note: 'Initial import of the Protestant Tamil Bible translation standard rules and guidelines.',
        createdById: admin.id,
      },
    });
  }

  // Wire currentVersionId only if not already set.
  if (!styleGuide.currentVersionId) {
    await prisma.styleGuide.update({
      where: { id: styleGuide.id },
      data: { currentVersionId: styleGuideVersion.id },
    });
  }

  console.log('Style guide seeded.');

  // ── 3. Glossary terms ─────────────────────────────────────────────────────
  console.log('Seeding glossary terms...');

  const glossaryTerms = [
    { sourceTerm: 'God', targetTerm: 'தேவன்', context: 'theological — never கடவுள்' },
    { sourceTerm: 'Lord', targetTerm: 'கர்த்தர்', context: 'Protestant term — never ஆண்டவர் (Catholic)' },
    { sourceTerm: 'Jesus', targetTerm: 'இயேசு', context: 'proper noun — transliterated' },
    { sourceTerm: 'Christ', targetTerm: 'கிறிஸ்து', context: 'proper noun — transliterated' },
    { sourceTerm: 'Holy Spirit', targetTerm: 'பரிசுத்த ஆவி', context: 'pneumatology — never தூய ஆவி (Catholic)' },
    { sourceTerm: 'Father', targetTerm: 'பிதா', context: 'trinitarian — divine person' },
    { sourceTerm: 'Son', targetTerm: 'குமாரன்', context: 'trinitarian — divine person' },
    { sourceTerm: 'Faith', targetTerm: 'விசுவாசம்', context: 'never நம்பிக்கை' },
    { sourceTerm: 'Believe', targetTerm: 'விசுவாசி', context: 'verb form of Faith' },
    { sourceTerm: 'Grace', targetTerm: 'கிருபை', context: 'soteriological' },
    { sourceTerm: 'Salvation', targetTerm: 'இரட்சிப்பு', context: 'Protestant primary — never மீட்பு (Catholic)' },
    { sourceTerm: 'Gospel', targetTerm: 'சுவிசேஷம்', context: 'good news' },
    { sourceTerm: 'Scripture', targetTerm: 'வேதவசனம்', context: 'Protestant term — never திருவசனம் (Catholic)' },
    { sourceTerm: 'Bible', targetTerm: 'பரிசுத்த வேதாகமம்', context: 'Protestant Bible — never திருவிவிலியம் (Catholic)' },
    { sourceTerm: 'Word (of God)', targetTerm: 'வாக்கு', context: 'never மந்திரம்' },
    { sourceTerm: 'Church (congregation)', targetTerm: 'சபை', context: 'ekklesia — gathering' },
    { sourceTerm: 'Church (building)', targetTerm: 'தேவாலயம்', context: 'place of worship' },
    { sourceTerm: 'Prayer', targetTerm: 'ஜெபம்', context: 'personal address to God' },
    { sourceTerm: 'Worship', targetTerm: 'ஆராதனை', context: 'corporate/formal worship' },
    { sourceTerm: 'Righteousness', targetTerm: 'நீதி', context: 'moral/legal standing before God' },
    { sourceTerm: 'Righteous', targetTerm: 'நீதிமான்', context: 'adjective/noun form' },
    { sourceTerm: 'Sin', targetTerm: 'பாவம்', context: 'moral transgression' },
    { sourceTerm: 'Repentance', targetTerm: 'மனந்திரும்புதல்', context: 'turning from sin' },
    { sourceTerm: 'Forgiveness', targetTerm: 'மன்னிப்பு', context: 'release from sin\'s penalty' },
    { sourceTerm: 'Eternal life', targetTerm: 'நித்திய ஜீவன்', context: 'eschatological life' },
    { sourceTerm: 'Kingdom (of God)', targetTerm: 'ராஜ்யம்', context: 'divine reign' },
    { sourceTerm: 'Covenant', targetTerm: 'உடன்படிக்கை', context: 'divine agreement' },
    { sourceTerm: 'Promise', targetTerm: 'வாக்குத்தத்தம்', context: 'divine pledge' },
    { sourceTerm: 'Blessing', targetTerm: 'ஆசீர்வாதம்', context: 'divine favour' },
    { sourceTerm: 'Peace', targetTerm: 'சமாதானம்', context: 'shalom — wholeness' },
    { sourceTerm: 'Love', targetTerm: 'அன்பு', context: 'agape — never நேசி' },
    { sourceTerm: 'Hope', targetTerm: 'நம்பிக்கை', context: 'eschatological hope (only usage where நம்பிக்கை is correct)' },
    { sourceTerm: 'Truth', targetTerm: 'சத்தியம்', context: 'divine reality' },
    { sourceTerm: 'Light', targetTerm: 'ஒளி', context: 'metaphor for God/Christ' },
    { sourceTerm: 'Darkness', targetTerm: 'இருள்', context: 'metaphor for sin/evil' },
    { sourceTerm: 'Heaven', targetTerm: 'பரலோகம்', context: 'divine dwelling' },
    { sourceTerm: 'Earth', targetTerm: 'பூமி', context: 'created world' },
    { sourceTerm: 'Angel', targetTerm: 'தூதன் / தேவதூதன்', context: 'messenger of God' },
    { sourceTerm: 'Prophet', targetTerm: 'தீர்க்கதரிசி', context: 'spokesperson for God' },
    { sourceTerm: 'Apostle', targetTerm: 'அப்போஸ்தலன்', context: 'sent one' },
    { sourceTerm: 'Disciple', targetTerm: 'சீஷன்', context: 'learner/follower' },
    { sourceTerm: 'Priest', targetTerm: 'ஆசாரியன்', context: 'levitical or Melchizedek order' },
    { sourceTerm: 'King', targetTerm: 'ராஜா', context: 'royal title' },
    { sourceTerm: 'Throne', targetTerm: 'சிங்காசனம்', context: 'seat of divine authority' },
    { sourceTerm: 'Lamb', targetTerm: 'ஆட்டுக்குட்டி', context: 'sacrificial — messianic title for Jesus' },
    { sourceTerm: 'Blood', targetTerm: 'இரத்தம்', context: 'sacrificial/covenantal' },
    { sourceTerm: 'Cross', targetTerm: 'சிலுவை', context: 'instrument of crucifixion' },
    { sourceTerm: 'Resurrection', targetTerm: 'உயிர்த்தெழுதல்', context: 'rising from death' },
    { sourceTerm: 'Baptism', targetTerm: 'ஞானஸ்நானம்', context: 'sacrament of initiation' },
  ];

  // GlossaryTerm has @@unique([styleGuideId, sourceTerm]) — upsert directly.
  for (const term of glossaryTerms) {
    await prisma.glossaryTerm.upsert({
      where: {
        styleGuideId_sourceTerm: {
          styleGuideId: styleGuide.id,
          sourceTerm: term.sourceTerm,
        },
      },
      update: {},
      create: {
        styleGuideId: styleGuide.id,
        sourceTerm: term.sourceTerm,
        targetTerm: term.targetTerm,
        context: term.context,
      },
    });
  }

  console.log(`${glossaryTerms.length} glossary terms seeded.`);

  // ── 4. Model configs ──────────────────────────────────────────────────────
  console.log('Seeding model configs...');

  // ModelConfig has @@unique([agentType, isDefault]) — upsert on that key.
  const modelConfigs = [
    { agentType: 'TRANSLATION' as const, provider: 'GOOGLE' as const, modelName: 'gemini-3.1-flash-lite', isDefault: true  },
    { agentType: 'REVIEW'      as const, provider: 'GOOGLE' as const, modelName: 'gemini-3.1-flash-lite', isDefault: true  },
    { agentType: 'CHAT'        as const, provider: 'GOOGLE' as const, modelName: 'gemini-3.1-flash-lite', isDefault: true  },
    { agentType: 'CHAT'        as const, provider: 'ANTHROPIC' as const, modelName: 'claude-sonnet-4-6',  isDefault: false },
    { agentType: 'EMBEDDING'   as const, provider: 'GOOGLE' as const, modelName: 'gemini-embedding-001',  isDefault: true  },
  ];

  for (const cfg of modelConfigs) {
    await prisma.modelConfig.upsert({
      where: {
        agentType_isDefault: {
          agentType: cfg.agentType,
          isDefault: cfg.isDefault,
        },
      },
      update: {},
      create: {
        agentType: cfg.agentType,
        provider: cfg.provider,
        modelName: cfg.modelName,
        isActive: true,
        isDefault: cfg.isDefault,
      },
    });
  }

  console.log('Model configs seeded.');
  console.log('--- Database Seeding Completed ---');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
