'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { X, Send, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { useIncidenceDetail } from '../hooks/useIncidenceDetail';
import { useIncidenceHistory } from '../hooks/useIncidenceHistory';
import { useIncidenceComments } from '../hooks/useIncidenceComments';
import { useAddComment } from '../hooks/useAddComment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUsers } from '@/features/dashboard/hooks/useUsers';
import { useInstallations } from '@/features/dashboard/hooks/useInstallations';
import { useUpdateIncidence } from '@/features/dashboard/hooks/useUpdateIncidence';
import { useSendInvoiceEmail } from '../hooks/useSendInvoiceEmail';
import { useSendToContractor } from '../hooks/useSendToContractor';
import { useSendWhatsApp } from '../hooks/useSendWhatsApp';
import { useConformityAction } from '../hooks/useConformityAction';
import { PhotoUploader } from './PhotoUploader';
import { EditIncidenceModal } from '@/features/dashboard/components/EditIncidenceModal';
import { CommentPhotoDialog } from './CommentPhotoDialog';
import { ImageLightbox } from './ImageLightbox';
import { InvoiceDialog } from './InvoiceDialog';
import { SendToContractorModal } from './SendToContractorModal';
import { formatRelativeTime } from '@/lib/formatRelativeTime';
import { Timestamp, doc, collection, serverTimestamp, setDoc } from 'firebase/firestore';
import { getClientFirestore } from '@/lib/firebase';
import type { IncidenceHistory } from '@/types';
import {
  getPublicStatus,
  getPublicHistory,
  formatPublicHistoryEntry,
} from '../lib/incidenceVisibility';

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
  Reparado: 'bg-amber-100 text-amber-700',
  'A falta de presupuesto': 'bg-orange-100 text-orange-700',
  Presupuestado: 'bg-purple-100 text-purple-700',
  'Falta de material': 'bg-pink-100 text-pink-700',
  'A facturar': 'bg-green-100 text-green-800 border border-green-200',
  Facturada: 'bg-blue-100 text-blue-800 border border-blue-200',
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

