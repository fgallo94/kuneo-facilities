'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Send } from 'lucide-react';
import { useIncidenceDetail } from '../hooks/useIncidenceDetail';
import { useIncidenceHistory } from '../hooks/useIncidenceHistory';
import { useIncidenceComments } from '../hooks/useIncidenceComments';
import { useAddComment } from '../hooks/useAddComment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUsers } from '@/features/dashboard/hooks/useUsers';
import { useInstallations } from '@/features/dashboard/hooks/useInstallations';
import { useUpdateIncidence } from '@/features/dashboard/hooks/useUpdateIncidence';
import { EditIncidenceModal } from '@/features/dashboard/components/EditIncidenceModal';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import type { IncidenceHistory } from '@/types';

interface IncidenceDetailModalProps {
  incidenceId: string;
  onClose: () => void;
}

const URGENCY_LABELS: Record<string, string> = {
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

const URGENCY_STYLES: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_STYLES: Record<string, string> = {
  Reportada: 'bg-brand/15 text-charcoal',
  'En reparación': 'bg-yellow-100 text-yellow-700',
  Reparado: 'bg-green-100 text-green-700',
  'A falta de presupuesto': 'bg-orange-100 text-orange-700',
  Presupuestado: 'bg-purple-100 text-purple-700',
  'Falta de material': 'bg-pink-100 text-pink-700',
  'A facturar': 'bg-indigo-100 text-indigo-700',
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plomería',
  electrical: 'Electricidad',
  carpentry: 'Carpintería',
  hvac: 'Climatización',
  security: 'Seguridad',
  cleaning: 'Limpieza',
  other: 'Otros',
};

function getUrgencyFromSeverity(severity: number, urgency?: string): string {
  if (urgency) return urgency;
  if (severity >= 5) return 'urgent';
  if (severity >= 3) return 'high';
  return 'normal';
}

function formatHistoryEntry(entry: IncidenceHistory): { title: string; subtitle?: string } {
  const name = entry.changedByName || 'Usuario';
  if (entry.changeType === 'creation') {
    return { title: `${name} reportó la incidencia` };
  }
  if (entry.changeType === 'comment') {
    return { title: `${name} comentó`, subtitle: entry.comment };
  }
  if (entry.changeType === 'status') {
    return { title: `${name} cambió el estado`, subtitle: `${entry.oldStatus ?? '-'} → ${entry.newStatus ?? '-'}` };
  }
  return { title: `${name} actualizó un campo`, subtitle: `"${entry.field ?? 'desconocido'}" : ${entry.oldValue ?? '-'} → ${entry.newValue ?? '-'}` };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeTimestamp(
  ts: { toDate: () => Date } | { seconds: number } | undefined
): Date | null {
  if (!ts) return null;
  if ('toDate' in ts && typeof ts.toDate === 'function') {
    return ts.toDate();
  }
  return new Date((ts as { seconds: number }).seconds * 1000);
}

export function IncidenceDetailModal({
  incidenceId,
  onClose,
}: IncidenceDetailModalProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { incidence, loading: incidenceLoading, error: incidenceError } = useIncidenceDetail(incidenceId);
  const { history, loading: historyLoading, error: historyError } = useIncidenceHistory(incidenceId);
  const { comments, loading: commentsLoading, error: commentsError } = useIncidenceComments(incidenceId);
  const { addComment, isLoading: addingComment, error: commentError, clearError: clearCommentError } = useAddComment();
  const { users } = useUsers();
  const { installations } = useInstallations();
  const { updateIncidence, isLoading: isUpdating } = useUpdateIncidence();

  const [editing, setEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const userMap = useMemo(() => new Map(users.map((u) => [u.uid, u])), [users]);
  const installationMap = useMemo(
    () => new Map(installations.map((i) => [i.id, i])),
    [installations]
  );

  // Lock body scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showFullHistory) {
          setShowFullHistory(false);
        } else if (showAllComments) {
          setShowAllComments(false);
        } else if (!editing) {
          onClose();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, editing, showFullHistory, showAllComments]);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || addingComment) return;
    clearCommentError();
    try {
      await addComment(incidenceId, commentText);
      setCommentText('');
    } catch {
      // error is surfaced via commentError
    }
  };

  if (incidenceLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-xl">
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
          </div>
        </div>
      </div>
    );
  }

  if (!incidence) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-3xl rounded-xl bg-white p-8 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Incidencia no encontrada</h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            La incidencia solicitada no existe o ha sido eliminada.
          </p>
        </div>
      </div>
    );
  }

  const urgencyKey = getUrgencyFromSeverity(incidence.severity, incidence.urgency);
  const urgencyLabel = URGENCY_LABELS[urgencyKey] ?? 'Normal';
  const urgencyStyle = URGENCY_STYLES[urgencyKey] ?? URGENCY_STYLES.normal;
  const statusStyle = STATUS_STYLES[incidence.status] ?? 'bg-gray-100 text-gray-700';

  const reporter = userMap.get(incidence.reportedBy);
  const reporterName = reporter?.displayName || reporter?.email || 'Usuario desconocido';
  const reporterInitials = reporter?.displayName
    ? reporter.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : reporter?.email?.slice(0, 2).toUpperCase() ?? 'U';

  const installation = installationMap.get(incidence.installationId);
  const location = [installation?.name, installation?.address].filter(Boolean).join(' • ');

  const reportedAt = incidence.createdAt
    ? formatRelativeTime(incidence.createdAt)
    : '';

  const reportedDateTime = incidence.createdAt
    ? (() => {
        const d = normalizeTimestamp(incidence.createdAt);
        return d ? `${formatDate(d)} a las ${formatTime(d)}` : '';
      })()
    : '';

  // Build timeline from history (ascending order). Fallback to creation stub for legacy incidences without history.
  const timeline = history.length > 0
    ? history.map((h) => {
        const entry = formatHistoryEntry(h);
        const d = normalizeTimestamp(h.timestamp);
        return {
          id: h.id,
          text: entry.title,
          subtitle: entry.subtitle,
          detail: d ? `${formatDate(d)} a las ${formatTime(d)}` : '',
          isInitial: h.changeType === 'creation',
        };
      })
    : [
        {
          id: 'created',
          text: 'Reportada',
          subtitle: undefined,
          detail: reportedDateTime,
          isInitial: true,
        },
      ];

  const reversedTimeline = [...timeline].reverse();
  const recentTimeline = reversedTimeline.slice(0, 3);
  const recentComments = comments.slice(-2);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0">
        <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="bg-charcoal px-5 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}
                >
                  {incidence.status}
                </span>
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${urgencyStyle}`}
                >
                  {urgencyLabel}
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-blue-200 transition-colors hover:bg-charcoal-light hover:text-white"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="mt-3 text-xl font-bold text-white">
              {incidence.title}
            </h2>
            <p className="mt-1 text-xs text-blue-200">
              {location || 'Ubicación desconocida'} {reportedAt ? `• ${reportedAt}` : ''}
            </p>
          </div>

          {/* Body */}
          <div className="bg-gray-50 px-5 py-3">
            {(incidenceError || historyError || commentsError) && (
              <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-medium">Error al cargar la incidencia</p>
                <p className="mt-0.5 text-xs">
                  {incidenceError || historyError || commentsError}
                </p>
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              {/* Description */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-900">Descripción</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  {incidence.description || 'Sin descripción'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span className="rounded-md bg-gray-100 px-2 py-1">
                    Categoría: {CATEGORY_LABELS[incidence.category] ?? incidence.category}
                  </span>
                  <span className="rounded-md bg-gray-100 px-2 py-1">
                    Facturar a: {incidence.billTo}
                  </span>
                  <span className="rounded-md bg-gray-100 px-2 py-1">
                    Severidad: {incidence.severity}/5
                  </span>
                </div>
              </div>

              {/* Reported By */}
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Reportado por
                </h3>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-xs font-bold text-white">
                    {reporterInitials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{reporterName}</p>
                    <p className="text-xs text-gray-500">{reportedDateTime}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {/* Visual Evidence */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-900">Evidencia visual</h3>
                {incidence.imageUrls.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-400">No hay imágenes adjuntas</p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {incidence.imageUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Evidencia ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Activity History */}
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Historial de actividad
                </h3>
                {historyLoading ? (
                  <div className="mt-2 flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
                  </div>
                ) : reversedTimeline.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-400">Sin historial</p>
                ) : (
                  <div className="relative mt-2 pl-4">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                    <ul className="space-y-3">
                      {recentTimeline.map((item) => (
                        <li key={item.id} className="relative">
                          <span
                            className={`absolute -left-[9px] top-1 h-2 w-2 rounded-full ring-2 ring-white ${
                              item.isInitial ? 'bg-blue-600' : 'bg-gray-400'
                            }`}
                          />
                          <p className="text-sm font-medium text-gray-800">{item.text}</p>
                          {item.subtitle && (
                            <p className="mt-0.5 text-xs text-gray-600">{item.subtitle}</p>
                          )}
                          {item.detail && (
                            <p className="mt-0.5 text-[11px] text-gray-500">{item.detail}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                    {reversedTimeline.length > 3 && (
                      <button
                        onClick={() => setShowFullHistory(true)}
                        className="mt-2 text-xs font-medium text-charcoal hover:text-charcoal hover:underline"
                      >
                        Ver historial completo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-gray-900">Comentarios</h3>

              {commentsLoading ? (
                <div className="mt-2 flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
                </div>
              ) : comments.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">
                  No hay comentarios aún. Sé el primero en comentar.
                </p>
              ) : (
                <>
                  <ul className="mt-2 space-y-2">
                    {recentComments.map((c) => {
                      const authorName = c.authorName || 'Usuario';
                      const createdAt = normalizeTimestamp(c.createdAt);
                      return (
                        <li key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-gray-700">
                              {authorName}
                            </span>
                            {createdAt && (
                              <span className="text-[11px] text-gray-400">
                                {formatDate(createdAt)} a las {formatTime(createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-gray-700">{c.text}</p>
                        </li>
                      );
                    })}
                  </ul>
                  {comments.length > 2 && (
                    <button
                      onClick={() => setShowAllComments(true)}
                      className="mt-2 text-xs font-medium text-charcoal hover:text-charcoal hover:underline"
                    >
                      Ver más comentarios
                    </button>
                  )}
                </>
              )}

              {/* Add Comment */}
              <div className="mt-2 space-y-2">
                {commentError && (
                  <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
                    {commentError}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      if (commentError) clearCommentError();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder="Escribe un comentario..."
                    rows={2}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || addingComment}
                    className="flex min-w-[5.5rem] items-center justify-center gap-1 rounded-md bg-charcoal px-3 py-2 text-sm font-medium text-white hover:bg-charcoal-light disabled:opacity-50"
                  >
                    {addingComment ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Enviar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light"
                >
                  Cambiar estado
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full History Modal */}
      {showFullHistory && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0"
          onClick={() => setShowFullHistory(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Historial completo</h3>
              <button
                onClick={() => setShowFullHistory(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
              <div className="relative pl-4">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />
                <ul className="space-y-3">
                  {reversedTimeline.map((item) => (
                    <li key={item.id} className="relative">
                      <span
                        className={`absolute -left-[9px] top-1 h-2 w-2 rounded-full ring-2 ring-white ${
                          item.isInitial ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                      />
                      <p className="text-sm font-medium text-gray-800">{item.text}</p>
                      {item.subtitle && (
                        <p className="mt-0.5 text-xs text-gray-600">{item.subtitle}</p>
                      )}
                      {item.detail && (
                        <p className="mt-0.5 text-[11px] text-gray-500">{item.detail}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-end border-t border-gray-200 bg-white px-5 py-3">
              <button
                onClick={() => setShowFullHistory(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Comments Modal */}
      {showAllComments && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0"
          onClick={() => setShowAllComments(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Todos los comentarios</h3>
              <button
                onClick={() => setShowAllComments(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
              <ul className="space-y-2">
                {comments.map((c) => {
                  const authorName = c.authorName || 'Usuario';
                  const createdAt = normalizeTimestamp(c.createdAt);
                  return (
                    <li key={c.id} className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-700">{authorName}</span>
                        {createdAt && (
                          <span className="text-[11px] text-gray-400">
                            {formatDate(createdAt)} a las {formatTime(createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{c.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="flex justify-end border-t border-gray-200 bg-white px-5 py-3">
              <button
                onClick={() => setShowAllComments(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nested Edit Modal */}
      {editing && isAdmin && (
        <EditIncidenceModal
          incidence={incidence}
          installation={installation}
          reporter={reporter ?? undefined}
          onClose={() => setEditing(false)}
          onSave={(original, payload) => {
            updateIncidence(original, payload);
            setEditing(false);
          }}
          isLoading={isUpdating}
        />
      )}
    </>
  );
}
