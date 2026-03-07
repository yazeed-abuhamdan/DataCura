import { useEffect, useRef } from 'react';

export interface MouseEventData {
    x: number;
    y: number;
    timestamp: number;
}

export interface ClickEventData {
    timestamp: number;
    type: string;
}

export interface ScrollEventData {
    amount: number;
    timestamp: number;
}

export interface BehavioralData {
    mouse_points: MouseEventData[];
    clicks: ClickEventData[];
    scrolls: ScrollEventData[];
    time_elapsed: number;
}

export function useMouseTracker() {
    const mousePoints = useRef<MouseEventData[]>([]);
    const clicks = useRef<ClickEventData[]>([]);
    const scrolls = useRef<ScrollEventData[]>([]);
    const startTime = useRef<number>(Date.now());
    const lastActivityTime = useRef<number>(Date.now());

    useEffect(() => {
        startTime.current = Date.now();
        lastActivityTime.current = Date.now();

        const handleMouseMove = (e: MouseEvent) => {
            lastActivityTime.current = Date.now();
            // Subsample mouse movement to reduce payload size (every 50ms)
            const currentTime = Date.now();
            const lastPoint = mousePoints.current[mousePoints.current.length - 1];
            if (!lastPoint || currentTime - lastPoint.timestamp > 50) {
                mousePoints.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: currentTime
                });
            }
        };

        const handleClick = (e: MouseEvent) => {
            lastActivityTime.current = Date.now();
            clicks.current.push({
                timestamp: Date.now(),
                type: e.type
            });
        };

        const handleScroll = (e: Event) => {
            lastActivityTime.current = Date.now();
            scrolls.current.push({
                amount: window.scrollY,
                timestamp: Date.now()
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const getBehavioralData = (): BehavioralData => {
        return {
            mouse_points: mousePoints.current,
            clicks: clicks.current,
            scrolls: scrolls.current,
            time_elapsed: Date.now() - startTime.current
        };
    };

    const resetTracker = () => {
        mousePoints.current = [];
        clicks.current = [];
        scrolls.current = [];
        startTime.current = Date.now();
        lastActivityTime.current = Date.now();
    };

    const isInactive = (timeoutMs = 60000) => {
        return Date.now() - lastActivityTime.current > timeoutMs;
    };

    return { getBehavioralData, resetTracker, isInactive };
}
