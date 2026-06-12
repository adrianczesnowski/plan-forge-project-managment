import { useState } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useAuthStore } from '@/stores/auth.store';
import {
  useCreateComment,
  useDeleteComment,
  useTaskComments,
} from '@/entities/comment/hooks/use-comments';
import { Button } from '@/shared/ui/button';

const AVATAR_COLORS = ['#7c5cfc', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

function avatarColor(userId: string): string {
  let hash = 0;
  for (const char of userId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export function TaskComments({ taskId }: { taskId: string }) {
  const { t } = useTranslation('tasks');
  const currentUser = useAuthStore((s) => s.user);
  const { data: comments } = useTaskComments(taskId);
  const createComment = useCreateComment(taskId);
  const deleteComment = useDeleteComment(taskId);
  const [content, setContent] = useState('');

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed || createComment.isPending) return;
    createComment.mutate({ content: trimmed }, { onSuccess: () => setContent('') });
  };

  return (
    <div className="flex h-full flex-col">
      <h3 className="flex items-center gap-1.5 border-b border-border px-4 py-3 text-[13px] font-semibold text-muted-foreground">
        <MessageSquare className="h-4 w-4" />
        {t('modal.comments')}
        {comments && comments.length > 0 && (
          <span className="text-[12px] font-normal text-faint">{comments.length}</span>
        )}
      </h3>

      <div className="flex-1 overflow-y-auto p-4">
        {comments?.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-faint">{t('modal.noComments')}</p>
        )}
        <div className="flex flex-col gap-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="group flex gap-2.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: avatarColor(comment.authorId) }}
              >
                {comment.author.firstName.charAt(0)}
                {comment.author.lastName.charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold">
                    {comment.author.firstName} {comment.author.lastName}
                  </span>
                  <span className="text-[11px] text-faint">
                    {format(new Date(comment.createdAt), 'd MMM, HH:mm')}
                  </span>
                  {comment.authorId === currentUser?.id && (
                    <button
                      type="button"
                      title={t('modal.deleteComment')}
                      onClick={() => deleteComment.mutate(comment.id)}
                      className="ml-auto hidden h-5 w-5 items-center justify-center rounded text-faint hover:text-destructive group-hover:flex"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <textarea
          value={content}
          rows={2}
          placeholder={t('modal.commentPlaceholder')}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          className="w-full resize-none rounded-lg border border-border p-2.5 text-[13px] outline-none transition-colors focus:border-primary"
        />
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={submit} isLoading={createComment.isPending} disabled={!content.trim()}>
            {t('modal.send')}
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
