import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';
import { CodeBlockView } from '../ui/CodeBlockView';

/** Shared lowlight registry (the common highlight.js language set). */
const lowlight = createLowlight(common);

/**
 * Code block with syntax highlighting (lowlight) and a per-block language
 * picker. Replaces StarterKit's plain `codeBlock` — same node name, so existing
 * toggle commands and the slash menu keep working.
 */
export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
}).configure({ lowlight });
