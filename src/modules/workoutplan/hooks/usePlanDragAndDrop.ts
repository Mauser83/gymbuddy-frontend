import {useRef, useCallback} from 'react';
import type {DragData} from 'shared/dragAndDrop/DraggableItem';
import {Layout} from 'shared/dragAndDrop/MeasureDraggableItem';

export function usePlanDragAndDrop() {
  const groupLayouts = useRef<Record<number, Layout>>({});
  const exerciseLayouts = useRef<Record<string, Layout>>({});

  const handleDragStart = useCallback((draggedData: DragData) => {
    // TODO: integrate drag start logic
  }, []);

  const handleDrop = useCallback(() => {
    // TODO: integrate drop logic
  }, []);

  return {
    groupLayouts,
    exerciseLayouts,
    handleDragStart,
    handleDrop,
  };
}
