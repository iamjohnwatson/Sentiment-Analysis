import { useState, useEffect } from 'react';

/**
 * Custom hook to track scroll progress through a section
 * @param {React.RefObject} ref - Reference to the section element
 * @returns {{ progress: number, isVisible: boolean }}
 */
export function useScrollProgress(ref) {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (!ref.current) return;

            const rect = ref.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const elementHeight = rect.height;

            // Calculate how much of the element is visible
            const visibleTop = Math.max(0, -rect.top);
            const visibleBottom = Math.max(0, rect.bottom - windowHeight);
            const visibleHeight = elementHeight - visibleTop - visibleBottom;

            // Element is visible when any part is in viewport
            const visible = rect.top < windowHeight && rect.bottom > 0;
            setIsVisible(visible);

            // Calculate progress (0 to 1) based on scroll position
            if (visible) {
                const scrollProgress = Math.min(1, Math.max(0,
                    (windowHeight - rect.top) / (windowHeight + elementHeight)
                ));
                setProgress(scrollProgress);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial call

        return () => window.removeEventListener('scroll', handleScroll);
    }, [ref]);

    return { progress, isVisible };
}

export default useScrollProgress;
