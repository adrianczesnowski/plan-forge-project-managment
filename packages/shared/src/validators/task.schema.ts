import { z } from 'zod';
import { isoDateSchema, uuidSchema } from './common.schema';

const taskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED']);
const taskPrioritySchema = z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  description: z.string().max(50000).optional(),
  projectId: uuidSchema,
  parentId: uuidSchema.optional(),
  status: taskStatusSchema.default('TODO'),
  priority: taskPrioritySchema.default('NONE'),
  startDate: isoDateSchema.optional(),
  endDate: isoDateSchema.optional(),
  estimatedHours: z.number().positive().max(100000).optional(),
  assigneeId: uuidSchema.optional(),
  isMilestone: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().max(50000).nullable().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  startDate: isoDateSchema.nullable().optional(),
  endDate: isoDateSchema.nullable().optional(),
  estimatedHours: z.number().positive().max(100000).nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
  assigneeId: uuidSchema.nullable().optional(),
  isMilestone: z.boolean().optional(),
});

export const moveTaskSchema = z.object({
  parentId: uuidSchema.nullable(),
  /** Target position among siblings (0-based). */
  order: z.number().int().min(0),
});

export const reorderTasksSchema = z.object({
  parentId: uuidSchema.nullable(),
  projectId: uuidSchema,
  taskIds: z.array(uuidSchema).min(1),
});

export const bulkTaskActionSchema = z.object({
  taskIds: z.array(uuidSchema).min(1).max(100),
  action: z.discriminatedUnion('type', [
    z.object({ type: z.literal('SET_STATUS'), status: taskStatusSchema }),
    z.object({ type: z.literal('SET_PRIORITY'), priority: taskPrioritySchema }),
    z.object({ type: z.literal('SET_ASSIGNEE'), assigneeId: uuidSchema.nullable() }),
    z.object({ type: z.literal('DELETE') }),
  ]),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type BulkTaskActionInput = z.infer<typeof bulkTaskActionSchema>;
