import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateDependencyInput } from '@planforge/shared';
import { dependencyApi } from '@/entities/dependency/api/dependency.api';
import { dependencyKeys } from '@/entities/dependency/hooks/use-dependencies';

/** Invalidate both the project-level list (Gantt) and per-task lists (modal). */
function useInvalidateDependencies(projectId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: dependencyKeys.byProject(projectId) });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };
}

export function useCreateDependency(projectId: string) {
  const invalidate = useInvalidateDependencies(projectId);
  return useMutation({
    mutationFn: (input: CreateDependencyInput) => dependencyApi.create(input),
    onSuccess: invalidate,
  });
}

export function useDeleteDependency(projectId: string) {
  const invalidate = useInvalidateDependencies(projectId);
  return useMutation({
    mutationFn: (dependencyId: string) => dependencyApi.delete(dependencyId),
    onSuccess: invalidate,
  });
}
