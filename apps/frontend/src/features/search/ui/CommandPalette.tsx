import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderKanban, Layers, ListTodo, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { searchApi } from '@/entities/search/api/search.api';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const SPACE_DOT_FALLBACK = '#9ca3af';

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term), 200);
    return () => clearTimeout(id);
  }, [term]);

  useEffect(() => {
    if (!open) {
      setTerm('');
      setDebounced('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const enabled = open && debounced.trim().length >= 2;
  const { data, isFetching } = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchApi.query(debounced),
    enabled,
  });

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const hasResults =
    data && (data.tasks.length > 0 || data.projects.length > 0 || data.spaces.length > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#0f0f1e]/40 p-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl animate-fade-in-up overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
            className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-faint"
          />
          {isFetching && <span className="text-[11px] text-faint">…</span>}
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {!enabled && (
            <p className="py-8 text-center text-[12.5px] text-faint">{t('search.hint')}</p>
          )}
          {enabled && !hasResults && !isFetching && (
            <p className="py-8 text-center text-[12.5px] text-faint">{t('search.empty')}</p>
          )}

          {data && data.tasks.length > 0 && (
            <Section label={t('search.tasks')}>
              {data.tasks.map((task) => (
                <Row key={task.id} onClick={() => go(`/projects/${task.projectId}/tasks/${task.id}`)}>
                  <ListTodo className="h-4 w-4 shrink-0 text-faint" />
                  <span className="shrink-0 font-mono text-[11px] text-faint">{task.wbsNumber}</span>
                  <span className="truncate">{task.title}</span>
                  <span className="ml-auto shrink-0 truncate pl-2 text-[11.5px] text-faint">
                    {task.projectName}
                  </span>
                </Row>
              ))}
            </Section>
          )}

          {data && data.projects.length > 0 && (
            <Section label={t('search.projects')}>
              {data.projects.map((project) => (
                <Row key={project.id} onClick={() => go(`/projects/${project.id}`)}>
                  <FolderKanban className="h-4 w-4 shrink-0 text-faint" />
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto shrink-0 truncate pl-2 text-[11.5px] text-faint">
                    {project.spaceName}
                  </span>
                </Row>
              ))}
            </Section>
          )}

          {data && data.spaces.length > 0 && (
            <Section label={t('search.spaces')}>
              {data.spaces.map((space) => (
                <Row key={space.id} onClick={() => go(`/spaces/${space.id}`)}>
                  <Layers className="h-4 w-4 shrink-0 text-faint" />
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: space.color ?? SPACE_DOT_FALLBACK }}
                  />
                  <span className="truncate">{space.name}</span>
                </Row>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <div className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-faint">
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}
