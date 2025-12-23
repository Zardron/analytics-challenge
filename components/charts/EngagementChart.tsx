'use client';

import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Animated } from '@/components/ui/animated';
import { useDailyMetrics } from '@/lib/hooks';
import { useUIStore } from '@/lib/stores';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows, GridColumns } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Group } from '@visx/group';
import { TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { useTooltip } from '@visx/tooltip';
import { ParentSize } from '@visx/responsive';

interface EngagementChartProps {
  days?: number;
}

interface ChartDataPoint {
  date: Date;
  engagement: number;
}

interface TooltipData {
  date: string;
  engagement: number;
}

const defaultMargin = { top: 20, right: 20, bottom: 60, left: 70 };
const engagementColor = '#3b82f6';

function EngagementChartInner({
  width,
  height,
  days,
}: {
  width: number;
  height: number;
  days: number;
}) {
  const { chartViewType, setChartViewType } = useUIStore();
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: metrics, isLoading, error } = useDailyMetrics({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  });

  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<TooltipData>();

  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!metrics) return [];

    return metrics.map((metric) => ({
      date: new Date(metric.date),
      engagement: metric.engagement || 0,
    }));
  }, [metrics]);

  const margin = defaultMargin;
  // Ensure inner dimensions don't go negative
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  // Scales
  const dateScale = useMemo(
    () =>
      scaleTime({
        range: [0, innerWidth],
        domain: chartData.length > 0
          ? [
              new Date(Math.min(...chartData.map((d) => d.date.getTime()))),
              new Date(Math.max(...chartData.map((d) => d.date.getTime()))),
            ]
          : [startDate, endDate],
      }),
    [chartData, innerWidth, startDate, endDate]
  );

  const engagementScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [
          0,
          chartData.length > 0
            ? Math.max(...chartData.map((d) => d.engagement)) * 1.1
            : 1000,
        ],
        nice: true,
      }),
    [chartData, innerHeight]
  );


  const handleMouseMove = useCallback(
    (event: React.MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);
      if (!point || !chartData.length) return;

      const x = point.x - margin.left;
      const y = point.y - margin.top;
      
      // Clamp x to valid range
      const clampedX = Math.max(0, Math.min(x, innerWidth));
      const x0 = dateScale.invert(clampedX);
      
      // Find closest data point by date
      let closestIndex = 0;
      let minDistance = Infinity;
      
      chartData.forEach((d, index) => {
        const distance = Math.abs(d.date.getTime() - x0.getTime());
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      const closest = chartData[closestIndex];
      
      // Calculate tooltip position - center on the data point
      const tooltipX = dateScale(closest.date) + margin.left;
      // Position tooltip in the upper portion of the chart, ensuring it stays within bounds
      // Account for tooltip height (~100px) and add padding
      const tooltipHeight = 100;
      const tooltipY = Math.max(10, Math.min(margin.top + 30, height - tooltipHeight - 20));
      
      showTooltip({
        tooltipData: {
          date: closest.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          engagement: closest.engagement,
        },
        tooltipLeft: tooltipX,
        tooltipTop: tooltipY,
      });
    },
    [chartData, dateScale, engagementScale, margin, showTooltip, innerWidth, height]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive text-center">
            {error instanceof Error ? error.message : 'Failed to load engagement data'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Animated type="fadeInUp" delay={0.1}>
      <Card className="transition-shadow duration-300 hover:shadow-lg">
        <CardHeader>
          <Animated type="fadeIn" delay={0.2}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <TrendingUp className="h-5 w-5" />
                  </motion.div>
                  Engagement Trends
                </CardTitle>
                <CardDescription className="mt-1">
                  Engagement (likes + comments + shares) over the last {days} days
                </CardDescription>
              </div>
            <div className="inline-flex items-center rounded-lg border border-border p-1 bg-muted/50">
              <Button
                variant={chartViewType === 'line' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setChartViewType('line')}
              >
                Line Chart
              </Button>
              <Button
                variant={chartViewType === 'area' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3"
                onClick={() => setChartViewType('area')}
              >
                Area Chart
              </Button>
            </div>
          </div>
        </Animated>
        </CardHeader>
        <CardContent className="overflow-hidden">
        <Animated type="fadeIn" delay={0.3} className="w-full overflow-hidden" style={{ height: 400, position: 'relative' }}>
          <svg 
            width={width}
            height={height}
            style={{ 
              display: 'block', 
              overflow: 'hidden', 
              maxWidth: '100%', 
              height: '400px'
            }}
            overflow="hidden"
          >
            <defs>
              <clipPath id="chart-clip">
                <rect x="0" y="0" width={width} height={height} />
              </clipPath>
            </defs>
            <g clipPath="url(#chart-clip)">
              <Group left={margin.left} top={margin.top}>
              {/* Grid */}
              <GridRows
                scale={engagementScale}
                width={innerWidth}
                strokeDasharray="3,3"
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.15}
              />
              <GridColumns
                scale={dateScale}
                height={innerHeight}
                strokeDasharray="3,3"
                stroke="hsl(var(--muted-foreground))"
                strokeOpacity={0.15}
              />

              {/* Render based on chart type */}
              {chartViewType === 'area' ? (
                <>
                  <AreaClosed
                    data={chartData}
                    x={(d) => dateScale(d.date)}
                    y={(d) => engagementScale(d.engagement)}
                    yScale={engagementScale}
                    stroke="none"
                    fill={engagementColor}
                    fillOpacity={0.2}
                    curve={curveMonotoneX}
                  />
                  <LinePath
                    data={chartData}
                    x={(d) => dateScale(d.date)}
                    y={(d) => engagementScale(d.engagement)}
                    stroke={engagementColor}
                    strokeWidth={2.5}
                    curve={curveMonotoneX}
                  />
                </>
              ) : (
                <LinePath
                  data={chartData}
                  x={(d) => dateScale(d.date)}
                  y={(d) => engagementScale(d.engagement)}
                  stroke={engagementColor}
                  strokeWidth={2.5}
                  curve={curveMonotoneX}
                />
              )}

              {/* Tooltip indicator line and dot */}
              {tooltipOpen && tooltipData && tooltipLeft != null && chartData.length > 0 && (() => {
                const closestDateX = tooltipLeft - margin.left;
                // Find the data point for the tooltip
                const tooltipPoint = chartData.find(d => {
                  const x = dateScale(d.date);
                  return Math.abs(x - closestDateX) < 5;
                });
                
                if (!tooltipPoint) return null;
                
                return (
                  <>
                    {/* Vertical indicator line */}
                    <line
                      x1={closestDateX}
                      x2={closestDateX}
                      y1={0}
                      y2={innerHeight}
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={1.5}
                      strokeDasharray="4,4"
                      opacity={0.4}
                      pointerEvents="none"
                    />
                    {/* Engagement dot */}
                    <circle
                      cx={closestDateX}
                      cy={engagementScale(tooltipPoint.engagement)}
                      r={6}
                      fill={engagementColor}
                      stroke="white"
                      strokeWidth={2.5}
                      pointerEvents="none"
                    />
                  </>
                );
              })()}

              {/* X-axis */}
              <AxisBottom
                top={innerHeight}
                scale={dateScale}
                numTicks={width > 520 ? 10 : 5}
                stroke="hsl(var(--muted-foreground))"
                tickStroke="hsl(var(--muted-foreground))"
                tickFormat={(value) => {
                  const date = value as Date;
                  const day = date.getDate();
                  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
                  const monthLong = date.toLocaleDateString('en-US', { month: 'long' });
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                  
                  // Show month name if it's the first tick or start of a new month
                  const domain = dateScale.domain();
                  const isFirstTick = domain.length > 0 && Math.abs(date.getTime() - domain[0].getTime()) < 86400000; // within 1 day
                  const isFirstOfMonth = day === 1;
                  
                  if (isFirstOfMonth || (isFirstTick && day <= 5)) {
                    return monthLong;
                  }
                  
                  // Show day name and date (e.g., "Tue 25", "Dec 07")
                  return `${dayName} ${String(day).padStart(2, '0')}`;
                }}
                tickLabelProps={() => ({
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  textAnchor: 'middle',
                  dy: 4,
                })}
                label="Date"
                labelOffset={10}
                labelProps={{
                  fill: 'hsl(var(--foreground))',
                  fontSize: 12,
                  textAnchor: 'middle',
                }}
              />
              {/* Y-axis for Engagement */}
              <AxisLeft
                scale={engagementScale}
                stroke="hsl(var(--muted-foreground))"
                tickStroke="hsl(var(--muted-foreground))"
                tickLabelProps={() => ({
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  textAnchor: 'end',
                  dx: -10,
                })}
              />
              </Group>
            </g>

            {/* Invisible rect for mouse events */}
            <rect
              x={margin.left}
              y={margin.top}
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={hideTooltip}
            />
          </svg>

          {/* Tooltip - positioned absolutely within the relative container */}
          {tooltipOpen && tooltipData && tooltipLeft != null && tooltipTop != null && (
            <TooltipWithBounds
              top={tooltipTop}
              left={tooltipLeft}
              style={{
                ...defaultStyles,
                backgroundColor: 'white',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                padding: '10px 14px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                pointerEvents: 'none',
                zIndex: 1000,
                position: 'absolute',
              }}
              className="dark:bg-gray-900 dark:border-gray-700"
              offsetLeft={0}
              offsetTop={0}
            >
              <div className="space-y-2">
                <div className="font-semibold text-sm border-b pb-1">{tooltipData.date}</div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: engagementColor }}
                  />
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Engagement</div>
                    <div className="text-sm font-semibold">{tooltipData.engagement.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </TooltipWithBounds>
          )}
        </Animated>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: engagementColor }}
            />
            <span className="text-xs text-muted-foreground">Engagement (likes + comments + shares)</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </Animated>
  );
}

export function EngagementChart({ days = 30 }: EngagementChartProps) {
  return (
    <div className="w-full">
      <ParentSize debounceTime={10}>
        {({ width, height }) => {
          // Ensure width doesn't exceed container and accounts for padding
          const containerWidth = width ? Math.max(300, width) : 800;
          return (
            <EngagementChartInner 
              width={containerWidth}
              height={400} 
              days={days} 
            />
          );
        }}
      </ParentSize>
    </div>
  );
}

