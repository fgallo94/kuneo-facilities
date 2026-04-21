'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { Incidence, Installation, User } from '@/types';
import { INCIDENCE_STATUSES } from '@/types';
import { IncidenceCard } from './IncidenceCard';
import { useIncidenceDetailContext } from '@/features/incidences/context/IncidenceDetailContext';

interface IncidenceKanbanBoardProps {
  incidences: Incidence[];
  installations: Installation[];
  users: User[];
  onUpdate: (original: Incidence, payload: Partial<Incidence>) => void;
  isUpdating?: boolean;
}

export function IncidenceKanbanBoard({
  incidences,
  installations,
  users,
  onUpdate,
}: IncidenceKanbanBoardProps) {
  const { openDetail } = useIncidenceDetailContext();
  const [localIncidences, setLocalIncidences] = useState<Incidence[]>(incidences);

  const installationMap = useMemo(
    () => new Map(installations.map((i) => [i.id, i])),
    [installations]
  );

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.uid, u])),
    [users]
  );

  useEffect(() => {
    setLocalIncidences(incidences);
  }, [incidences]);

  const columns = useMemo(() => {
    const map = new Map<string, Incidence[]>();
    INCIDENCE_STATUSES.forEach((status) => map.set(status, []));
    localIncidences.forEach((inc) => {
      const list = map.get(inc.status) || [];
      list.push(inc);
      map.set(inc.status, list);
    });
    return map;
  }, [localIncidences]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const sourceStatus = result.source.droppableId;
    const destStatus = result.destination.droppableId;
    if (sourceStatus === destStatus) return;

    const incidence = columns.get(sourceStatus)?.[result.source.index];
    if (!incidence) return;

    // Optimistic update para feedback visual inmediato
    setLocalIncidences((prev) =>
      prev.map((inc) =>
        inc.id === incidence.id
          ? { ...inc, status: destStatus as Incidence['status'] }
          : inc
      )
    );

    onUpdate(incidence, { status: destStatus as Incidence['status'] });
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex w-full gap-3 overflow-x-auto pb-4">
          {INCIDENCE_STATUSES.map((status) => {
            const items = columns.get(status) || [];
            return (
              <div
                key={status}
                className="flex min-w-[12rem] flex-1 flex-col rounded-xl border border-gray-200 bg-gray-50"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <h3 className="text-sm font-semibold text-charcoal">{status}</h3>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {items.length}
                  </span>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 px-2 pb-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-brand/5' : ''
                      }`}
                    >
                      {items.length === 0 ? (
                        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-gray-300">
                          <p className="text-xs text-gray-400">Sin incidencias</p>
                        </div>
                      ) : (
                        items.map((inc, index) => (
                          <Draggable key={inc.id} draggableId={inc.id} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={dragProvided.draggableProps.style}
                                className={dragSnapshot.isDragging ? 'opacity-90' : ''}
                              >
                                <IncidenceCard
                                  incidence={inc}
                                  installation={installationMap.get(inc.installationId)}
                                  reporter={userMap.get(inc.reportedBy)}
                                  onClick={() => openDetail(inc.id)}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>


    </>
  );
}
