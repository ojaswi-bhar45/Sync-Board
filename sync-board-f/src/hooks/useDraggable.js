import { useState, useRef } from 'react';

export function useDraggable(initialPosition, onDragEnd) {
  const [position, setPosition] = useState(initialPosition);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPosition = useRef(initialPosition);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'input') return;

    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const newPos = {
      left: e.clientX - dragStart.current.x,
      top: e.clientY - dragStart.current.y,
    };
    setPosition(newPos);
    lastPosition.current = newPos;
  };

  const onPointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    onDragEnd?.(lastPosition.current);
  };

  return {
    position,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    }
  };
}
