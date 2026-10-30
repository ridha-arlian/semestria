import type { Workspace, Task, Material, TaskPriority } from '~/types'

const seedWorkspaces: Workspace[] = [
  { id: 1, name: 'Fall 2026', slug: 'fall-2026', dates: 'Aug 24 — Dec 18, 2026', startDate: '2026-08-24', endDate: '2026-12-18', courses: 4, assignments: 12, completed: 3, progress: 42, active: true, next: 'Research proposal', nextDue: 'Oct 08' },
  { id: 2, name: 'Spring 2026', slug: 'spring-2026', dates: 'Jan 12 — May 08, 2026', startDate: '2026-01-12', endDate: '2026-05-08', courses: 5, assignments: 6, completed: 5, progress: 88, active: false, next: 'Portfolio review', nextDue: 'May 08' },
  { id: 3, name: 'Fall 2025', slug: 'fall-2025', dates: 'Aug 25 — Dec 19, 2025', startDate: '2025-08-25', endDate: '2025-12-19', courses: 4, assignments: 3, completed: 3, progress: 100, active: false, next: 'Semester complete', nextDue: '—' },
  { id: 4, name: 'Spring 2027', slug: 'spring-2027', dates: 'Jan 11 — May 07, 2027', startDate: '2027-01-11', endDate: '2027-05-07', courses: 0, assignments: 0, completed: 0, progress: 0, active: false, next: 'No tasks yet', nextDue: '—' },
  { id: 5, name: 'Summer Course 2026', slug: 'summer-course-2026', dates: 'Jun 01 — Jul 24, 2026', startDate: '2026-06-01', endDate: '2026-07-24', courses: 1, assignments: 2, completed: 1, progress: 100, active: false, next: 'Semester complete', nextDue: '—' },
  { id: 6, name: 'Self Study', slug: 'self-study', dates: 'Ongoing', courses: 1, assignments: 0, completed: 0, progress: 0, active: false, next: 'No tasks yet', nextDue: '—' },
]

const seedTasks: Task[] = [
  { id: 1, workspaceId: 1, task: 'Research proposal', course: 'Design Research', due: 'Oct 08, 2026', status: 'In progress', priority: 'High', progress: 33, description: 'Draft problem statement, method, and timeline.', submissionUrls: ['https://classroom.google.com/'], checklist: [{ id: 1, title: 'Research question drafted', done: true }, { id: 2, title: 'References collected', done: false }, { id: 3, title: 'Proposal outline ready', done: false }], note: 'Remember to connect the interview findings to the central question.' },
  { id: 2, workspaceId: 1, task: 'Midterm reflection essay', course: 'Cultural Studies', due: 'Oct 10, 2026', status: 'To do', priority: 'Medium', progress: 0 },
  { id: 3, workspaceId: 1, task: 'Prototype v2 presentation', course: 'Interaction Design', due: 'Oct 12, 2026', status: 'In progress', priority: 'High', progress: 40, description: 'Slides plus a clickable prototype demo.' },
  { id: 4, workspaceId: 1, task: 'Reading response #04', course: 'Design Research', due: 'Oct 14, 2026', status: 'To do', priority: 'Low', progress: 0 },
  { id: 5, workspaceId: 1, task: 'Group critique notes', course: 'Studio Practice', due: 'Oct 16, 2026', status: 'To do', priority: 'Medium', progress: 0 },
  { id: 6, workspaceId: 1, task: 'Final case study', course: 'Cultural Studies', due: 'Oct 02, 2026', status: 'Done', priority: 'Low', progress: 100 },
  { id: 7, workspaceId: 1, task: 'Reading response #03', course: 'Design Research', due: 'Sep 28, 2026', status: 'Done', priority: 'Low', progress: 100 },
  { id: 8, workspaceId: 1, task: 'Sketchbook week 5', course: 'Studio Practice', due: 'Sep 30, 2026', status: 'Done', priority: 'Medium', progress: 100 },
  { id: 9, workspaceId: 1, task: 'Usability test plan', course: 'Interaction Design', due: 'Oct 20, 2026', status: 'In progress', priority: 'High', progress: 25 },
  { id: 10, workspaceId: 1, task: 'Annotated bibliography', course: 'Design Research', due: 'Oct 25, 2026', status: 'To do', priority: 'Medium', progress: 0 },
  { id: 11, workspaceId: 1, task: 'Peer review feedback', course: 'Studio Practice', due: 'Oct 05, 2026', status: 'To do', priority: 'High', progress: 0, description: 'Past its due date — used to preview overdue styling.' },
  { id: 12, workspaceId: 1, task: 'Field observation log', course: 'Cultural Studies', due: 'Oct 18, 2026', status: 'In progress', priority: 'Low', progress: 80 },

  { id: 13, workspaceId: 2, task: 'Brand identity project', course: 'Visual Design', due: 'Mar 14, 2026', status: 'Done', priority: 'High', progress: 100 },
  { id: 14, workspaceId: 2, task: 'Typography specimen', course: 'Visual Design', due: 'Feb 20, 2026', status: 'Done', priority: 'Medium', progress: 100 },
  { id: 15, workspaceId: 2, task: 'User interview synthesis', course: 'Design Research', due: 'Apr 02, 2026', status: 'Done', priority: 'High', progress: 100 },
  { id: 16, workspaceId: 2, task: 'Accessibility audit', course: 'Interaction Design', due: 'Apr 18, 2026', status: 'Done', priority: 'Medium', progress: 100 },
  { id: 17, workspaceId: 2, task: 'Semester reflection', course: 'Cultural Studies', due: 'May 02, 2026', status: 'Done', priority: 'Low', progress: 100 },
  { id: 18, workspaceId: 2, task: 'Portfolio review', course: 'Studio Practice', due: 'May 08, 2026', status: 'In progress', priority: 'High', progress: 70 },

  { id: 19, workspaceId: 3, task: 'Intro to design thinking essay', course: 'Design Foundations', due: 'Sep 15, 2025', status: 'Done', priority: 'Medium', progress: 100 },
  { id: 20, workspaceId: 3, task: 'Color theory exercise', course: 'Design Foundations', due: 'Oct 20, 2025', status: 'Done', priority: 'Low', progress: 100 },
  { id: 21, workspaceId: 3, task: 'Final studio showcase', course: 'Studio Practice', due: 'Dec 10, 2025', status: 'Done', priority: 'High', progress: 100 },

  { id: 22, workspaceId: 5, task: 'Comparative analysis of accessibility guidelines across mobile and web platforms', course: 'Human-Computer Interaction and Inclusive Design Studies', due: 'Jul 10, 2026', status: 'Done', priority: 'High', progress: 100, description: 'Long title and course name — used to preview truncation.' },
  { id: 23, workspaceId: 5, task: 'Summer capstone write-up', course: 'Inclusive Design', due: 'Jul 22, 2026', status: 'In progress', priority: 'Medium', progress: 90 },
]

