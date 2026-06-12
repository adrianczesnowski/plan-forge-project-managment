import { useMemo, useState } from 'react';
import { Link2, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DependencyType, type Dependency, type TaskTreeNode } from '@planforge/shared';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { useTaskDependencies } from '@/entities/dependency/hooks/use-dependencies';
import { flattenTree } from '@/entities/task/lib/flatten-tree';
import { useCreateDependency, useDeleteDependency } from '../../hooks/use-dependency-mutations';

type Direction = 'predecessor' | 'successor';

interface TaskDependenciesProps {
  task: TaskTreeNode;
  projectId: string;
  canEdit: boolean;
}

export function TaskDependencies({ task, projectId, canEdit }: TaskDependenciesProps) {
  const { t } = useTranslation('tasks');
  const navigate = useNavigate();
  const { data: tree } = useProjectTasks(projectId);
  const { data: dependencies = [] } = useTaskDependencies(task.id);
  const createDependency = useCreateDependency(projectId);
  const deleteDependency = useDeleteDependency(projectId);

  const [direction, setDirection] = useState<Direction>('predecessor');
  const [type, setType] = useState<DependencyType>(DependencyType.FS);
  const [otherTaskId, setOtherTaskId] = useState('');

  const tasksById = useMemo(() => {
    const flat = tree ? flattenTree(tree) : [];
    return new Map(flat.map((node) => [node.id, node]));
  }, [tree]);

  const linkedIds = new Set(dependencies.flatMap((d) => [d.predecessorId, d.successorId]));
  const candidates = [...tasksById.values()].filter(
    (node) => node.id !== task.id && !linkedIds.has(node.id),
  );

  const predecessors = dependencies.filter((d) => d.successorId === task.id);
  const successors = dependencies.filter((d) => d.predecessorId === task.id);

  const add = () => {
    if (!otherTaskId || createDependency.isPending) return;
    createDependency.mutate(
      {
        predecessorId: direction === 'predecessor' ? otherTaskId : task.id,
        successorId: direction === 'predecessor' ? task.id : otherTaskId,
        type,
        lag: 0,
      },
      { onSuccess: () => setOtherTaskId('') },
    );
  };

  const renderRow = (dependency: Dependency, otherId: string) => {
    const other = tasksById.get(otherId);
    if (!other) return null;
    return (
      <div
        key={dependency.id}
        className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40"
      >
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-muted-foreground">
          {dependency.type}
          {dependency.lag !== 0 && (dependency.lag > 0 ? `+${dependency.lag}` : dependency.lag)}
        </span>
        <button
          type="button"
          onClick={() => navigate(`/projects/${projectId}/tasks/${other.id}`)}
          className="min-w-0 flex-1 truncate text-left text-[13px] hover:text-primary"
        >
          <span className="mr-1.5 font-mono text-[11px] text-faint">{other.wbsNumber}</span>
          {other.title}
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={() => deleteDependency.mutate(dependency.id)}
            className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-faint hover:bg-muted hover:text-destructive group-hover:flex"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
        <Link2 className="h-4 w-4" />
        {t('dependencies.title')}
      </h3>

      {predecessors.length > 0 && (
        <div className="mb-1">
          <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-faint">
            {t('dependencies.predecessors')}
          </p>
          {predecessors.map((d) => renderRow(d, d.predecessorId))}
        </div>
      )}
      {successors.length > 0 && (
        <div className="mb-1">
          <p className="px-2 text-[11px] font-medium uppercase tracking-wide text-faint">
            {t('dependencies.successors')}
          </p>
          {successors.map((d) => renderRow(d, d.successorId))}
        </div>
      )}

      {canEdit && (
        <div className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-border px-2 py-1.5">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className="shrink-0 bg-transparent text-[12.5px] text-muted-foreground outline-none"
          >
            <option value="predecessor">{t('dependencies.direction.predecessor')}</option>
            <option value="successor">{t('dependencies.direction.successor')}</option>
          </select>
          <select
            value={otherTaskId}
            onChange={(e) => setOtherTaskId(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          >
            <option value="">{t('dependencies.selectTask')}</option>
            {candidates.map((node) => (
              <option key={node.id} value={node.id}>
                {node.wbsNumber} {node.title}
              </option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DependencyType)}
            className="shrink-0 bg-transparent font-mono text-[12px] text-muted-foreground outline-none"
          >
            {Object.values(DependencyType).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!otherTaskId || createDependency.isPending}
            onClick={add}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/10 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
