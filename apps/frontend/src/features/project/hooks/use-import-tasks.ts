import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/entities/task/api/task.api';
import { taskKeys } from '@/entities/task/hooks/use-tasks';
import type { ImportTask } from '../lib/task-transfer';

interface ImportState {
  running: boolean;
  done: number;
  total: number;
  error: unknown;
}

const IDLE: ImportState = { running: false, done: 0, total: 0, error: null };

/**
 * Creates imported tasks one by one so each parent's id is known before its
 * children are sent. Progress is applied with a follow-up update (the create
 * endpoint doesn't accept it).
 */
export function useImportTasks(projectId: string) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ImportState>(IDLE);

  const run = async (tasks: ImportTask[]): Promise<boolean> => {
    setState({ running: true, done: 0, total: tasks.length, error: null });
    const idByKey = new Map<string, string>();
    try {
      for (const task of tasks) {
        const parentId = task.parentKey ? idByKey.get(task.parentKey) : undefined;
        const created = await taskApi.create({ ...task.input, projectId, parentId });
        idByKey.set(task.wbsKey, created.id);
        if (task.progress > 0) {
          await taskApi.update(created.id, { progress: task.progress });
        }
        setState((s) => ({ ...s, done: s.done + 1 }));
      }
      await queryClient.invalidateQueries({ queryKey: taskKeys.tree(projectId) });
      setState((s) => ({ ...s, running: false }));
      return true;
    } catch (error) {
      setState((s) => ({ ...s, running: false, error }));
      return false;
    }
  };

  const reset = () => setState(IDLE);

  return { ...state, run, reset };
}
