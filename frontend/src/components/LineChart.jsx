import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

/**
 * Enhanced Line Chart with dark theme and smooth animations
 */
export function LineChart({ data, highlightDate = null, height = 350 }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height });
    const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height
                });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [height]);

    // Render chart
    useEffect(() => {
        if (!data || !svgRef.current || dimensions.width === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const margin = { top: 30, right: 20, bottom: 50, left: 50 };
        const width = dimensions.width - margin.left - margin.right;
        const chartHeight = dimensions.height - margin.top - margin.bottom;
        const isMobile = dimensions.width < 500;

        const g = svg
            .attr('width', dimensions.width)
            .attr('height', dimensions.height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Parse dates
        const parseDate = d => new Date(d.date);
        const dailyData = data.daily_stats.map(d => ({
            ...d,
            dateObj: parseDate(d)
        }));

        // Scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(dailyData, d => d.dateObj))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([chartHeight, 0]);

        // Gradient definitions
        const defs = svg.append('defs');

        // Area gradient - light theme
        const areaGradient = defs.append('linearGradient')
            .attr('id', 'area-gradient-dark')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '0%').attr('y2', '100%');

        areaGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#1d4ed8')
            .attr('stop-opacity', 0.15);

        areaGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#1d4ed8')
            .attr('stop-opacity', 0);

        // Line gradient - blue
        const lineGradient = defs.append('linearGradient')
            .attr('id', 'line-gradient')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');

        lineGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#1d4ed8');

        lineGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#3b82f6');

        // Glow filter
        const filter = defs.append('filter')
            .attr('id', 'glow')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');

        filter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
            .attr('result', 'coloredBlur');

        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Gridlines - light theme
        g.append('g')
            .attr('class', 'grid')
            .selectAll('line')
            .data([-0.5, 0, 0.5])
            .join('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', 'rgba(0,0,0,0.08)')
            .attr('stroke-dasharray', '4,6');

        // Zero line
        g.append('line')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', yScale(0))
            .attr('y2', yScale(0))
            .attr('stroke', 'rgba(0,0,0,0.2)')
            .attr('stroke-width', 1);

        // Area
        const area = d3.area()
            .x(d => xScale(d.dateObj))
            .y0(yScale(0))
            .y1(d => yScale(d.moving_avg || d.avg_sentiment))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(dailyData)
            .attr('fill', 'url(#area-gradient-dark)')
            .attr('d', area)
            .attr('opacity', 0)
            .transition()
            .duration(1000)
            .attr('opacity', 1);

        // Moving average line with animation
        const movingLine = d3.line()
            .x(d => xScale(d.dateObj))
            .y(d => yScale(d.moving_avg || d.avg_sentiment))
            .curve(d3.curveMonotoneX);

        const path = g.append('path')
            .datum(dailyData)
            .attr('fill', 'none')
            .attr('stroke', 'url(#line-gradient)')
            .attr('stroke-width', 3)
            .attr('filter', 'url(#glow)')
            .attr('d', movingLine);

        // Animate line drawing
        const pathLength = path.node().getTotalLength();
        path
            .attr('stroke-dasharray', pathLength)
            .attr('stroke-dashoffset', pathLength)
            .transition()
            .duration(1500)
            .ease(d3.easeQuadOut)
            .attr('stroke-dashoffset', 0);

        // Data points with staggered animation
        g.selectAll('.day-point')
            .data(dailyData)
            .join('circle')
            .attr('class', 'day-point')
            .attr('cx', d => xScale(d.dateObj))
            .attr('cy', d => yScale(d.avg_sentiment))
            .attr('r', 0)
            .attr('fill', d => d.avg_sentiment > 0.2 ? '#22c55e' : d.avg_sentiment < -0.2 ? '#ef4444' : '#eab308')
            .attr('stroke', 'rgba(255,255,255,0.3)')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .transition()
            .delay((d, i) => 1000 + i * 50)
            .duration(400)
            .attr('r', isMobile ? 5 : 7)
            .on('end', function () {
                d3.select(this)
                    .on('mouseenter', function (event, d) {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr('r', isMobile ? 8 : 10)
                            .attr('stroke-width', 3);

                        const rect = containerRef.current.getBoundingClientRect();
                        setTooltip({
                            show: true,
                            x: Math.min(event.clientX - rect.left, dimensions.width - 150),
                            y: event.clientY - rect.top - 80,
                            content: d
                        });
                    })
                    .on('mouseleave', function () {
                        d3.select(this)
                            .transition()
                            .duration(200)
                            .attr('r', isMobile ? 5 : 7)
                            .attr('stroke-width', 2);
                        setTooltip({ show: false, x: 0, y: 0, content: null });
                    });
            });

        // X-axis
        const xAxis = d3.axisBottom(xScale)
            .ticks(isMobile ? 4 : Math.min(dailyData.length, 7))
            .tickFormat(d3.timeFormat(isMobile ? '%d' : '%b %d'));

        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(xAxis)
            .selectAll('text')
            .attr('fill', 'rgba(0,0,0,0.5)')
            .attr('font-size', '11px');

        g.selectAll('.domain').attr('stroke', 'rgba(0,0,0,0.1)');
        g.selectAll('.tick line').attr('stroke', 'rgba(0,0,0,0.1)');

        // Y-axis
        const yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(d => d > 0 ? `+${d}` : d);

        g.append('g')
            .call(yAxis)
            .selectAll('text')
            .attr('fill', 'rgba(0,0,0,0.5)')
            .attr('font-size', '11px');

        // Sentiment zone labels
        if (!isMobile) {
            g.append('text')
                .attr('x', 10)
                .attr('y', yScale(0.7))
                .attr('fill', '#22c55e')
                .attr('font-size', '10px')
                .attr('font-weight', '600')
                .attr('opacity', 0.7)
                .text('POSITIVE');

            g.append('text')
                .attr('x', 10)
                .attr('y', yScale(-0.7))
                .attr('fill', '#ef4444')
                .attr('font-size', '10px')
                .attr('font-weight', '600')
                .attr('opacity', 0.7)
                .text('NEGATIVE');
        }

    }, [data, dimensions, highlightDate]);

    return (
        <div ref={containerRef} className="chart-container relative">
            <svg ref={svgRef} className="w-full" />
            {tooltip.show && tooltip.content && (
                <div
                    className="chart-tooltip"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <div className="font-semibold text-white">
                        {new Date(tooltip.content.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="mt-1">
                        <span className="text-[var(--color-text-muted)]">Score: </span>
                        <span className={`font-bold ${tooltip.content.avg_sentiment > 0.2 ? 'text-[#22c55e]' :
                            tooltip.content.avg_sentiment < -0.2 ? 'text-[#ef4444]' :
                                'text-[#eab308]'
                            }`}>
                            {tooltip.content.avg_sentiment > 0 ? '+' : ''}{(tooltip.content.avg_sentiment * 100).toFixed(0)}
                        </span>
                    </div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                        {tooltip.content.article_count} articles analyzed
                    </div>
                    <div className="flex gap-2 mt-2 text-xs">
                        <span className="text-[#22c55e]">↑{tooltip.content.positive_count}</span>
                        <span className="text-[#ef4444]">↓{tooltip.content.negative_count}</span>
                        <span className="text-[#eab308]">→{tooltip.content.neutral_count}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LineChart;
