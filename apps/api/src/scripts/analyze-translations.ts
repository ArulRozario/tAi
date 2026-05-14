import { PrismaClient, PageStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeTranslations() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('           TRANSLATION RESULTS ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ─── 1. Overall Page Status Distribution ─────────────────────
  console.log('📊 PAGE STATUS DISTRIBUTION');
  console.log('───────────────────────────────────────────────────────────');

  const statusCounts = await prisma.page.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  const totalPages = await prisma.page.count();

  const statusOrder = [
    PageStatus.PENDING,
    PageStatus.RENDERING,
    PageStatus.READY,
    PageStatus.TRANSLATING,
    PageStatus.TRANSLATED,
    PageStatus.REVIEWING,
    PageStatus.HUMAN_REVIEW,
    PageStatus.APPROVED,
    PageStatus.REJECTED,
    PageStatus.RENDER_ERROR,
    PageStatus.TRANSLATION_ERROR,
  ];

  for (const status of statusOrder) {
    const found = statusCounts.find((s) => s.status === status);
    const count = found?._count.status || 0;
    const pct = totalPages > 0 ? ((count / totalPages) * 100).toFixed(1) : '0.0';
    const bar = '█'.repeat(Math.round(parseFloat(pct) / 2));
    console.log(`${status.padEnd(15)} ${String(count).padStart(4)}  ${pct.padStart(5)}%  ${bar}`);
  }
  console.log(`TOTAL           ${String(totalPages).padStart(4)}  100.0%\n`);

  // ─── 2. Translation Success Rate ─────────────────────────────
  console.log('✅ TRANSLATION SUCCESS METRICS');
  console.log('───────────────────────────────────────────────────────────');

  const translatedCount = await prisma.page.count({ where: { status: PageStatus.TRANSLATED } });
  const approvedCount = await prisma.page.count({ where: { status: PageStatus.APPROVED } });
  const errorCount = await prisma.page.count({ where: { status: { in: [PageStatus.RENDER_ERROR, PageStatus.TRANSLATION_ERROR] } } });
  const pendingCount = await prisma.page.count({ where: { status: PageStatus.PENDING } });
  const attemptedCount = translatedCount + approvedCount + errorCount;

  if (attemptedCount > 0) {
    const successRate = (((translatedCount + approvedCount) / attemptedCount) * 100).toFixed(1);
    const errorRate = ((errorCount / attemptedCount) * 100).toFixed(1);
    console.log(`Pages translated:        ${translatedCount}`);
    console.log(`Pages approved:          ${approvedCount}`);
    console.log(`Pages with errors:       ${errorCount}`);
    console.log(`Pages pending:           ${pendingCount}`);
    console.log(`Success rate (translated): ${successRate}%`);
    console.log(`Error rate:                ${errorRate}%\n`);
  } else {
    console.log('No translation attempts found.\n');
  }

  // ─── 3. Pages with Empty Content ─────────────────────────────
  console.log('⚠️  CONTENT QUALITY CHECKS');
  console.log('───────────────────────────────────────────────────────────');

  const emptyOriginal = await prisma.page.count({
    where: { originalHtml: null, status: { not: PageStatus.PENDING } },
  });
  const emptyTranslated = await prisma.page.count({
    where: { translatedHtml: null, status: { not: PageStatus.PENDING } },
  });
  const emptyBoth = await prisma.page.count({
    where: { originalHtml: null, translatedHtml: null },
  });

  console.log(`Pages with empty originalHtml:    ${emptyOriginal}`);
  console.log(`Pages with empty translatedHtml:  ${emptyTranslated}`);
  console.log(`Pages with both empty:            ${emptyBoth}\n`);

  // ─── 4. Error Analysis ───────────────────────────────────────
  console.log('❌ ERROR ANALYSIS');
  console.log('───────────────────────────────────────────────────────────');

  const errorPages = await prisma.page.findMany({
    where: { status: { in: [PageStatus.RENDER_ERROR, PageStatus.TRANSLATION_ERROR] } },
    select: {
      pageNumber: true,
      errorMessage: true,
      retryCount: true,
      project: { select: { name: true } },
    },
    orderBy: { retryCount: 'desc' },
  });

  if (errorPages.length === 0) {
    console.log('No pages in ERROR status. Great!\n');
  } else {
    // Group by error message pattern
    const errorPatterns: Record<string, number> = {};
    for (const page of errorPages) {
      const msg = page.errorMessage || 'Unknown error';
      // Normalize: extract first sentence or first 60 chars
      const key = msg.split('.')[0].substring(0, 60);
      errorPatterns[key] = (errorPatterns[key] || 0) + 1;
    }

    console.log(`Total error pages: ${errorPages.length}\n`);
    console.log('Error patterns:');
    for (const [pattern, count] of Object.entries(errorPatterns).sort((a, b) => b[1] - a[1])) {
      console.log(`  (${count}x) ${pattern}`);
    }

    const avgRetries = errorPages.reduce((sum, p) => sum + p.retryCount, 0) / errorPages.length;
    console.log(`\nAverage retries on error pages: ${avgRetries.toFixed(1)}`);

    // Show top 5 most retried
    console.log('\nMost retried error pages:');
    for (const page of errorPages.slice(0, 5)) {
      console.log(
        `  Page ${String(page.pageNumber).padStart(3)} | ${page.retryCount} retries | ${(page.errorMessage || '').substring(0, 50)}`,
      );
    }
    console.log();
  }

  // ─── 5. Timing Analysis ──────────────────────────────────────
  console.log('⏱️  TRANSLATION TIMING');
  console.log('───────────────────────────────────────────────────────────');

  const allTimedPages = await prisma.page.findMany({
    select: { createdAt: true, lastAiRunAt: true },
  });
  const timedPages = allTimedPages.filter((p) => p.lastAiRunAt !== null);

  if (timedPages.length === 0) {
    console.log('No timing data available.\n');
  } else {
    const durations = timedPages.map((p) => {
      const diff = new Date(p.lastAiRunAt!).getTime() - new Date(p.createdAt).getTime();
      return diff / 1000; // seconds
    });

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    console.log(`Pages with timing data: ${timedPages.length}`);
    console.log(`Avg time (created → translated): ${formatDuration(avg)}`);
    console.log(`Fastest: ${formatDuration(min)}`);
    console.log(`Slowest: ${formatDuration(max)}\n`);
  }

  // ─── 6. Per-Project Breakdown ────────────────────────────────
  console.log('📁 PER-PROJECT BREAKDOWN');
  console.log('───────────────────────────────────────────────────────────');

  const projects = await prisma.project.findMany({
    include: {
      pages: {
        select: { status: true },
      },
    },
  });

  for (const project of projects) {
    const pTotal = project.pages.length;
    const pTranslated = project.pages.filter((p) => p.status === PageStatus.TRANSLATED).length;
    const pApproved = project.pages.filter((p) => p.status === PageStatus.APPROVED).length;
    const pError = project.pages.filter((p) => p.status === PageStatus.RENDER_ERROR || p.status === PageStatus.TRANSLATION_ERROR).length;
    const pPending = project.pages.filter((p) => p.status === PageStatus.PENDING).length;

    console.log(`${project.name.substring(0, 30).padEnd(32)} total=${String(pTotal).padStart(3)}  translated=${pTranslated}  approved=${pApproved}  error=${pError}  pending=${pPending}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
}

analyzeTranslations()
  .catch((err) => {
    console.error('Analysis failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
