"use client";

import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { TransactionChartData } from '@/services/apiDashboard';
import { formatCurrency } from '@/utils/actions';
import dayjs from 'dayjs';

interface TransactionChartProps {
  data: TransactionChartData[];
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
}

const TransactionChart = ({ data, period }: TransactionChartProps) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<any | null>(null);

  const formatDailyDate = (dateString: string) => dayjs(dateString).format('MMM D, YYYY');

  const formatMonthlyDate = (dateRange: string) => {
    const parts = dateRange.split(' - ')[0].split('-');
    const year = parts[0];
    const month = parts[1];
    const monthName = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1).toLocaleString('default', { month: 'long' });
    return `${monthName} ${year}`;
  };

  const formatYearlyDate = (dateRange: string) => dayjs(dateRange).format('YYYY');

  const formatDateRange = (dateRange: string): string => {
    if (!dateRange) return "";
    const [start, end] = dateRange.split(' - ');
    const startDate = dayjs(start);
    const endDate = dayjs(end);
    if (startDate.isSame(endDate, 'year')) {
      return startDate.isSame(endDate, 'month')
        ? `${startDate.format('MMM D')}-${endDate.format('D, YYYY')}`
        : `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    }
    return `${startDate.format('MMM D, YYYY')} - ${endDate.format('MMM D, YYYY')}`;
  };

  const getFormattedLabels = () => {
    return data.map(item => {
      switch (period) {
        case 'daily':
          return formatDailyDate(item.date || item.dateRange);
        case 'monthly':
          return formatMonthlyDate(item.dateRange);
        case 'yearly':
          return formatYearlyDate(item.dateRange);
        default:
          return formatDateRange(item.dateRange);
      }
    });
  };

  useEffect(() => {
    if (!chartRef.current) return;
    let chart: any = null;

    const initChart = async () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current?.getContext('2d');
      if (ctx) {
        try {
          const ChartJS = await import('chart.js/auto');
          chart = new ChartJS.default(ctx, {
            type: 'line',
            data: {
              labels: getFormattedLabels(),
              datasets: [
                {
                  label: 'Total Revenue',
                  data: data.map(item => item.totalRevenue),
                  borderColor: '#FF9800',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  fill: true,
                  tension: 0.4,
                  yAxisID: 'y',
                },
                {
                  label: 'Transactions',
                  data: data.map(item => item.transactionCount),
                  borderColor: '#9C27B0',
                  borderDash: [5, 5],
                  fill: false,
                  tension: 0.4,
                  yAxisID: 'y1',
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', align: 'end' },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  callbacks: {
                    label: (context) => {
                      let label = context.dataset.label || '';
                      if (label) label += ': ';
                      if (context.datasetIndex === 0) {
                        label += formatCurrency(context.parsed.y);
                      } else {
                        label += context.parsed.y;
                      }
                      return label;
                    },
                    title: (tooltipItems) => {
                      if (tooltipItems.length > 0) {
                        const index = tooltipItems[0].dataIndex;
                        return period === 'daily' ? data[index].date : data[index].dateRange;
                      }
                      return '';
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Revenue (£)' },
                  ticks: {
                    callback: (value) => formatCurrency(value as number).split('.')[0],
                  },
                },
                y1: {
                  beginAtZero: true,
                  position: 'right',
                  title: { display: true, text: 'Transactions' },
                  grid: { display: false },
                  ticks: { precision: 0 },
                },
              },
            },
          });
          chartInstance.current = chart;
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