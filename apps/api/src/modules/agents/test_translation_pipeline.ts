import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app/app.module';
import { PrismaService } from '../prisma/prisma.service';
import { MinIOService } from '../files/minio.service';
import * as fs from 'fs';
import { JobType, JobStatus, PageStatus, ProjectStatus } from '@prisma/client';

async function run() {
  console.log('--- Starting Westminster Catechism Translation Test Runner ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const minio = app.get(MinIOService);

  // 1. Find and Clean up old "Westminster Shorter Catechism" projects
  const oldProjects = await prisma.project.findMany({
    where: {
      name: {
        contains: 'Westminster Shorter Catechism',
      },
    },
  });

  console.log(`Found ${oldProjects.length} old projects to clean up...`);
  for (const p of oldProjects) {
    console.log(`Deleting project ${p.id} (${p.name})...`);
    await prisma.project.delete({ where: { id: p.id } });
  }

  // 2. Fetch required StyleGuide ID and Admin User ID
  const genre = await prisma.styleGuide.findFirst({
    where: { name: 'Tamil Bible (Parisutha Vedagamam)' },
  });
  if (!genre) {
    throw new Error('Tamil Bible (Parisutha Vedagamam) genre not found. Please seed first.');
  }

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@tai.local' },
  });
  if (!admin) {
    throw new Error('Admin user admin@tai.local not found. Please seed first.');
  }

  // 3. Create fresh Project
  console.log('Creating fresh Project...');
  const project = await prisma.project.create({
    data: {
      name: 'Westminster Shorter Catechism',
      description: 'High-fidelity visual/textual Tamil translation test of the Westminster Shorter Catechism',
      sourceLang: 'en',
      targetLang: 'ta',
      styleGuideId: genre.id,
      ownerId: admin.id,
      status: ProjectStatus.DRAFT,
    },
  });
  console.log(`Created Project ID: ${project.id}`);

  // 4. Upload correct page-segmented .txt file to MinIO
  const filePath = '/home/arul-rozario/Projects/tAI/Westminster_Shorter_Catechism_Pages_1_5.txt';
  if (!fs.existsSync(filePath)) {
    throw new Error(`Text file not found: ${filePath}`);
  }

  const fileContentBuffer = fs.readFileSync(filePath);
  const minioKey = `projects/${project.id}/source.txt`;
  console.log(`Uploading source text to MinIO with key: ${minioKey}...`);
  await minio.uploadBuffer(fileContentBuffer, minioKey, 'text/plain');

  // 5. Link MinIO file to project
  await prisma.project.update({
    where: { id: project.id },
    data: { sourceFileId: minioKey },
  });
  console.log('Linked source file to project.');

  // 6. Create PROCESS_DOCUMENT job
  console.log('Creating SPLIT_DOCUMENT background job...');
  const job = await prisma.job.create({
    data: {
      type: JobType.SPLIT_DOCUMENT,
      status: JobStatus.QUEUED,
      projectId: project.id,
      payload: {
        projectId: project.id,
        sourceFileId: minioKey,
      },
    },
  });
  console.log(`Created SPLIT_DOCUMENT Job ID: ${job.id}`);

  // 7. Monitor active jobs and translation progress
  console.log('Monitoring background translation jobs...');
  let finished = false;
  const startTime = Date.now();

  while (!finished) {
    // Check if 5 minutes have elapsed to prevent infinite loop
    if (Date.now() - startTime > 300000) {
      console.error('Timed out waiting for translation to finish.');
      break;
    }

    // Query project with its pages and jobs
    const currentProj = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' },
        },
        jobs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!currentProj) {
      console.error('Project deleted during execution!');
      break;
    }

    const pages = currentProj.pages;
    const jobs = currentProj.jobs;

    console.log(`\n--- Status Update (${new Date().toLocaleTimeString()}) ---`);
    console.log(`Project Status: ${currentProj.status}`);
    console.log(`Pages Total: ${pages.length}`);
    
    const pageStatusCounts = pages.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Pages by Status:', pageStatusCounts);

    const activeJobs = jobs.filter(j => j.status === JobStatus.QUEUED || j.status === JobStatus.RUNNING);
    console.log(`Active Jobs Count: ${activeJobs.length}`);
    for (const j of activeJobs) {
      console.log(`  - Job ${j.id}: ${j.type} (${j.status}) [Progress: ${j.progress}%]`);
    }

    const failedJobs = jobs.filter(j => j.status === JobStatus.FAILED);
    if (failedJobs.length > 0) {
      console.log('Failed Jobs List:');
      for (const j of failedJobs) {
        console.error(`  - Job ${j.id}: ${j.type} failed with error: ${j.errorMessage}`);
      }
    }

    // Check if the translation is complete
    // Translation is complete when all pages have transition beyond PENDING/EXTRACTING/EXTRACTED/TRANSLATING
    const hasPendingOrInFlightPages = pages.some(p => 
      p.status === PageStatus.PENDING || 
      p.status === PageStatus.RENDERING || 
      p.status === PageStatus.READY || 
      p.status === PageStatus.TRANSLATING
    );

    // If we have pages and none are in flight or pending, and no jobs are active, we are done!
    if (pages.length > 0 && !hasPendingOrInFlightPages && activeJobs.length === 0) {
      console.log('All pages translated successfully!');
      finished = true;
      break;
    }

    // Wait 5 seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // 8. Fetch and print final translations
  const finalProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      pages: {
        orderBy: { pageNumber: 'asc' },
      },
    },
  });

  if (finalProject) {
    console.log('\n=========================================');
    console.log('FINAL TRANSLATED CONTENT OF CATECHISM');
    console.log('=========================================');
    let markdownOutput = `# Westminster Shorter Catechism Translation Results\n\n`;
    
    for (const page of finalProject.pages) {
      console.log(`\n--- PAGE ${page.pageNumber} ---`);
      console.log(`Original English:\n${page.originalHtml}\n`);
      console.log(`Translated Tamil:\n${page.translatedHtml}\n`);
      
      markdownOutput += `## Page ${page.pageNumber}\n\n`;
      markdownOutput += `### Original English\n\`\`\`html\n${page.originalHtml}\n\`\`\`\n\n`;
      markdownOutput += `### Translated Tamil\n\`\`\`html\n${page.translatedHtml}\n\`\`\`\n\n`;
      markdownOutput += `---\n\n`;
    }

    // Save final translation output to an artifact!
    const outputPath = '/home/arul-rozario/Projects/tAI/apps/api/src/assets/catechism_translation_results.md';
    fs.writeFileSync(outputPath, markdownOutput);
    console.log(`Saved translation output markdown file to: ${outputPath}`);
  }

  await app.close();
  console.log('--- Westminster Shorter Catechism Translation Test Finished ---');
}

run().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
