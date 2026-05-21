import { useState, useRef, useEffect } from 'react';

export function useDraggable(initialPosition) {
  const [position, setPosition] = useState(initialPosition);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const onPointerDown = (e) => {
    // Only drag if left click
    if (e.button !== 0) return;
    
    // Don't drag if clicking inside an input or textarea
    if (e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'input') {
      return;
    }

    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    setPosition({
      left: e.clientX - dragStart.current.x,
      top: e.clientY - dragStart.current.y,
    });
  };

  const onPointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
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