const seedMaterials: Material[] = [
  { id: 1, workspaceId: 1, title: 'The Design of Everyday Things', course: 'Interaction Design', type: 'Book', tags: 'reading, theory', reviewed: '' },
  { id: 2, workspaceId: 1, title: 'Week 03 — Research methods', course: 'Design Research', type: 'Slides', tags: 'methods, week 03', reviewed: 'Sep 08', taskId: 1 },
  { id: 3, workspaceId: 1, title: 'Studio references / 2026', course: 'Studio Practice', type: 'Collection', tags: 'references', reviewed: 'Sep 05', links: [
    { id: 1, url: 'https://www.are.na/', label: 'Are.na channels' },
    { id: 2, url: 'https://www.designspiration.com/', label: 'Designspiration' },
    { id: 3, url: 'https://www.behance.net/', label: 'Behance portfolios' },
  ] },
  { id: 4, workspaceId: 1, title: 'Cultural identity notes', course: 'Cultural Studies', type: 'Notes', tags: 'identity, key terms', reviewed: 'Aug 29', taskId: 2 },
  { id: 5, workspaceId: 1, title: 'Nielsen: 10 usability heuristics', course: 'Interaction Design', type: 'Link', tags: 'usability, heuristics', reviewed: 'Oct 03', lastOpened: 'Oct 04', url: 'https://www.nngroup.com/articles/ten-usability-heuristics/', taskId: 9 },
  { id: 6, workspaceId: 1, title: 'Ethnography field guide', course: 'Cultural Studies', type: 'PDF', tags: 'ethnography, method', reviewed: 'Oct 01', lastOpened: 'Oct 02', url: '/files/ethnography-field-guide.pdf', taskId: 12, description: 'Focus on chapters 2-3 for Thursday\'s discussion.' },
  { id: 7, workspaceId: 1, title: 'Prototyping in Figma — walkthrough', course: 'Interaction Design', type: 'Video', tags: 'figma, prototype', reviewed: 'Sep 27', url: 'https://example.com/figma-walkthrough', contentSource: 'link', taskId: 3 },
  { id: 8, workspaceId: 1, title: 'Literature matrix template', course: 'Design Research', type: 'Notes', tags: 'template, bibliography', reviewed: 'Just now', taskId: 10 },
  { id: 18, workspaceId: 1, title: 'Prototyping handbook', course: 'Interaction Design', type: 'PDF', tags: 'figma, prototype', reviewed: 'Just now', url: '/files/prototyping-handbook.pdf', taskId: 4 },

  { id: 9, workspaceId: 2, title: 'Thinking with Type', course: 'Visual Design', type: 'Book', tags: 'typography, reading', reviewed: 'Feb 12' },
  { id: 10, workspaceId: 2, title: 'WCAG 2.2 quick reference', course: 'Interaction Design', type: 'Link', tags: 'accessibility, wcag', reviewed: 'Apr 10', url: 'https://www.w3.org/WAI/WCAG22/quickref/' },
  { id: 11, workspaceId: 2, title: 'Interview synthesis workshop', course: 'Design Research', type: 'Slides', tags: 'interviews, synthesis', reviewed: 'Mar 30' },
  { id: 12, workspaceId: 2, title: 'Portfolio inspiration', course: 'Studio Practice', type: 'Collection', tags: 'portfolio, references', reviewed: 'May 01', links: [
    { id: 1, url: 'https://www.awwwards.com/', label: 'Awwwards' },
    { id: 2, url: 'https://www.siteinspire.com/', label: 'SiteInspire' },
  ] },

  { id: 13, workspaceId: 3, title: 'Interaction of Color', course: 'Design Foundations', type: 'Book', tags: 'color, reading', reviewed: 'Oct 12' },
  { id: 14, workspaceId: 3, title: 'Design thinking lecture notes', course: 'Design Foundations', type: 'Notes', tags: 'lecture, week 01', reviewed: 'Sep 10' },

  { id: 15, workspaceId: 6, title: 'Refactoring UI', course: 'Self Study', type: 'Book', tags: 'ui, design', reviewed: 'Oct 04' },
  { id: 16, workspaceId: 6, title: 'Vue 3 reactivity deep dive', course: 'Self Study', type: 'Video', tags: 'vue, frontend', reviewed: 'Sep 30', url: 'https://example.com/vue-reactivity', contentSource: 'link' },
  { id: 17, workspaceId: 6, title: 'Nuxt 4 migration notes', course: 'Self Study', type: 'Notes', tags: 'nuxt, migration', reviewed: 'Yesterday' },
]