function formatHistoryEntry(entry: IncidenceHistory, isAdmin: boolean): { title: string; subtitle?: string } | null {
  if (!isAdmin) {
    return formatPublicHistoryEntry(entry);
  }
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
  if (entry.changeType === 'conformity') {
    const action = entry.newValue === 'accepted' ? 'aceptó' : entry.newValue === 'rejected' ? 'rechazó' : 'actualizó';
    return { title: `${name} ${action} la reparación`, subtitle: entry.oldValue ? `Anterior: ${entry.oldValue}` : undefined };
  }
  if (entry.changeType === 'field') {
    if (entry.field === 'repairEvidenceImageUrls') {
      return { title: `${name} agregó imagen de evidencia de reparación` };
    }
    if (entry.field === 'repairEvidenceComment') {
      return { title: `${name} agregó comentario de cierre de reparación`, subtitle: entry.newValue ?? undefined };
    }
    if (entry.field === 'conformityImageUrls') {
      return { title: `${name} agregó evidencia de disconformidad` };
    }
    if (entry.field === 'conformityComment') {
      return { title: `${name} agregó comentario de disconformidad`, subtitle: entry.newValue ?? undefined };
    }
    if (entry.field === 'conformityReason') {
      return { title: `${name} indicó motivo de disconformidad`, subtitle: entry.newValue ?? undefined };
    }
    return { title: `${name} actualizó un campo`, subtitle: `"${entry.field ?? 'desconocido'}" : ${entry.oldValue ?? '-'} → ${entry.newValue ?? '-'}` };
  }
  if (entry.changeType === 'contractor') {
    const method = entry.contactMethod === 'whatsapp' ? 'WhatsApp' : 'email';
    return {
      title: `${name} envió incidencia a contratista`,
      subtitle: `${entry.contractorName} vía ${method}${entry.extraContext ? ` · ${entry.extraContext.slice(0, 60)}${entry.extraContext.length > 60 ? '...' : ''}` : ''}`,
    };
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
  const isReporter = user?.uid === incidence?.reportedBy;
  const showConformityPending = incidence?.status === 'Reparado' && incidence?.conformityStatus === 'pending' && isReporter;

  const { history, loading: historyLoading, error: historyError } = useIncidenceHistory(incidenceId);
  const { comments, loading: commentsLoading, error: commentsError } = useIncidenceComments(incidenceId);
  const { addComment, isLoading: addingComment, error: commentError, clearError: clearCommentError } = useAddComment();
  const { users } = useUsers();
  const { installations } = useInstallations();
  const { updateIncidence, isLoading: isUpdating } = useUpdateIncidence();
  const { sendInvoiceEmail } = useSendInvoiceEmail();
  const { sendContractorEmail } = useSendToContractor();
  const { sendWhatsApp } = useSendWhatsApp();

  const [editing, setEditing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [showConformityReject, setShowConformityReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [rejectPhotos, setRejectPhotos] = useState<File[]>([]);
  const [showCommentPhoto, setShowCommentPhoto] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [invoiceProcessing, setInvoiceProcessing] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showContractorDialog, setShowContractorDialog] = useState(false);
  const [contractorProcessing, setContractorProcessing] = useState(false);
  const [contractorResult, setContractorResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { acceptRepair, rejectRepair, isLoading: conformityLoading, error: conformityError } = useConformityAction();

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

  const handleSubmitComment = async (imageFile?: File, imageCaption?: string) => {
    if ((!commentText.trim() && !imageFile) || addingComment) return;
    clearCommentError();
    try {
      await addComment(incidenceId, commentText, imageFile, imageCaption);
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
  const displayStatus = isAdmin ? incidence.status : getPublicStatus(incidence.status);
  const statusStyle = STATUS_STYLES[incidence.status] ?? 'bg-gray-100 text-gray-700';

  const creatorEntry = history.find((h) => h.changeType === 'creation');
  const reporter = userMap.get(incidence.reportedBy);
  const reporterName = reporter?.displayName || reporter?.email || creatorEntry?.changedByName || 'Usuario desconocido';
  const reporterInitials = reporter?.displayName
    ? reporter.displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : reporter?.email?.slice(0, 2).toUpperCase()
    || (creatorEntry?.changedByName
      ? creatorEntry.changedByName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'U');

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
  const visibleHistory = isAdmin ? history : getPublicHistory(history);
  const timeline = visibleHistory.length > 0
    ? visibleHistory
        .map((h) => {
          const entry = formatHistoryEntry(h, isAdmin);
          if (!entry) return null;
          const d = normalizeTimestamp(h.timestamp);
          return {
            id: h.id,
            text: entry.title,
            subtitle: entry.subtitle,
            detail: d ? `${formatDate(d)} a las ${formatTime(d)}` : '',
            isInitial: h.changeType === 'creation',
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
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
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 pt-4 md:items-center md:pt-0">
        <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
          {/* Header */}
          <div className="bg-charcoal px-5 py-2">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-white">
                {incidence.title}
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyle}`}
                >
                  {displayStatus}
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${urgencyStyle}`}
                >
                  {urgencyLabel}
                </span>
                <button
                  onClick={onClose}
                  className="rounded-md p-1 text-blue-200 transition-colors hover:bg-charcoal-light hover:text-white"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="mt-0.5 text-xs text-blue-200">
              {location || 'Ubicación desconocida'} {reportedAt ? `• ${reportedAt}` : ''}
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-2">
            {(incidenceError || historyError || commentsError) && (
              <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="font-medium">Error al cargar la incidencia</p>
                <p className="mt-0.5 text-xs">
                  {incidenceError || historyError || commentsError}
                </p>
              </div>
            )}

            {/* Main 3-column layout */}
            <div className="grid gap-3 md:grid-cols-3">
              {/* LEFT COLUMN (2/3) */}
              <div className="space-y-3 md:col-span-2">
                {/* Description */}
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <h3 className="text-sm font-semibold text-gray-900">Descripción</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                    {incidence.description || 'Sin descripción'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="rounded-md bg-gray-100 px-2 py-1">
                      Categoría: {CATEGORY_LABELS[incidence.category] ?? incidence.category}
                    </span>
                    {isAdmin && (
                      <span className="rounded-md bg-gray-100 px-2 py-1">
                        Facturar a: {incidence.billTo}
                      </span>
                    )}
                    <span className="rounded-md bg-gray-100 px-2 py-1">
                      Severidad: {incidence.severity}/5
                    </span>
                  </div>
                </div>

                {/* Evidences row */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Visual Evidence */}
                  <div className="rounded-xl border border-gray-200 bg-white p-3">
                    <h3 className="text-sm font-semibold text-gray-900">Evidencia visual</h3>
                    {incidence.imageUrls.length === 0 ? (
                      <p className="mt-2 text-sm text-gray-400">No hay imágenes adjuntas</p>
                    ) : (
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {incidence.imageUrls.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => setLightboxSrc(url)}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 text-left"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={`Evidencia ${idx + 1}`}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Repair Evidence */}
                  {(incidence.repairEvidenceImageUrls && incidence.repairEvidenceImageUrls.length > 0) && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Evidencia de la reparación</h3>
                      {incidence.repairEvidenceComment && (
                        <p className="mt-1 text-xs text-gray-600">{incidence.repairEvidenceComment}</p>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {incidence.repairEvidenceImageUrls.map((url, idx) => (
                          <button
                            key={`repair-${idx}`}
                            onClick={() => setLightboxSrc(url)}
                            className="group relative aspect-square overflow-hidden rounded-lg border border-blue-200 bg-white text-left"
                          >
                            <Image
                              src={url}
                              alt={`Evidencia de reparación ${idx + 1}`}
                              width={200}
                              height={200}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="rounded-xl border border-gray-200 bg-white p-3">
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
                              {c.text && <p className="mt-1 text-sm text-gray-700">{c.text}</p>}
                              {c.imageUrl && (
                                <div className="mt-2">
                                  <button
                                    onClick={() => c.imageUrl && setLightboxSrc(c.imageUrl)}
                                    className="group relative inline-block overflow-hidden rounded-lg border border-gray-200 text-left"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={c.imageUrl}
                                      alt={c.imageCaption || 'Foto adjunta'}
                                      className="max-h-24 w-auto object-contain transition-transform group-hover:scale-105"
                                      loading="lazy"
                                    />
                                  </button>
                                  {c.imageCaption && (
                                    <p className="mt-1 text-xs italic text-gray-500">{c.imageCaption}</p>
                                  )}
                                </div>
                              )}
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

                  {/* Add Comment — disabled when billed */}
                  {incidence.status !== 'Facturada' && (
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
                              handleSubmitComment(undefined, undefined);
                            }
                          }}
                          placeholder="Escribe un comentario..."
                          rows={2}
                          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                        />
                        <button
                          onClick={() => handleSubmitComment(undefined, undefined)}
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
                        <button
                          onClick={() => setShowCommentPhoto(true)}
                          disabled={addingComment}
                          className="flex items-center justify-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          title="Adjuntar foto"
                        >
                          <ImageIcon className="h-4 w-4" />
                          <span className="hidden sm:inline">Foto</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN (1/3) */}
              <div className="space-y-3">
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

                {/* Conformity Section */}
                {showConformityPending && (
                  <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 shadow-sm">
                    <p className="text-xs text-amber-700">
                      ¿Confirmas que estás conforme con la reparación?
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await acceptRepair(incidence);
                          } catch {
                            // error surfaced via hook
                          }
                        }}
                        disabled={conformityLoading}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Sí, conforme
                      </button>
                      <button
                        onClick={() => setShowConformityReject(true)}
                        disabled={conformityLoading}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        No, rechazar
                      </button>
                    </div>
                    {conformityError && (
                      <p className="mt-1.5 text-xs text-red-600">{conformityError}</p>
                    )}
                  </div>
                )}

                {/* Rejected Conformity Info */}
                {incidence?.conformityStatus === 'rejected' && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <h3 className="text-sm font-semibold text-red-800">Reparación rechazada</h3>
                    {incidence.conformityReason && (
                      <p className="mt-1 text-xs text-red-700">
                        <strong>Motivo:</strong> {incidence.conformityReason}
                      </p>
                    )}
                    {incidence.conformityComment && (
                      <p className="mt-1 text-xs text-red-700">
                        <strong>Comentario:</strong> {incidence.conformityComment}
                      </p>
                    )}
                    {incidence.conformityImageUrls && incidence.conformityImageUrls.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {incidence.conformityImageUrls.map((url, idx) => (
                          <button key={idx} onClick={() => setLightboxSrc(url)} className="text-left">
                            <Image src={url} alt={`Evidencia ${idx + 1}`} width={200} height={80} className="h-20 w-full rounded-lg object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                              <p className="mt-0.5 break-words text-xs text-gray-600">{item.subtitle}</p>
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
            {isAdmin && incidence.status !== 'Facturada' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light"
                >
                  Cambiar estado
                </button>
                {(incidence.status === 'Reportada' || incidence.status === 'En reparación') && (
                  <button
                    onClick={() => setShowContractorDialog(true)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Enviar a contratista
                  </button>
                )}
                {incidence.status === 'A facturar' && !incidence.invoiceData && (
                  <button
                    onClick={() => setShowInvoiceDialog(true)}
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Facturar
                  </button>
                )}
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
                      {c.text && <p className="mt-1 text-sm text-gray-700">{c.text}</p>}
                      {c.imageUrl && (
                        <div className="mt-2">
                          <button
                            onClick={() => c.imageUrl && setLightboxSrc(c.imageUrl)}
                            className="group relative inline-block overflow-hidden rounded-lg border border-gray-200 text-left"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={c.imageUrl}
                              alt={c.imageCaption || 'Foto adjunta'}
                              className="max-h-24 w-auto object-contain transition-transform group-hover:scale-105"
                              loading="lazy"
                            />
                          </button>
                          {c.imageCaption && (
                            <p className="mt-1 text-xs italic text-gray-500">{c.imageCaption}</p>
                          )}
                        </div>
                      )}
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

      {/* Conformity Rejection Modal */}
      {showConformityReject && incidence && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10 md:items-center md:pt-0">
          <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
              <h3 className="text-lg font-semibold text-gray-900">Rechazar reparación</h3>
              <button
                onClick={() => {
                  setShowConformityReject(false);
                  setRejectReason('');
                  setRejectComment('');
                  setRejectPhotos([]);
                }}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {conformityError && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {conformityError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">
                  Motivo del rechajo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: La reparación no solucionó el problema"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">
                  Comentario adicional
                </label>
                <textarea
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  placeholder="Describe con más detalle qué no está conforme..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-charcoal outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-1">
                  Evidencia visual (opcional)
                </label>
                <PhotoUploader photos={rejectPhotos} onChange={setRejectPhotos} maxPhotos={3} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3">
              <button
                onClick={() => {
                  setShowConformityReject(false);
                  setRejectReason('');
                  setRejectComment('');
                  setRejectPhotos([]);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) return;
                  try {
                    await rejectRepair(incidence, {
                      reason: rejectReason,
                      comment: rejectComment,
                      imageFiles: rejectPhotos,
                    });
                    setShowConformityReject(false);
                    setRejectReason('');
                    setRejectComment('');
                    setRejectPhotos([]);
                  } catch {
                    // error surfaced via hook
                  }
                }}
                disabled={conformityLoading || !rejectReason.trim()}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {conformityLoading ? 'Enviando...' : 'Rechazar reparación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Photo Modal */}
      <CommentPhotoDialog
        open={showCommentPhoto}
        onClose={() => setShowCommentPhoto(false)}
        onConfirm={(file, caption) => {
          handleSubmitComment(file, caption);
          setShowCommentPhoto(false);
        }}
        isLoading={addingComment}
      />

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

      {/* Invoice Dialog */}
      {incidence && (
        <InvoiceDialog
          incidence={incidence}
          open={showInvoiceDialog}
          onClose={() => setShowInvoiceDialog(false)}
          onConfirm={async (payload) => {
            setInvoiceProcessing(true);
            setShowInvoiceDialog(false);
            try {
              await updateIncidence(incidence, {
                invoiceData: {
                  ...payload,
                  invoicedAt: Timestamp.now(),
                  invoicedBy: user?.uid ?? '',
                },
              });
              await sendInvoiceEmail({
                incidenceId: incidence.id,
                counterEmail: payload.counterEmail,
                counterName: payload.counterName,
                amount: payload.amount,
                concept: payload.concept,
              });
              setInvoiceResult({ type: 'success', message: 'Factura enviada correctamente al contador.' });
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Error al enviar la factura';
              setInvoiceResult({ type: 'error', message: msg });
            } finally {
              setInvoiceProcessing(false);
            }
          }}
          isLoading={isUpdating}
        />
      )}

      {/* Invoice Processing / Result Modal */}
      {(invoiceProcessing || invoiceResult) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 shadow-xl">
            {invoiceProcessing ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
                <p className="text-sm font-medium text-charcoal">Enviando factura...</p>
                <p className="text-xs text-gray-500">Por favor no cierres esta ventana</p>
              </div>
            ) : invoiceResult?.type === 'success' ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-charcoal">{invoiceResult.message}</p>
                <button
                  onClick={() => setInvoiceResult(null)}
                  className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light"
                >
                  Aceptar
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-charcoal">Error al enviar factura</p>
                <p className="text-xs text-red-600">{invoiceResult?.message}</p>
                <button
                  onClick={() => setInvoiceResult(null)}
                  className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contractor Dialog */}
      {incidence && (
        <SendToContractorModal
          incidence={incidence}
          open={showContractorDialog}
          onClose={() => setShowContractorDialog(false)}
          onConfirm={async (payload) => {
            setContractorProcessing(true);
            setShowContractorDialog(false);
            try {
              const images = payload.includeImages ? incidence.imageUrls : [];
              if (payload.contactMethod === 'email') {
                await sendContractorEmail({
                  incidenceId: incidence.id,
                  contractorId: payload.contractorId,
                  contractorEmail: payload.contractorEmail,
                  contractorName: payload.contractorName,
                  contractorPhone: payload.contractorPhone,
                  extraContext: payload.extraContext,
                  imageUrls: images,
                });
              } else {
                // WhatsApp: enviar via Twilio
                const messageLines = [
                  `Hola ${payload.contractorName},`,
                  '',
                  `Se te ha asignado una nueva incidencia: ${incidence.title}`,
                  `Descripción: ${incidence.description}`,
                  payload.extraContext ? `Contexto adicional: ${payload.extraContext}` : '',
                  images.length > 0 ? `Evidencias: ${images.join('\n')}` : '',
                ].filter(Boolean);
                await sendWhatsApp({
                  to: payload.contractorPhone,
                  body: messageLines.join('\n'),
                });

                const db = getClientFirestore();
                const historyRef = doc(collection(db, 'incidences', incidence.id, 'history'));
                await setDoc(historyRef, {
                  changedBy: user?.uid,
                  changedByName: user?.displayName || user?.email || 'Usuario',
                  changeType: 'contractor',
                  contractorId: payload.contractorId,
                  contractorName: payload.contractorName,
                  contractorEmail: payload.contractorEmail,
                  contractorPhone: payload.contractorPhone,
                  contactMethod: 'whatsapp',
                  extraContext: payload.extraContext || null,
                  timestamp: serverTimestamp(),
                });
              }
              setContractorResult({ type: 'success', message: payload.contactMethod === 'email' ? 'Email enviado correctamente al contratista.' : 'WhatsApp enviado correctamente al contratista.' });
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Error al enviar al contratista';
              setContractorResult({ type: 'error', message: msg });
            } finally {
              setContractorProcessing(false);
            }
          }}
          isLoading={contractorProcessing}
        />
      )}

      {/* Contractor Processing / Result Modal */}
      {(contractorProcessing || contractorResult) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 shadow-xl">
            {contractorProcessing ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand" />
                <p className="text-sm font-medium text-charcoal">Enviando a contratista...</p>
                <p className="text-xs text-gray-500">Por favor no cierres esta ventana</p>
              </div>
            ) : contractorResult?.type === 'success' ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-charcoal">{contractorResult.message}</p>
                <button
                  onClick={() => setContractorResult(null)}
                  className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light"
                >
                  Aceptar
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <p className="text-sm font-medium text-charcoal">Error al enviar a contratista</p>
                <p className="text-xs text-red-600">{contractorResult?.message}</p>
                <button
                  onClick={() => setContractorResult(null)}
                  className="rounded-md bg-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-light"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <ImageLightbox
        src={lightboxSrc ?? ''}
        open={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </>
  );
}
