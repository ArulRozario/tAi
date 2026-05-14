import { PrismaClient, Role, SegmentUnit } from '@prisma/client';
import { hashPassword } from '../../../api/src/modules/auth/password.util';

export interface SeedData {
  admin: { id: string; email: string };
  master: { id: string; email: string };
  reviewer: { id: string; email: string };
  genre: { id: string };
  styleGuideVersion: { id: string };
  project: { id: string };
}

export function getPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export async function seedTestData(databaseUrl: string): Promise<SeedData> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  console.log('🌱 Seeding test data...');

  try {
    await prisma.refreshToken.deleteMany();
  } catch (e) {}
  try {
    await prisma.error.deleteMany();
  } catch (e) {}
  try {
    await prisma.pageReviewer.deleteMany();
  } catch (e) {}
  try {
    await prisma.page.deleteMany();
  } catch (e) {}
  try {
    await prisma.chapter.deleteMany();
  } catch (e) {}
  try {
    await prisma.job.deleteMany();
  } catch (e) {}
  try {
    await prisma.project.deleteMany();
  } catch (e) {}
  try {
    await prisma.glossaryTerm.deleteMany();
  } catch (e) {}
  try {
    await prisma.styleGuideVersion.deleteMany();
  } catch (e) {}
  try {
    await prisma.styleGuide.deleteMany();
  } catch (e) {}
  try {
    await prisma.activityLog.deleteMany();
  } catch (e) {}
  try {
    await prisma.modelConfig.deleteMany();
  } catch (e) {}
  try {
    await prisma.user.deleteMany();
  } catch (e) {}
  
  const passwordHash = hashPassword('test123');
  
  const admin = await prisma.user.create({

    data: {
      email: 'admin@tai.local',
      name: 'Admin User',
      role: Role.ADMIN,
      passwordHash,
      isActive: true,
    },
  });

  const master = await prisma.user.create({
    data: {
      email: 'master@tai.local',
      name: 'Master User',
      role: Role.MASTER,
      passwordHash,
      isActive: true,
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: 'reviewer@tai.local',
      name: 'Reviewer User',
      role: Role.REVIEWER,
      passwordHash,
      isActive: true,
    },
  });

  const genre = await prisma.styleGuide.create({
    data: {
      name: 'Tamil Bible Test',
      description: 'Test genre for E2E tests',
      icon: '📖',
      color: '#7c3aed',
      segmentUnit: SegmentUnit.VERSE,
    },
  });

  const styleGuideVersion = await prisma.styleGuideVersion.create({
    data: {
      styleGuideId: genre.id,
      version: '1.0.0',
      content: 'Historic classical formal register rules for theological translation.',
      createdById: admin.id,
    },
  });

  await prisma.styleGuide.update({
    where: { id: genre.id },
    data: { currentVersionId: styleGuideVersion.id },
  });

  await prisma.glossaryTerm.createMany({
    data: [
      { styleGuideId: genre.id, sourceTerm: 'God', targetTerm: 'தேவன்', context: 'General - Supreme deity' },
      { styleGuideId: genre.id, sourceTerm: 'Jesus', targetTerm: 'இயேசு', context: 'Name - Jesus Christ' },
      { styleGuideId: genre.id, sourceTerm: 'Love', targetTerm: 'அன்பு', context: 'General - Divine love' },
      { styleGuideId: genre.id, sourceTerm: 'Faith', targetTerm: 'நம்பிக்கை', context: 'Theological - Trust in God' },
      { styleGuideId: genre.id, sourceTerm: 'Grace', targetTerm: 'கடுள்ளு', context: 'Theological - Divine grace' },
    ],
  });

  await prisma.modelConfig.createMany({
    data: [
      { agentType: 'TRANSLATION', provider: 'OLLAMA', modelName: 'qwen2.5:7b', isActive: true, isDefault: true },
      { agentType: 'REVIEW', provider: 'OLLAMA', modelName: 'phi4:mini', isActive: true, isDefault: true },
      { agentType: 'CHAT', provider: 'OLLAMA', modelName: 'qwen2.5:7b', isActive: true, isDefault: true },
      { agentType: 'EMBEDDING', provider: 'OLLAMA', modelName: 'nomic-embed-text', isActive: true, isDefault: true },
    ],
  });

  const project = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'Project for E2E tests',
      styleGuideId: genre.id,
      ownerId: admin.id,
      sourceLang: 'en',
      targetLang: 'ta',
    },
  });

  console.log('✅ Test data seeded successfully');
  await prisma.$disconnect();

  return {
    admin: { id: admin.id, email: admin.email },
    master: { id: master.id, email: master.email },
    reviewer: { id: reviewer.id, email: reviewer.email },
    genre: { id: genre.id },
    styleGuideVersion: { id: styleGuideVersion.id },
    project: { id: project.id },
  };
}

export async function cleanupTestData(): Promise<void> {
  // No longer needed as prisma is local to seedTestData
}
