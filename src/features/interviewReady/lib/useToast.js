import { useState, useCallback } from 'react';
export function useToastState() {
    const [toasts, setToasts] = useState([]);
    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const push = useCallback((kind, title, message) => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, kind, title, message }]);
        return id;
    }, []);
    return { toasts, dismiss, push };
}
