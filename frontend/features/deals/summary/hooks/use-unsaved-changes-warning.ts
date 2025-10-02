import { useEffect } from 'react';
import { useDealSelectors } from '../store';

export function useUnsavedChangesWarning() {
  const hasUnsavedChanges = useDealSelectors.useHasUnsavedChanges();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        );
        if (!confirmed) {
          // Prevent navigation
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    // Warn before page unload (refresh, close tab, etc.)
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Warn before navigation (back/forward buttons)
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);
}
