import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

/**
 * Source Chart - Horizontal bar chart that works well with any number of sources
 */
export function BubbleChart({ data, height = 420 }) {
    const svgRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height });

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

        const sourceData = data.source_stats || [];
        if (sourceData.length === 0) return;

        const isMobile = dimensions.width < 500;
        const margin = { top: 30, right: 60, bottom: 30, left: isMobile ? 80 : 140 };
        const width = dimensions.width - margin.left - margin.right;

        // Dynamic height based on number of sources
        const barHeight = 50;
        const chartHeight = Math.max(200, sourceData.length * barHeight);

        // Update SVG height
        svg.attr('height', chartHeight + margin.top + margin.bottom);

        const g = svg
            .attr('width', dimensions.width)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Defs for gradients
        const defs = svg.append('defs');

        // Gradient for positive bars
        const positiveGradient = defs.append('linearGradient')
            .attr('id', 'bar-positive')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');

        positiveGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#22c55e');

        positiveGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#10b981');

        // Gradient for negative bars
        const negativeGradient = defs.append('linearGradient')
            .attr('id', 'bar-negative')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');

        negativeGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#ef4444');

        negativeGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#dc2626');

        // Gradient for neutral bars
        const neutralGradient = defs.append('linearGradient')
            .attr('id', 'bar-neutral')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%');

        neutralGradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', '#eab308');

        neutralGradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', '#f59e0b');

        // Scales
        const xScale = d3.scaleLinear()
            .domain([-1, 1])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(sourceData.map(d => d.source))
            .range([0, chartHeight])
            .padding(0.35);

        // Center line (zero) - light theme
        g.append('line')
            .attr('x1', xScale(0))
            .attr('x2', xScale(0))
            .attr('y1', 0)
            .attr('y2', chartHeight)
            .attr('stroke', 'rgba(0,0,0,0.15)')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4');

        // Background zones
        g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', xScale(0))
            .attr('height', chartHeight)
            .attr('fill', 'rgba(239, 68, 68, 0.05)')
            .attr('rx', 4);

        g.append('rect')
            .attr('x', xScale(0))
            .attr('y', 0)
            .attr('width', width - xScale(0))
            .attr('height', chartHeight)
            .attr('fill', 'rgba(34, 197, 94, 0.05)')
            .attr('rx', 4);

        // Zone labels
        g.append('text')
            .attr('x', xScale(-0.5))
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#ef4444')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('opacity', 0.8)
            .text('NEGATIVE');

        g.append('text')
            .attr('x', xScale(0.5))
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#22c55e')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('opacity', 0.8)
            .text('POSITIVE');

        // Bars
        const bars = g.selectAll('.bar-group')
            .data(sourceData)
            .join('g')
            .attr('class', 'bar-group');

        // Source labels on Y axis - light theme
        bars.append('text')
            .attr('x', -10)
            .attr('y', d => yScale(d.source) + yScale.bandwidth() / 2)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .attr('fill', 'rgba(0,0,0,0.8)')
            .attr('font-size', isMobile ? '11px' : '13px')
            .attr('font-weight', '500')
            .text(d => {
                const maxLen = isMobile ? 10 : 18;
                return d.source.length > maxLen ? d.source.substring(0, maxLen) + '…' : d.source;
            });

        // Article count badge
        bars.append('text')
            .attr('x', -10)
            .attr('y', d => yScale(d.source) + yScale.bandwidth() / 2 + 14)
            .attr('text-anchor', 'end')
            .attr('fill', 'rgba(0,0,0,0.4)')
            .attr('font-size', '10px')
            .text(d => `${d.article_count} articles`);

        // Animated bars
        bars.append('rect')
            .attr('x', d => d.avg_sentiment >= 0 ? xScale(0) : xScale(0))
            .attr('y', d => yScale(d.source))
            .attr('width', 0)
            .attr('height', yScale.bandwidth())
            .attr('fill', d => {
                if (d.avg_sentiment > 0.2) return 'url(#bar-positive)';
                if (d.avg_sentiment < -0.2) return 'url(#bar-negative)';
                return 'url(#bar-neutral)';
            })
            .attr('rx', 6)
            .attr('opacity', 0.9)
            .transition()
            .delay((d, i) => i * 100)
            .duration(800)
            .ease(d3.easeElasticOut.amplitude(1).period(0.5))
            .attr('x', d => d.avg_sentiment >= 0 ? xScale(0) : xScale(d.avg_sentiment))
            .attr('width', d => Math.abs(xScale(d.avg_sentiment) - xScale(0)));

        // Score labels - positioned at the end of bars, outside
        bars.append('text')
            .attr('x', d => {
                // Position at the end of the bar (outside)
                if (d.avg_sentiment >= 0) {
                    return xScale(d.avg_sentiment) + 8; // Right of positive bar
                } else {
                    return xScale(d.avg_sentiment) - 8; // Left of negative bar
                }
            })
            .attr('y', d => yScale(d.source) + yScale.bandwidth() / 2)
            .attr('text-anchor', d => d.avg_sentiment >= 0 ? 'start' : 'end')
            .attr('dominant-baseline', 'middle')
            .attr('fill', d => {
                if (d.avg_sentiment > 0.1) return '#059669'; // Green for positive
                if (d.avg_sentiment < -0.1) return '#dc2626'; // Red for negative
                return '#57534e'; // Gray for neutral
            })
            .attr('font-size', '13px')
            .attr('font-weight', '600')
            .attr('opacity', 0)
            .text(d => (d.avg_sentiment > 0 ? '+' : '') + (d.avg_sentiment * 100).toFixed(0))
            .transition()
            .delay((d, i) => 800 + i * 100)
            .duration(300)
            .attr('opacity', 1);

    }, [data, dimensions]);

    // Calculate dynamic height for container
    const sourceCount = data?.source_stats?.length || 3;
    const containerHeight = Math.max(250, sourceCount * 50 + 60);

    return (
        <div ref={containerRef} className="chart-container relative" style={{ minHeight: containerHeight }}>
            <svg ref={svgRef} className="w-full" />
        </div>
    );
}

export default BubbleChart;
