import { PrismaClient, type Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ORG_SLUG = 'planforge-demo';
const PASSWORD = 'demo1234';

/** Demo accounts (re-created on every seed). Password for all: demo1234 */
const PEOPLE = {
  demo: { email: 'demo@planforge.dev', firstName: 'Demo', lastName: 'User' },
  maria: { email: 'maria@planforge.dev', firstName: 'Maria', lastName: 'Kowalczyk' },
  piotr: { email: 'piotr@planforge.dev', firstName: 'Piotr', lastName: 'Lewandowski' },
  anna: { email: 'anna@planforge.dev', firstName: 'Anna', lastName: 'Zielińska' },
} as const;

type PersonKey = keyof typeof PEOPLE;

interface TaskSpec {
  title: string;
  status: Prisma.TaskCreateManyInput['status'];
  priority: Prisma.TaskCreateManyInput['priority'];
  start?: string;
  end?: string;
  progress?: number;
  milestone?: boolean;
  assignee?: PersonKey;
  hours?: number;
  comments?: { author: PersonKey; content: string }[];
  children?: TaskSpec[];
}

/** Leaf task shorthand. */
function leaf(
  title: string,
  status: TaskSpec['status'],
  priority: TaskSpec['priority'],
  start: string,
  end: string,
  assignee: PersonKey,
  extra: Partial<TaskSpec> = {},
): TaskSpec {
  return { title, status, priority, start, end, assignee, ...extra };
}

async function main() {
  console.log('🌱 Seeding PlanForge demo data…');

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const userIds = {} as Record<PersonKey, string>;
  for (const [key, p] of Object.entries(PEOPLE) as [PersonKey, (typeof PEOPLE)[PersonKey]][]) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: { firstName: p.firstName, lastName: p.lastName, passwordHash },
      create: { email: p.email, firstName: p.firstName, lastName: p.lastName, passwordHash },
    });
    userIds[key] = user.id;
  }

  const existing = await prisma.organization.findUnique({ where: { slug: ORG_SLUG } });
  if (existing) await prisma.organization.delete({ where: { id: existing.id } });

  const org = await prisma.organization.create({
    data: {
      name: 'PlanForge Demo',
      slug: ORG_SLUG,
      ownerId: userIds.demo,
      members: {
        create: [
          { userId: userIds.demo, role: 'OWNER' },
          { userId: userIds.maria, role: 'ADMIN' },
          { userId: userIds.piotr, role: 'MEMBER' },
          { userId: userIds.anna, role: 'MEMBER' },
        ],
      },
    },
  });

  const product = await prisma.space.create({
    data: {
      name: 'Produkt',
      description: 'Rozwój produktu i aplikacji',
      color: '#7c5cfc',
      organizationId: org.id,
      createdById: userIds.demo,
      order: 0,
      members: {
        create: Object.values(userIds).map((userId) => ({
          userId,
          role: userId === userIds.demo ? ('OWNER' as const) : ('MEMBER' as const),
        })),
      },
    },
  });

  const marketing = await prisma.space.create({
    data: {
      name: 'Marketing',
      description: 'Kampanie i komunikacja',
      color: '#f59e0b',
      organizationId: org.id,
      createdById: userIds.demo,
      order: 1,
      members: {
        create: [
          { userId: userIds.demo, role: 'OWNER' },
          { userId: userIds.maria, role: 'MEMBER' },
        ],
      },
    },
  });

  async function seedProject(opts: {
    spaceId: string;
    name: string;
    description: string;
    status: Prisma.ProjectCreateInput['status'];
    startDate: string;
    endDate: string;
    tasks: TaskSpec[];
    dependencies?: { from: string; to: string; type?: Prisma.DependencyCreateManyInput['type'] }[];
  }) {
    const project = await prisma.project.create({
      data: {
        name: opts.name,
        description: opts.description,
        status: opts.status,
        startDate: new Date(opts.startDate),
        endDate: new Date(opts.endDate),
        spaceId: opts.spaceId,
        createdById: userIds.demo,
        members: {
          create: Object.values(userIds).map((userId) => ({
            userId,
            role: userId === userIds.demo ? ('OWNER' as const) : ('MEMBER' as const),
          })),
        },
      },
    });

    const byTitle = new Map<string, string>();

    const seedTasks = async (specs: TaskSpec[], parentId: string | null, prefix: string) => {
      for (let i = 0; i < specs.length; i++) {
        const s = specs[i]!;
        const wbs = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
        const task = await prisma.task.create({
          data: {
            title: s.title,
            status: s.status,
            priority: s.priority,
            startDate: s.start ? new Date(s.start) : null,
            endDate: s.end ? new Date(s.end) : null,
            progress: s.progress ?? (s.status === 'DONE' ? 100 : 0),
            isMilestone: s.milestone ?? false,
            estimatedHours: s.hours ?? null,
            projectId: project.id,
            parentId,
            assigneeId: s.assignee ? userIds[s.assignee] : null,
            createdById: userIds.demo,
            wbsNumber: wbs,
            order: i,
          },
        });
        byTitle.set(s.title, task.id);

        await prisma.activityLog.create({
          data: {
            userId: userIds.demo,
            action: 'CREATED',
            entityType: 'task',
            entityId: task.id,
            projectId: project.id,
          },
        });

        for (const c of s.comments ?? []) {
          await prisma.comment.create({
            data: { content: c.content, taskId: task.id, authorId: userIds[c.author] },
          });
        }

        if (s.children) await seedTasks(s.children, task.id, wbs);
      }
    };

    await seedTasks(opts.tasks, null, '');

    for (const d of opts.dependencies ?? []) {
      const predecessorId = byTitle.get(d.from);
      const successorId = byTitle.get(d.to);
      if (predecessorId && successorId) {
        await prisma.dependency.create({
          data: { predecessorId, successorId, type: d.type ?? 'FS' },
        });
      }
    }

    const count = await prisma.task.count({ where: { projectId: project.id } });
    console.log(`   • ${opts.name}: ${count} zadań`);
    return project;
  }

  // ── Project 1 — deep, multi-level WBS ──────────────────────────────────────
  await seedProject({
    spaceId: product.id,
    name: 'Nowa strona firmowa',
    description: 'Redesign i wdrożenie nowej strony korporacyjnej w modelu waterfall.',
    status: 'ACTIVE',
    startDate: '2026-05-04',
    endDate: '2026-09-30',
    tasks: [
      {
        title: 'Inicjacja',
        status: 'DONE',
        priority: 'HIGH',
        children: [
          {
            title: 'Określenie zakresu i celów',
            status: 'DONE',
            priority: 'HIGH',
            children: [
              leaf('Warsztat z interesariuszami', 'DONE', 'HIGH', '2026-05-04', '2026-05-05', 'maria', {
                comments: [{ author: 'maria', content: 'Warsztat udany, spisaliśmy cele biznesowe.' }],
              }),
              leaf('Dokument zakresu (SOW)', 'DONE', 'MEDIUM', '2026-05-06', '2026-05-08', 'maria'),
              leaf('Akceptacja budżetu', 'DONE', 'HIGH', '2026-05-08', '2026-05-08', 'demo'),
            ],
          },
          {
            title: 'Analiza interesariuszy',
            status: 'DONE',
            priority: 'MEDIUM',
            children: [
              leaf('Mapa interesariuszy', 'DONE', 'LOW', '2026-05-11', '2026-05-12', 'anna'),
              leaf('Wywiady z działami', 'DONE', 'MEDIUM', '2026-05-12', '2026-05-14', 'anna'),
            ],
          },
          {
            title: 'Karta projektu zatwierdzona',
            status: 'DONE',
            priority: 'NONE',
            start: '2026-05-15',
            end: '2026-05-15',
            milestone: true,
          },
        ],
      },
      {
        title: 'Planowanie',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        children: [
          {
            title: 'Architektura informacji',
            status: 'DONE',
            priority: 'HIGH',
            children: [
              leaf('Audyt obecnej struktury', 'DONE', 'MEDIUM', '2026-05-18', '2026-05-20', 'piotr'),
              leaf('Mapa strony (sitemap)', 'DONE', 'HIGH', '2026-05-20', '2026-05-22', 'piotr'),
              leaf('Model nawigacji', 'DONE', 'MEDIUM', '2026-05-22', '2026-05-25', 'piotr'),
            ],
          },
          {
            title: 'Projekt makiet',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            children: [
              {
                title: 'Makiety low-fidelity',
                status: 'DONE',
                priority: 'MEDIUM',
                children: [
                  leaf('Strona główna (low-fi)', 'DONE', 'MEDIUM', '2026-05-26', '2026-05-28', 'maria'),
                  leaf('Podstrony (low-fi)', 'DONE', 'LOW', '2026-05-28', '2026-06-01', 'maria'),
                ],
              },
              {
                title: 'Makiety high-fidelity',
                status: 'IN_PROGRESS',
                priority: 'HIGH',
                children: [
                  leaf('Strona główna (hi-fi)', 'DONE', 'HIGH', '2026-06-02', '2026-06-05', 'maria'),
                  leaf('Podstrony (hi-fi)', 'IN_PROGRESS', 'HIGH', '2026-06-08', '2026-06-12', 'maria', {
                    progress: 70,
                    comments: [{ author: 'demo', content: 'Pamiętaj o stanach hover i pustych widokach.' }],
                  }),
                  leaf('Widok mobilny', 'IN_PROGRESS', 'MEDIUM', '2026-06-12', '2026-06-17', 'maria', { progress: 30 }),
                ],
              },
              leaf('Prototyp klikalny', 'TODO', 'MEDIUM', '2026-06-18', '2026-06-22', 'maria'),
            ],
          },
          {
            title: 'Strategia treści',
            status: 'IN_REVIEW',
            priority: 'MEDIUM',
            children: [
              leaf('Inwentaryzacja treści', 'DONE', 'LOW', '2026-06-08', '2026-06-10', 'anna'),
              leaf('Plan SEO', 'IN_REVIEW', 'MEDIUM', '2026-06-11', '2026-06-16', 'anna', { progress: 80 }),
            ],
          },
          {
            title: 'Akceptacja designu',
            status: 'TODO',
            priority: 'URGENT',
            start: '2026-06-23',
            end: '2026-06-23',
            milestone: true,
          },
        ],
      },
      {
        title: 'Realizacja',
        status: 'TODO',
        priority: 'HIGH',
        children: [
          {
            title: 'Implementacja frontendu',
            status: 'TODO',
            priority: 'HIGH',
            children: [
              leaf('Setup projektu i CI', 'TODO', 'MEDIUM', '2026-06-24', '2026-06-26', 'piotr'),
              {
                title: 'Komponenty bazowe',
                status: 'TODO',
                priority: 'HIGH',
                children: [
                  leaf('Design system w kodzie', 'TODO', 'HIGH', '2026-06-29', '2026-07-03', 'piotr'),
                  leaf('Nawigacja i stopka', 'TODO', 'MEDIUM', '2026-07-06', '2026-07-08', 'piotr'),
                ],
              },
              leaf('Strona główna', 'TODO', 'HIGH', '2026-07-09', '2026-07-15', 'piotr'),
              leaf('Podstrony', 'TODO', 'MEDIUM', '2026-07-16', '2026-07-24', 'piotr'),
              leaf('Responsywność i RWD', 'TODO', 'MEDIUM', '2026-07-27', '2026-07-31', 'piotr'),
            ],
          },
          {
            title: 'Integracja CMS',
            status: 'TODO',
            priority: 'MEDIUM',
            children: [
              leaf('Model treści', 'TODO', 'MEDIUM', '2026-07-13', '2026-07-17', 'demo'),
              leaf('Integracja API', 'TODO', 'HIGH', '2026-07-20', '2026-07-31', 'demo'),
              leaf('Migracja treści', 'TODO', 'LOW', '2026-08-03', '2026-08-07', 'anna'),
            ],
          },
          {
            title: 'Testy i QA',
            status: 'TODO',
            priority: 'HIGH',
            children: [
              leaf('Testy funkcjonalne', 'TODO', 'HIGH', '2026-08-10', '2026-08-14', 'anna'),
              leaf('Testy wydajności', 'TODO', 'MEDIUM', '2026-08-17', '2026-08-19', 'piotr'),
              leaf('Testy dostępności (a11y)', 'TODO', 'MEDIUM', '2026-08-20', '2026-08-21', 'anna'),
              leaf('Poprawki po testach', 'TODO', 'HIGH', '2026-08-24', '2026-08-28', 'piotr'),
            ],
          },
        ],
      },
      {
        title: 'Wdrożenie produkcyjne',
        status: 'TODO',
        priority: 'URGENT',
        start: '2026-09-04',
        end: '2026-09-04',
        milestone: true,
      },
    ],
    dependencies: [
      { from: 'Dokument zakresu (SOW)', to: 'Mapa interesariuszy' },
      { from: 'Wywiady z działami', to: 'Karta projektu zatwierdzona' },
      { from: 'Mapa strony (sitemap)', to: 'Strona główna (hi-fi)' },
      { from: 'Podstrony (hi-fi)', to: 'Prototyp klikalny' },
      { from: 'Prototyp klikalny', to: 'Akceptacja designu' },
      { from: 'Akceptacja designu', to: 'Design system w kodzie' },
      { from: 'Design system w kodzie', to: 'Strona główna' },
      { from: 'Strona główna', to: 'Podstrony' },
      { from: 'Podstrony', to: 'Integracja API' },
      { from: 'Integracja API', to: 'Testy funkcjonalne' },
      { from: 'Testy funkcjonalne', to: 'Poprawki po testach' },
      { from: 'Poprawki po testach', to: 'Wdrożenie produkcyjne' },
    ],
  });

  // ── Project 2 — mobile MVP, medium depth ───────────────────────────────────
  await seedProject({
    spaceId: product.id,
    name: 'Aplikacja mobilna MVP',
    description: 'MVP aplikacji mobilnej (iOS/Android).',
    status: 'PLANNING',
    startDate: '2026-07-01',
    endDate: '2026-11-15',
    tasks: [
      {
        title: 'Discovery',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        children: [
          {
            title: 'Badania użytkowników',
            status: 'DONE',
            priority: 'MEDIUM',
            children: [
              leaf('Ankiety', 'DONE', 'LOW', '2026-07-01', '2026-07-03', 'anna'),
              leaf('Wywiady pogłębione', 'DONE', 'MEDIUM', '2026-07-06', '2026-07-09', 'anna'),
            ],
          },
          {
            title: 'Definicja MVP',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            children: [
              leaf('Lista funkcji', 'DONE', 'HIGH', '2026-07-10', '2026-07-13', 'demo'),
              leaf('Priorytetyzacja (MoSCoW)', 'IN_PROGRESS', 'HIGH', '2026-07-14', '2026-07-17', 'demo', { progress: 50 }),
            ],
          },
        ],
      },
      {
        title: 'Projektowanie',
        status: 'TODO',
        priority: 'MEDIUM',
        children: [
          {
            title: 'System designu',
            status: 'TODO',
            priority: 'MEDIUM',
            children: [
              leaf('Tokeny i kolory', 'TODO', 'LOW', '2026-07-20', '2026-07-22', 'maria'),
              leaf('Biblioteka komponentów', 'TODO', 'MEDIUM', '2026-07-23', '2026-07-31', 'maria'),
            ],
          },
          leaf('Prototyp interaktywny', 'TODO', 'LOW', '2026-08-03', '2026-08-14', 'maria'),
          { title: 'Akceptacja UX', status: 'TODO', priority: 'HIGH', start: '2026-08-17', end: '2026-08-17', milestone: true },
        ],
      },
      {
        title: 'Rozwój',
        status: 'TODO',
        priority: 'HIGH',
        children: [
          leaf('Architektura aplikacji', 'TODO', 'HIGH', '2026-08-18', '2026-08-21', 'piotr'),
          leaf('Ekrany onboardingu', 'TODO', 'MEDIUM', '2026-08-24', '2026-08-31', 'piotr'),
          leaf('Integracja backendu', 'TODO', 'HIGH', '2026-09-01', '2026-09-11', 'demo'),
        ],
      },
    ],
    dependencies: [
      { from: 'Lista funkcji', to: 'Priorytetyzacja (MoSCoW)' },
      { from: 'Priorytetyzacja (MoSCoW)', to: 'Biblioteka komponentów' },
      { from: 'Biblioteka komponentów', to: 'Prototyp interaktywny' },
      { from: 'Prototyp interaktywny', to: 'Akceptacja UX' },
      { from: 'Akceptacja UX', to: 'Architektura aplikacji' },
      { from: 'Architektura aplikacji', to: 'Integracja backendu' },
    ],
  });

  // ── Project 3 — marketing campaign ─────────────────────────────────────────
  await seedProject({
    spaceId: marketing.id,
    name: 'Kampania Q3',
    description: 'Kampania marketingowa na trzeci kwartał.',
    status: 'ACTIVE',
    startDate: '2026-06-01',
    endDate: '2026-09-30',
    tasks: [
      {
        title: 'Strategia',
        status: 'DONE',
        priority: 'HIGH',
        children: [
          leaf('Analiza rynku', 'DONE', 'MEDIUM', '2026-06-01', '2026-06-04', 'maria'),
          leaf('Grupy docelowe', 'DONE', 'MEDIUM', '2026-06-05', '2026-06-08', 'maria'),
          leaf('Budżet i kanały', 'DONE', 'HIGH', '2026-06-09', '2026-06-12', 'demo'),
        ],
      },
      {
        title: 'Produkcja materiałów',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        children: [
          {
            title: 'Kreacje graficzne',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            children: [
              leaf('Bannery display', 'DONE', 'LOW', '2026-06-15', '2026-06-18', 'anna'),
              leaf('Posty social media', 'IN_PROGRESS', 'MEDIUM', '2026-06-19', '2026-06-26', 'anna', { progress: 40 }),
            ],
          },
          leaf('Teksty reklamowe', 'IN_REVIEW', 'MEDIUM', '2026-06-22', '2026-06-30', 'maria', { progress: 75 }),
          leaf('Landing page', 'TODO', 'HIGH', '2026-07-01', '2026-07-10', 'piotr'),
        ],
      },
      { title: 'Launch kampanii', status: 'TODO', priority: 'URGENT', start: '2026-07-15', end: '2026-07-15', milestone: true },
      {
        title: 'Optymalizacja',
        status: 'TODO',
        priority: 'LOW',
        children: [
          leaf('Analiza wyników', 'TODO', 'MEDIUM', '2026-07-20', '2026-07-31', 'demo'),
          leaf('A/B testy', 'TODO', 'LOW', '2026-08-03', '2026-08-14', 'anna'),
        ],
      },
    ],
    dependencies: [
      { from: 'Budżet i kanały', to: 'Bannery display' },
      { from: 'Posty social media', to: 'Landing page' },
      { from: 'Teksty reklamowe', to: 'Landing page' },
      { from: 'Landing page', to: 'Launch kampanii' },
      { from: 'Launch kampanii', to: 'Analiza wyników' },
    ],
  });

  console.log('✅ Done. Log in with:');
  console.log(`   email:    ${PEOPLE.demo.email}`);
  console.log(`   password: ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
