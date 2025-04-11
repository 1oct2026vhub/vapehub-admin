"use client";

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { UserGrowthChartData } from '@/services/apiDashboard';

interface UserGrowthChartProps {
  data: UserGrowthChartData[];
  period: 'daily' | 'weekly' | 'monthly';
}

const UserGrowthChart = ({ data, period }: UserGrowthChartProps) => {
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
            type: 'bar',
            data: {
              labels: data.map(item => item.date),
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
    <Box sx={{ height: 300, position: 'relative' }}>
      <canvas ref={chartRef}></canvas>
    </Box>
  );
};

export default UserGrowthChart; 