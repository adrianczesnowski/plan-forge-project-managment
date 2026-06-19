import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Download, Upload } from 'lucide-react';
import type { ProjectWithRole } from '@planforge/shared';
import { Dialog } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { translateApiError } from '@/shared/lib/api-error';
import { useProjectTasks } from '@/entities/task/hooks/use-tasks';
import { useImportTasks } from '../hooks/use-import-tasks';
import {
  exportTasks,
  parseImportFile,
  type ImportTask,
  type ParseResult,
  type TransferFormat,
} from '../lib/task-transfer';

interface ProjectDataDialogProps {
  project: ProjectWithRole;
  open: boolean;
  onClose: () => void;
}

export function ProjectDataDialog({ project, open, onClose }: ProjectDataDialogProps) {
  const { t } = useTranslation('projects');
  const { data: tree } = useProjectTasks(project.id);
  const importer = useImportTasks(project.id);
  const fileRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<TransferFormat>('csv');
  const [fileName, setFileName] = useState<string>('');
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [done, setDone] = useState(false);

  const canEdit = project.myRole !== 'VIEWER';

  const resetImport = () => {
    setFileName('');
    setParsed(null);
    setParseError('');
    setDone(false);
    importer.reset();
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleClose = () => {
    resetImport();
    onClose();
  };

  const handleExport = () => {
    if (tree) exportTasks(tree, format, project.name);
  };

  const handleFile = async (file: File) => {
    resetImport();
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      setParsed(parseImportFile(buffer));
    } catch {
      setParseError(t('dataTransfer.parseFailed'));
    }
  };

  const runImport = async (tasks: ImportTask[]) => {
    const ok = await importer.run(tasks);
    if (ok) setDone(true);
  };

  const issues = parsed?.issues ?? [];
  const tasks = parsed?.tasks ?? [];
  const importable = issues.length === 0 && tasks.length > 0;

  return (
    <Dialog open={open} onClose={handleClose} title={t('dataTransfer.title')}>
      <div className="flex flex-col gap-6">
        {/* Export */}
        <section className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold">
            <Download className="h-4 w-4 text-muted-foreground" />
            {t('dataTransfer.exportTitle')}
          </h3>
          <p className="text-[12.5px] text-muted-foreground">{t('dataTransfer.exportHint')}</p>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-border p-0.5">
              {(['csv', 'xlsx'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={
                    'rounded-md px-3 py-1 text-[12.5px] font-medium transition-colors ' +
                    (format === f ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={handleExport} disabled={!tree?.length}>
              {t('dataTransfer.exportButton')}
            </Button>
          </div>
        </section>

        <div className="h-px bg-border" />

        {/* Import */}
        <section className="flex flex-col gap-3">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold">
            <Upload className="h-4 w-4 text-muted-foreground" />
            {t('dataTransfer.importTitle')}
          </h3>

          {!canEdit ? (
            <p className="text-[12.5px] text-muted-foreground">{t('dataTransfer.importNoPermission')}</p>
          ) : (
            <>
              <p className="text-[12.5px] text-muted-foreground">{t('dataTransfer.importHint')}</p>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx"
                className="block w-full text-[12.5px] text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-[12.5px] file:font-medium file:text-foreground hover:file:bg-border-light"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />

              {parseError && <p className="text-[12.5px] text-destructive">{parseError}</p>}

              {parsed && issues.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-2.5">
                  <p className="mb-1 flex items-center gap-1.5 text-[12.5px] font-semibold text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('dataTransfer.issuesTitle', { n: issues.length })}
                  </p>
                  <ul className="list-inside list-disc space-y-0.5 text-[12px] text-destructive">
                    {issues.map((issue, i) => (
                      <li key={i}>{t(`dataTransfer.issues.${issue.key}` as never, issue.params)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed && importable && !done && (
                <p className="text-[12.5px] text-muted-foreground">
                  {t('dataTransfer.readyToImport', { n: tasks.length, file: fileName })}
                </p>
              )}

              {importer.running && (
                <p className="text-[12.5px] text-muted-foreground">
                  {t('dataTransfer.importing', { done: importer.done, total: importer.total })}
                </p>
              )}

              {importer.error != null && (
                <p className="text-[12.5px] text-destructive">{translateApiError(importer.error)}</p>
              )}

              {done && (
                <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-accent-green">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('dataTransfer.importDone', { n: importer.total })}
                </p>
              )}

              {importable && !done && (
                <Button
                  type="button"
                  onClick={() => void runImport(tasks)}
                  isLoading={importer.running}
                >
                  {t('dataTransfer.importButton', { n: tasks.length })}
                </Button>
              )}
            </>
          )}
        </section>
      </div>
    </Dialog>
  );
}
