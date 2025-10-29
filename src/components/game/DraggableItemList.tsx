import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  id: string;
  name: string;
}

interface DraggableItemListProps {
  items: Item[];
  onReorder: (items: Item[]) => void;
  disabled?: boolean;
  showPosition?: boolean;
}

function SortableItem({ item, index, disabled }: { item: Item; index: number; disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-4 bg-muted rounded-lg transition-colors',
        !disabled && 'cursor-move hover:bg-muted/80',
        isDragging && 'opacity-50 z-50'
      )}
      {...attributes}
      {...listeners}
    >
      {!disabled && <GripVertical className="w-5 h-5 text-muted-foreground" />}
      <span className="text-2xl font-bold text-primary">{index + 1}</span>
      <span className="text-lg font-semibold flex-1">{item.name}</span>
    </div>
  );
}

export const DraggableItemList = ({ 
  items, 
  onReorder, 
  disabled = false,
  showPosition = true 
}: DraggableItemListProps) => {
  const [localItems, setLocalItems] = useState(items);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localItems.findIndex((item) => item.id === active.id);
      const newIndex = localItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(localItems, oldIndex, newIndex);
      setLocalItems(newItems);
      onReorder(newItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localItems.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
        disabled={disabled}
      >
        <div className="space-y-3">
          {localItems.map((item, index) => (
            <SortableItem
              key={item.id}
              item={item}
              index={index}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
