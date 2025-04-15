"use client";

import { useEffect, useRef, useMemo } from 'react';
import { Box } from '@mui/material';
import { SalesChartData } from '@/services/apiDashboard';
import { formatCurrency } from '@/utils/actions';
import dayjs from 'dayjs';

interface SalesChartProps {
  data: SalesChartData[];
  period: 'daily' | 'weekly' | 'monthly';
}

const SalesChart = ({ data, period }: SalesChartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any | null>(null);

  // Format date for daily display
  const formatDailyDate = (dateString: string) => {
    const date = dayjs(dateString);
    return date.format('MMM D, YYYY');
  };

  // Format date for monthly display
  const formatMonthlyDate = (dateRange: string) => {
    // Extract month and year from the dateRange (e.g., "2025-02-01 - 2025-02-28")
    const month = dateRange.substring(5, 7);
    const year = dateRange.substring(0, 4);
    
    // Convert month number to month name
    const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
    
    return `${monthName} ${year}`;
  };

  // Format date range to display in a more readable format for weekly data
  const formatDateRange = (dateRange: string) => {
    const [start, end] = dateRange.split(' - ');
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    
    // If both dates are in the same month and year, show a simplified format
    if (startDate.month() === endDate.month() && startDate.year() === endDate.year()) {
      return `${startDate.format('MMM D')}-${endDate.format('D, YYYY')}`;
    }
    
    // If dates are in the same year but different months
    if (startDate.year() === endDate.year()) {
      return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    }
    
    // If dates are in different years
    return `${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`;
  };

  // Choose the appropriate label formatting based on the period
  const getFormattedLabels = () => {
    return data.map(item => {
      if (period === 'daily') {
        return formatDailyDate(item.dateRange);
      } else if (period === 'monthly') {
        return formatMonthlyDate(item.dateRange);
      } else {
        return formatDateRange(item.dateRange);
      }
    });
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const initChart = async () => {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        try {
          const ChartJS = await import('chart.js/auto');
          chartInstance.current = new ChartJS.default(ctx, {
            type: 'line',
            data: {
              labels: getFormattedLabels(),
              datasets: [
                {
                  label: 'Total Sales',
                  data: data.map(item => item.totalSales),
                  borderColor: '#2E9970',
                  backgroundColor: 'rgba(46, 153, 112, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y'
                },
                {
                  label: 'Orders Count',
                  data: data.map(item => item.ordersCount),
                  borderColor: '#3F51B5',
                  backgroundColor: 'rgba(63, 81, 181, 0.0)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointRadius: 3,
                  tension: 0.4,
                  yAxisID: 'y1'
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  align: 'end',
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: function(context) {
                      let label = context.dataset.label || '';
                      if (label) {
                        label += ': ';
                      }
                      if (context.datasetIndex === 0) {
                        // Use proper currency formatting for sales
                        label += formatCurrency(context.parsed.y);
                      } else {
                        // Show actual order count without scaling
                        label += context.parsed.y;
                      }
                      return label;
                    },
                    title: function(tooltipItems) {
                      // Find the original date range for this index
                      if (tooltipItems.length > 0) {
                        const index = tooltipItems[0].dataIndex;
                        return period === 'daily' ? data[index].date : data[index].dateRange;
                      }
                      return '';
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Revenue (£)'
                  },
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                  },
                  ticks: {
                    // Use proper currency formatting
                    callback: function(value) {
                      return formatCurrency(value as number).split('.')[0]; // Show without decimals for cleaner y-axis
                    }
                  }
                },
                y1: {
                  beginAtZero: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Orders'
                  },
                  grid: {
                    display: false
                  },
                  // Set min and max to create nice intervals
                  min: 0,
                  // Round up max value to the next multiple of 10
                  max: Math.ceil(Math.max(...data.map(item => item.ordersCount)) / 10) * 10,
                  ticks: {
                    // Show values in increments of 10
                    stepSize: 10,
                    precision: 0
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              }
            }
          });
        } catch (error) {
          console.error('Error initializing chart:', error);
        }
      }
    };

    initChart();

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, period]);

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <canvas ref={chartRef}></canvas>
    </Box>
  );
};

export default SalesChart; 