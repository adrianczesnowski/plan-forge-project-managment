import { z } from 'zod';
import { uuidSchema } from './common.schema';

/** tiptap JSON body — stored verbatim, validated only as a plain object. */
const documentContentSchema = z.record(z.string(), z.unknown());

export const createDocumentSchema = z.object({
  type: z.enum(['FOLDER', 'DOC']).default('DOC'),
  title: z.string().trim().min(1, 'Title is required').max(300),
  icon: z.string().trim().max(50).optional(),
  parentId: uuidSchema.nullable().optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300).optional(),
  icon: z.string().trim().max(50).nullable().optional(),
  coverColor: z.string().trim().max(120).nullable().optional(),
  content: documentContentSchema.nullable().optional(),
});

/** Move/reorder a node within the tree (drag & drop). */
export const moveDocumentSchema = z.object({
  parentId: uuidSchema.nullable(),
  index: z.number().int().min(0).optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type MoveDocumentInput = z.infer<typeof moveDocumentSchema>;
