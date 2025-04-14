"use client";

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { TransactionChartData } from '@/services/apiDashboard';

interface TransactionChartProps {
  data: TransactionChartData[];
  period: 'daily' | 'weekly' | 'monthly';
}

const TransactionChart = ({ data, period }: TransactionChartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any | null>(null);

  // Format the dateRange for better display
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
              labels: data.map(item => formatDateRange(item.dateRange)),
              datasets: [
                {
                  label: 'Total Revenue',
                  data: data.map(item => item.totalRevenue),
                  borderColor: '#9C27B0',
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.3,
                  yAxisID: 'y'
                },
                {
                  label: 'Transaction Count',
                  data: data.map(item => item.transactionCount),
                  borderColor: '#FF9800',
                  backgroundColor: 'rgba(255, 152, 0, 0.0)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  pointBackgroundColor: '#FF9800',
                  pointRadius: 4,
                  fill: false,
                  tension: 0.2,
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
                        label += new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(context.parsed.y);
                      } else {
                        label += context.parsed.y;
                      }
                      return label;
                    },
                    title: function(tooltipItems) {
                      // Find the original date range for this index
                      if (tooltipItems.length > 0) {
                        const index = tooltipItems[0].dataIndex;
                        return data[index].dateRange;
                      }
                      return '';
                    }
                  }
                }
              },
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Revenue ($)'
                  },
                  grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Transactions'
                  },
                  grid: {
                    display: false
                  },
                  // Set min and max to create nice intervals in increments of 10
                  min: 0,
                  max: Math.ceil(Math.max(...data.map(item => item.transactionCount)) / 10) * 10,
                  ticks: {
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

export default TransactionChart; 