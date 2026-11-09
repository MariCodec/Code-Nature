
import { useRef, useState, useEffect } from "react";

export const useResizable = (min = 40, max = 60) => {
  const [dividerPosition, setDividerPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
      if (newPosition > min && newPosition < max)
        setDividerPosition(newPosition);
    };
    const stop = () => {
      isResizing.current = false;
      setIsOverlayVisible(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stop);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", stop);
    };
  }, [min, max]);

  const startResizing = () => {
    isResizing.current = true;
    setIsOverlayVisible(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return { containerRef, dividerPosition, startResizing, isOverlayVisible };
};
