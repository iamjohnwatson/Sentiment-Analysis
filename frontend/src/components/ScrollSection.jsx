import { useInView } from 'react-intersection-observer';

/**
 * Scroll Section wrapper with animations
 */
export function ScrollSection({
    children,
    id,
    className = '',
    onVisible = () => { },
    threshold = 0.2
}) {
    const { ref, inView } = useInView({
        threshold,
        triggerOnce: false
    });

    // Notify when section becomes visible
    if (inView) {
        onVisible(id);
    }

    return (
        <section
            ref={ref}
            id={id}
            className={`scroll-section ${inView ? 'is-visible' : ''} ${className}`}
        >
            <div className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                {children}
            </div>
        </section>
    );
}

/**
 * Narrative text block with icon
 */
export function NarrativeBlock({ title, children, icon }) {
    return (
        <div className="max-w-2xl mx-auto mb-10 text-center sm:text-left">
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-4">
                {icon && <span className="text-2xl">{icon}</span>}
                <h2 className="headline-serif headline-medium text-[var(--color-text-primary)]">
                    {title}
                </h2>
            </div>
            <div className="text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
                {children}
            </div>
        </div>
    );
}

/**
 * Stat card with icon and glass effect
 */
export function StatCard({ value, label, icon, trend, trendLabel }) {
    const isPositive = trend > 0;
    const isNegative = trend < 0;

    return (
        <div className="card-glass p-4 sm:p-6 text-center interactive-card">
            {icon && (
                <div className="text-2xl sm:text-3xl mb-2">{icon}</div>
            )}
            <div className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-1">
                {value}
            </div>
            <div className="text-xs sm:text-sm text-[var(--color-text-muted)] uppercase tracking-wider">
                {label}
            </div>
            {trend !== undefined && (
                <div className={`text-sm font-medium mt-2 ${isPositive ? 'text-[#22c55e]' :
                        isNegative ? 'text-[#ef4444]' :
                            'text-[#eab308]'
                    }`}>
                    {isPositive ? '↑' : isNegative ? '↓' : '→'} {trendLabel}
                </div>
            )}
        </div>
    );
}

/**
 * Section divider with gradient line
 */
export function SectionDivider({ label }) {
    return (
        <div className="container-wide">
            <div className="section-divider"></div>
        </div>
    );
}

export default ScrollSection;
