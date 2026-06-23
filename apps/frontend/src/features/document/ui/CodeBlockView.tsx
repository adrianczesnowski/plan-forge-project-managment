import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import type { createLowlight } from 'lowlight';
import 'highlight.js/styles/github.css';

const AUTO = 'auto';

/**
 * Renders a code block with a per-block language selector in the corner. The
 * chosen language drives lowlight (highlight.js) syntax colouring; "auto" lets
 * lowlight detect the language.
 */
export function CodeBlockView({ node, updateAttributes, extension }: NodeViewProps) {
  const lowlight = extension.options.lowlight as ReturnType<typeof createLowlight>;
  const languages = lowlight.listLanguages().sort();
  const current = (node.attrs.language as string | null) ?? AUTO;

  return (
    <NodeViewWrapper className="group relative">
      <select
        contentEditable={false}
        value={current}
        onChange={(e) =>
          updateAttributes({ language: e.target.value === AUTO ? null : e.target.value })
        }
        className="absolute right-2 top-2 z-10 cursor-pointer rounded-md border border-border bg-white/90 px-1.5 py-0.5 text-[11px] text-muted-foreground opacity-0 outline-none transition-opacity focus:opacity-100 group-hover:opacity-100"
      >
        <option value={AUTO}>auto</option>
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang}
          </option>
        ))}
      </select>
      <pre>
        <NodeViewContent as={'code' as 'div'} />
      </pre>
    </NodeViewWrapper>
  );
}
