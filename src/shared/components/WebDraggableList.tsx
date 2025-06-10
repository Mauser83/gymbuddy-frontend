// WebDraggableList.tsx (Corrected)
import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
// We no longer need to import View from 'react-native' for this component

// This is the individual draggable item
function SortableItem(props: { id: any; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: props.id});

  // This is a React.CSSProperties object, compatible with a <div>
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Make item semi-transparent while dragging
  };

  // --- THIS IS THE FIX ---
  // Change the <View> to a <div>.
  // The 'ref' from dnd-kit is now compatible.
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.children}
    </div>
  );
}


// This is the main list component for the web
export function WebDraggableList({ data, onDragEnd, renderItem, keyExtractor }: any) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a small movement before a drag starts, to allow for clicks
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const handleDragEnd = (event: any) => {
    const {active, over} = event;
    if (!over) return; // Dropped outside of a valid target

    if (active.id !== over.id) {
      const oldIndex = data.findIndex((item: any) => keyExtractor(item, oldIndex) === active.id);
      const newIndex = data.findIndex((item: any) => keyExtractor(item, newIndex) === over.id);
      
      onDragEnd({ data: arrayMove(data, oldIndex, newIndex) });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={data.map((item: any, index: number) => keyExtractor(item, index))} 
        strategy={verticalListSortingStrategy}
      >
        {data.map((item: any, index: number) => (
          <SortableItem key={keyExtractor(item, index)} id={keyExtractor(item, index)}>
            {/* The content inside is still your React Native component, which is fine! */}
            {renderItem({ item, index, drag: () => {}, isActive: false })}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}