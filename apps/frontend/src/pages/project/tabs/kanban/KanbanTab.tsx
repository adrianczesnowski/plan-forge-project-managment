import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { TaskStatus, type ProjectWithRole, type TaskTreeNode } from '@planforge/shared';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { flattenTree } from '@/entities/task/lib/flatten-tree';
import { useUpdateTask } from '@/features/task/hooks/use-task-mutations';
import { FullPageSpinner } from '@/shared/ui/full-page-spinner';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';

/** Per the plan, the board shows the four working statuses (no CANCELLED column). */
const BOARD_COLUMNS: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];

export function KanbanTab({ project }: { project: ProjectWithRole }) {
  const navigate = useNavigate();
  const { data: tree, isPending } = useProjectTasks(project.id);
  const updateTask = useUpdateTask(project.id);
  const [activeTask, setActiveTask] = useState<TaskTreeNode | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const canEdit = project.myRole !== 'VIEWER';

  const tasksByStatus = useMemo(() => {
    const flat = tree ? flattenTree(tree) : [];
    const groups = new Map<TaskStatus, TaskTreeNode[]>(BOARD_COLUMNS.map((s) => [s, []]));
    for (const task of flat) {
      groups.get(task.status)?.push(task);
    }
    return groups;
  }, [tree]);

  if (isPending) return <FullPageSpinner />;

  const openTask = (taskId: string) => navigate(`/projects/${project.id}/tasks/${taskId}`);

  const handleDragStart = ({ active }: DragStartEvent) => {
    const flat = tree ? flattenTree(tree) : [];
    setActiveTask(flat.find((t) => t.id === active.id) ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveTask(null);
    if (!over) return;
    const status = over.id as TaskStatus;
    const task = (tree ? flattenTree(tree) : []).find((t) => t.id === active.id);
    if (task && task.status !== status) {
      updateTask.mutate({ taskId: task.id, input: { status } });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTask(null)}
    >
      <div className="flex h-full gap-3 overflow-x-auto p-4">
        {BOARD_COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus.get(status) ?? []}
            canEdit={canEdit}
            onOpen={openTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} canEdit={false} onOpen={() => {}} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
