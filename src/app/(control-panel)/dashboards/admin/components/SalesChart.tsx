"use client";

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { SalesChartData } from '@/services/apiDashboard';

interface SalesChartProps {
  data: SalesChartData[];
  period: 'daily' | 'weekly' | 'monthly';
}

const SalesChart = ({ data, period }: SalesChartProps) => {
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
                  label: 'Total Sales',
                  data: data.map(item => item.totalSales),
                  borderColor: '#2E9970',
                  backgroundColor: 'rgba(46, 153, 112, 0.1)',
                  borderWidth: 2,
                  fill: true,
                  tension: 0.4
                },
                {
                  label: 'Orders Count',
                  data: data.map(item => item.ordersCount * 10), // Multiply to scale appropriately
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
                        label += new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(context.parsed.y);
                      } else {
                        label += Math.round(context.parsed.y / 10);
                      }
                      return label;
                    }
                  }
                }
              },
              scales: {
                y: {
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
                  beginAtZero: true,
                  position: 'right',
                  title: {
                    display: true,
                    text: 'Orders'
                  },
                  grid: {
                    display: false
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
    <Box sx={{ height: 300, position: 'relative' }}>
      <canvas ref={chartRef}></canvas>
    </Box>
  );
};

export default SalesChart; 