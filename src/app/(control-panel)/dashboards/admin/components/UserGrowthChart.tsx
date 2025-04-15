"use client";

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { UserGrowthChartData } from '@/services/apiDashboard';
import dayjs from 'dayjs';

interface UserGrowthChartProps {
  data: UserGrowthChartData[];
  period: 'daily' | 'weekly' | 'monthly';
}

const UserGrowthChart = ({ data, period }: UserGrowthChartProps) => {
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
    const parts = dateRange.split(' - ')[0].split('-');
    const year = parts[0];
    const month = parts[1];
    
    // Convert month number to month name
    const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
    
    return `${monthName} ${year}`;
  };

  // Format the dateRange for better display for weekly data
  const formatDateRange = (dateRange: string): string => {
    if (!dateRange) return "";
    
    // Split the range and take just the dates
    const [startDate, endDate] = dateRange.split(' - ');
    
    // Format start date
    const startParts = startDate.split('-');
    const startMonth = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2])).toLocaleString('default', { month: 'short' });
    const startDay = parseInt(startParts[2]);
    const startYear = parseInt(startParts[0]);
    
    // Format end date
    const endParts = endDate.split('-');
    const endMonth = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2])).toLocaleString('default', { month: 'short' });
    const endDay = parseInt(endParts[2]);
    const endYear = parseInt(endParts[0]);
    
    // If same month and year, return "Mar 10-16, 2023"
    // If different months but same year, return "Mar 10-Apr 16, 2023"
    // If different years, return "Mar 10, 2023-Apr 16, 2024"
    if (startYear === endYear) {
      return startMonth === endMonth 
        ? `${startMonth} ${startDay}-${endDay}, ${endYear}` 
        : `${startMonth} ${startDay}-${endMonth} ${endDay}, ${endYear}`;
    } else {
      return `${startMonth} ${startDay}, ${startYear}-${endMonth} ${endDay}, ${endYear}`;
    }
  };

  // Choose the appropriate label formatting based on the period
  const getFormattedLabels = () => {
    return data.map(item => {
      if (period === 'daily') {
        return formatDailyDate(item.date || item.dateRange);
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
            type: 'bar',
            data: {
              labels: getFormattedLabels(),
              datasets: [
                {
                  label: 'Admins',
                  data: data.map(item => item.admin),
                  backgroundColor: 'rgba(33, 150, 243, 0.7)',
                  borderColor: '#2196F3',
                  borderWidth: 1,
                  borderRadius: 4,
                  barThickness: 12,
                },
                {
                  label: 'Customers',
                  data: data.map(item => item.customer),
                  backgroundColor: 'rgba(76, 175, 80, 0.7)',
                  borderColor: '#4CAF50',
                  borderWidth: 1,
                  borderRadius: 4,
                  barThickness: 12,
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
                    text: 'Number of Users'
                  },
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                  },
                  ticks: {
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

export default UserGrowthChart; 