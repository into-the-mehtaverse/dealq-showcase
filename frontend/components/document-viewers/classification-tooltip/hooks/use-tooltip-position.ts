import { useState, useRef, useEffect, useCallback } from 'react';

interface UseTooltipPositionProps {
  onPageNavigate: (pageNumber: number) => void;
}

export const useTooltipPosition = ({ onPageNavigate }: UseTooltipPositionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsHovered(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle hover and click
  const handleTriggerInteraction = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleTriggerClick = useCallback(() => {
    setIsOpen(!isOpen);
    setIsHovered(false);
  }, [isOpen]);

  const handlePageClick = useCallback((pageNumber: number) => {
    onPageNavigate(pageNumber);
    setIsOpen(false);
    setIsHovered(false);
  }, [onPageNavigate]);

  const shouldShowTooltip = isOpen || isHovered;

  return {
    isOpen,
    isHovered,
    tooltipRef,
    triggerRef,
    shouldShowTooltip,
    handleTriggerInteraction,
    handleTriggerClick,
    handlePageClick
  };
};