// Live state clones the immutable seeds per app instance: fresh per SSR request,
// shared (and mutable) across client-side navigations.
export const useApi = () => {
  const workspaces = useState<Workspace[]>('api-workspaces', () => structuredClone(seedWorkspaces))
  const tasks = useState<Task[]>('api-tasks', () => structuredClone(seedTasks))
  const materials = useState<Material[]>('api-materials', () => structuredClone(seedMaterials))

  /**
   * Derived aggregates read the live task/material state, so every consumer
   * (dashboard, sidebar, overview) sees the same numbers after a mutation.
   */
  function summarizeWorkspace(workspaceId: number) {
    const workspaceTasks = tasks.value.filter(t => t.workspaceId === workspaceId)
    const workspaceMaterials = materials.value.filter(m => m.workspaceId === workspaceId)
    const completed = workspaceTasks.filter(t => t.status === 'Done').length
    const progress = workspaceTasks.length
      ? Math.round(workspaceTasks.reduce((sum, t) => sum + t.progress, 0) / workspaceTasks.length)
      : 0
    const pending = workspaceTasks.filter(t => t.status !== 'Done')
    const datedNext = pending
      .map(task => ({ task, time: new Date(task.due).getTime() }))
      .filter(item => !Number.isNaN(item.time))
      .sort((a, b) => a.time - b.time)[0]?.task
    const next = datedNext ?? pending[0]

    return {
      courses: new Set([...workspaceTasks, ...workspaceMaterials].map(item => item.course).filter(Boolean)).size,
      assignments: workspaceTasks.length,
      completed,
      progress,
      next: next?.task ?? (workspaceTasks.length ? 'Semester complete' : 'No tasks yet'),
      nextDue: datedNext ? shortDueLabel(datedNext.due) : '—',
    }
  }

  function withSummary(workspace: Workspace): Workspace {
    return { ...workspace, ...summarizeWorkspace(workspace.id) }
  }

  return {
    getWorkspaces: () => workspaces.value.map(withSummary),
    getWorkspaceBySlug: (slug: string) => {
      const workspace = workspaces.value.find(w => w.slug === slug)
      return workspace ? withSummary(workspace) : undefined
    },

    getTasks: (workspaceId: number) => tasks.value.filter(t => t.workspaceId === workspaceId),

    getMaterials: (workspaceId: number) => materials.value.filter(m => m.workspaceId === workspaceId),

    /** The live `useState` arrays themselves — mutations must go through these. */
    getTaskState: () => tasks,
    getMaterialState: () => materials,

    /** Workspace mutations (state is session-only; reloads reset to seed). */
    addWorkspace: (payload: WorkspaceFormPayload) => {
      const id = workspaces.value.reduce((m, w) => Math.max(m, w.id), 0) + 1
      // Keep slugs unique so `/workspaces/:slug` stays unambiguous.
      const base = slugify(payload.name) || 'workspace'
      let slug = base
      let suffix = 2
      while (workspaces.value.some(w => w.slug === slug))
        slug = `${base}-${suffix++}`
      const item: Workspace = {
        id,
        name: payload.name,
        slug,
        dates: dateRangeLabel(payload.startDate, payload.endDate),
        startDate: payload.startDate,
        endDate: payload.endDate,
        courses: 0,
        assignments: 0,
        completed: 0,
        progress: 0,
        active: payload.isActive,
        next: 'No tasks yet',
        nextDue: '—',
      }
      workspaces.value.push(item)
      // Only one workspace can be active at a time.
      if (item.active)
        workspaces.value.forEach(w => w.active = w.id === item.id)
      return item
    },

    updateWorkspace: (id: number, payload: WorkspaceFormPayload) => {
      const item = workspaces.value.find(w => w.id === id)
      if (!item)
        return
      item.name = payload.name
      item.active = payload.isActive
      item.startDate = payload.startDate || undefined
      item.endDate = payload.endDate || undefined
      item.dates = dateRangeLabel(item.startDate, item.endDate)
      // Only one workspace can be active at a time.
      if (item.active)
        workspaces.value.forEach(w => w.active = w.id === item.id)
    },

    removeWorkspace: (id: number) => {
      const index = workspaces.value.findIndex(w => w.id === id)
      if (index !== -1)
        workspaces.value.splice(index, 1)
      // Cascade: remove the workspace's tasks and materials in place.
      for (let i = tasks.value.length - 1; i >= 0; i--) {
        if (tasks.value[i]?.workspaceId === id)
          tasks.value.splice(i, 1)
      }
      for (let i = materials.value.length - 1; i >= 0; i--) {
        if (materials.value[i]?.workspaceId === id)
          materials.value.splice(i, 1)
      }
    },

    setActiveWorkspace: (id: number) => {
      const item = workspaces.value.find(w => w.id === id)
      if (!item)
        return
      workspaces.value.forEach(w => w.active = w.id === id)
      return item
    },

    removeMaterial: (id: number) => {
      const index = materials.value.findIndex(m => m.id === id)
      if (index !== -1)
        materials.value.splice(index, 1)
      for (const t of tasks.value) {
        if (t.materialIds?.includes(id))
          t.materialIds = t.materialIds.filter(mid => mid !== id) || undefined
      }
    },

    /** Task mutations — callers mutate the returned live array. */
    addTask: (workspaceId: number, payload: TaskPayload) => {
      const item: Task = {
        id: tasks.value.reduce((m, t) => Math.max(m, t.id), 0) + 1,
        workspaceId,
        task: payload.title,
        course: payload.course,
        due: formatTaskDue(payload.due),
        status: 'To do',
        priority: priorityMap[payload.priority],
        progress: 0,
        description: payload.description || undefined,
        submissionUrls: payload.submissionUrl.trim() ? [payload.submissionUrl.trim()] : undefined,
      }
      tasks.value.unshift(item)
      return item
    },

    removeTask: (id: number) => {
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1)
        tasks.value.splice(index, 1)
      // Unlink materials that pointed at the deleted task.
      for (const m of materials.value) {
        if (m.taskId === id)
          m.taskId = undefined
      }
    },

    addMaterial: (workspaceId: number, payload: MaterialPayload) => {
      const item: Material = {
        id: materials.value.reduce((m, mat) => Math.max(m, mat.id), 0) + 1,
        workspaceId,
        title: payload.title,
        course: payload.course,
        type: payload.type,
        tags: payload.tags.join(', '),
        reviewed: '',
        url: payload.url || undefined,
        taskId: payload.taskId ?? undefined,
      }
      materials.value.unshift(item)
      if (item.taskId) {
        const task = tasks.value.find(t => t.id === item.taskId)
        if (task) {
          task.materialIds = [...(task.materialIds ?? []), item.id]
        }
      }
      return item
    },
  }
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function dateRangeLabel(start?: string, end?: string) {
  if (start && end)
    return `${formatShortDate(start)} — ${formatShortDate(end)}`
  if (start)
    return formatShortDate(start)
  return 'Ongoing'
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime()))
    return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTaskDue(iso: string) {
  if (!iso)
    return 'No due date'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** `Oct 08, 2026` → `Oct 08` (the dashboard's compact deadline label). */
function shortDueLabel(due: string) {
  return due.replace(/,\s*\d{4}$/, '')
}

const priorityMap: Record<TaskPriority, Task['priority']> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}
