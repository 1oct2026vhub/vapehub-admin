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
              labels: data.map(item => item.date),
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

export default TransactionChart; 