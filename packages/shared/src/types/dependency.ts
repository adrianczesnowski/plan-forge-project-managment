import type { DependencyType } from './enums';

export interface Dependency {
  id: string;
  predecessorId: string;
  successorId: string;
  type: DependencyType;
  lag: number;
}
