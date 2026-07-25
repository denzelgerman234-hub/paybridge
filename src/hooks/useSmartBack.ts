import { To, useNavigate } from 'react-router-dom';

export function useSmartBack(fallback: To = '/dashboard') {
  const navigate = useNavigate();

  return () => {
    const historyState = window.history.state as { idx?: number } | null;

    if (typeof historyState?.idx === 'number' && historyState.idx > 0) {
      navigate(-1);
      return;
    }

    navigate(fallback, { replace: true });
  };
}
