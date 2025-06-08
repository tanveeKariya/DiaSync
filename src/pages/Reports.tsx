// C:\Users\tanve\Downloads\project-bolt-sb1-onne9y7q\project\src\pages\Reports.tsx

import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { BarChart3, Download, Calendar, Activity, Brain, FileText } from 'lucide-react';
import { reportsApi } from '../services/api'; // Assuming you have reportsApi in api.ts
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// --- IMPORTANT: Chart.js Imports and Registration ---
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler // For area charts (fill: true)
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
// --- END IMPORTANT ---

import { CHART_COLORS } from '../config/constants'; // Ensure this path is correct

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register Filler for filled line charts
);

interface ReportData {
  glucoseStats: {
    average: number;
    min: number;
    max: number;
    inRangePercentage: number;
    readings: Array<{
      value: number;
      timestamp: string;
    }>;
  };
  insulinStats: {
    totalDoses: number;
    averageDose: number;
    doses: Array<{
      units: number;
      timestamp: string;
    }>;
  };
  mealStats: {
    averageCarbs: number;
    meals: Array<{
      totalCarbs: number;
      timestamp: string;
    }>;
  };
  wellnessStats: {
    averageStress: number;
    averageSleep: number;
    moodDistribution: {
      [key: string]: number;
    };
  };
}

const Reports: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('glucose');

  // Using useCallback for fetchReportData to prevent unnecessary re-renders in useEffect
  const fetchReportData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await reportsApi.getOverview({
        startDate: startOfDay(new Date(dateRange.start)).toISOString(),
        endDate: endOfDay(new Date(dateRange.end)).toISOString()
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      // Optionally handle error state here
      setReportData(null); // Clear data on error
      alert('Failed to fetch report data. Please try again.'); // User-friendly message
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]); // Dependency array for useCallback

  // Fetch report data whenever dateRange changes
  useEffect(() => {
    fetchReportData();
  }, [dateRange, fetchReportData]); // Add fetchReportData to dependency array

  const exportReport = async () => {
    try {
      // Use reportsApi.exportData as defined in api.ts
      // Ensure the backend endpoint expects query parameters for dates
      const response = await reportsApi.exportData('pdf', {
        startDate: dateRange.start, // Send as yyyy-MM-dd
        endDate: dateRange.end // Send as yyyy-MM-dd
      });

      // Check if the response is a valid Blob (file)
      if (response.data && response.data instanceof Blob) {
        const url = window.URL.createObjectURL(response.data); // Use response.data directly
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `diabetes-report-${dateRange.start}-to-${dateRange.end}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url); // Clean up the object URL
      } else {
        // This case indicates backend might not be sending a file/blob
        console.error('Unexpected response data for export:', response.data);
        alert('Failed to export report: Invalid file data received.');
      }
    } catch (error: any) { // Catch more specific error types if possible
      console.error('Error exporting report:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        alert(`Failed to export report: ${error.response.status} - ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        alert('Failed to export report: No response from server. Check your network.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        alert('Failed to export report: Could not send request.');
      }
    }
  };

  // Helper to format date labels for charts
  const getChartLabels = (dataArray: Array<{ timestamp: string }>) => {
    // This will likely show too much detail if timestamps are very close.
    // Consider aggregating data by day or hour on the backend if needed for readability.
    return dataArray.map(item => format(new Date(item.timestamp), 'MMM d, h:mm a'));
  };

  const glucoseChartData = {
    labels: reportData?.glucoseStats.readings.length
      ? getChartLabels(reportData.glucoseStats.readings)
      : [],
    datasets: [{
      label: 'Glucose Level',
      data: reportData?.glucoseStats.readings.map(reading => reading.value) || [],
      borderColor: CHART_COLORS.PRIMARY,
      backgroundColor: `${CHART_COLORS.PRIMARY}20`, // Semi-transparent fill
      fill: true,
      tension: 0.4
    }]
  };

  const insulinChartData = {
    labels: reportData?.insulinStats.doses.length
      ? getChartLabels(reportData.insulinStats.doses)
      : [],
    datasets: [{
      label: 'Insulin Units',
      data: reportData?.insulinStats.doses.map(dose => dose.units) || [],
      backgroundColor: CHART_COLORS.SECONDARY,
      borderColor: CHART_COLORS.SECONDARY,
      borderWidth: 1
    }]
  };

  const mealChartData = {
    labels: reportData?.mealStats.meals.length
      ? getChartLabels(reportData.mealStats.meals)
      : [],
    datasets: [{
      label: 'Carbohydrates (g)',
      data: reportData?.mealStats.meals.map(meal => meal.totalCarbs) || [],
      backgroundColor: CHART_COLORS.ACCENT,
      borderColor: CHART_COLORS.ACCENT,
      borderWidth: 1
    }]
  };

  const moodChartData = {
    labels: Object.keys(reportData?.wellnessStats.moodDistribution || {}),
    datasets: [{
      label: 'Mood Distribution',
      data: Object.values(reportData?.wellnessStats.moodDistribution || {}),
      backgroundColor: [
        CHART_COLORS.SUCCESS,
        CHART_COLORS.PRIMARY,
        CHART_COLORS.WARNING,
        CHART_COLORS.ERROR,
        CHART_COLORS.GRAY
      ],
      borderColor: [
        CHART_COLORS.SUCCESS,
        CHART_COLORS.PRIMARY,
        CHART_COLORS.WARNING,
        CHART_COLORS.ERROR,
        CHART_COLORS.GRAY
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'rgb(107, 114, 128)'
        }
      },
      title: {
        display: false,
        text: 'Chart Title'
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)'
        },
        ticks: {
          color: 'rgb(107, 114, 128)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: 'rgb(107, 114, 128)'
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="mr-2 text-purple-600" size={24} />
          Reports & Analytics
        </h1>
        <Button
          variant="primary"
          icon={<Download size={16} />}
          onClick={exportReport}
          // Disable button while loading or if no report data to export
          disabled={isLoading || !reportData || !reportData.glucoseStats || reportData.glucoseStats.readings.length === 0}
        >
          Export Report
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full sm:w-auto">
            <Input
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              fullWidth
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <Input
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              fullWidth
            />
          </div>
        </div>
      </Card>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Glucose</h3>
            <Activity className="text-sky-600 dark:text-sky-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            {reportData?.glucoseStats.average !== undefined && reportData.glucoseStats.average !== null
              ? reportData.glucoseStats.average.toFixed(1)
              : 'N/A'} mg/dL
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Range: {reportData?.glucoseStats.min !== undefined && reportData.glucoseStats.min !== null ? reportData.glucoseStats.min : 'N/A'} - {reportData?.glucoseStats.max !== undefined && reportData.glucoseStats.max !== null ? reportData.glucoseStats.max : 'N/A'} mg/dL
          </p>
        </Card>

        <Card className="bg-teal-50 dark:bg-teal-900/30 border border-teal-100 dark:border-teal-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Time in Range</h3>
            <Calendar className="text-teal-600 dark:text-teal-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {reportData?.glucoseStats.inRangePercentage !== undefined && reportData.glucoseStats.inRangePercentage !== null
              ? reportData.glucoseStats.inRangePercentage.toFixed(1)
              : 'N/A'}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Target: 70-180 mg/dL
          </p>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-900/30 border border-orange-100 dark:border-orange-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Carbs</h3>
            <Brain className="text-orange-600 dark:text-orange-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {reportData?.mealStats.averageCarbs !== undefined && reportData.mealStats.averageCarbs !== null
              ? reportData.mealStats.averageCarbs.toFixed(1)
              : 'N/A'}g
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Per meal average
          </p>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Insulin Usage</h3>
            <FileText className="text-purple-600 dark:text-purple-400" size={20} />
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {reportData?.insulinStats.averageDose !== undefined && reportData.insulinStats.averageDose !== null
              ? reportData.insulinStats.averageDose.toFixed(1)
              : 'N/A'} units
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Average daily dose
          </p>
        </Card>
      </div>

      {/* Tabs for detailed reports */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'glucose'
              ? 'border-b-2 border-sky-600 text-sky-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('glucose')}
        >
          Glucose Trends
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'insulin'
              ? 'border-b-2 border-sky-600 text-sky-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('insulin')}
        >
          Insulin Usage
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'meals'
              ? 'border-b-2 border-sky-600 text-sky-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('meals')}
        >
          Meal Analysis
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'wellness'
              ? 'border-b-2 border-sky-600 text-sky-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('wellness')}
        >
          Wellness Metrics
        </button>
      </div>

      {isLoading ? (
        <Card>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          </div>
        </Card>
      ) : (
        <>
          {activeTab === 'glucose' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Glucose Trends
              </h3>
              <div className="h-64">
                {reportData?.glucoseStats.readings && reportData.glucoseStats.readings.length > 0 ? (
                  <Line data={glucoseChartData} options={chartOptions} />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No glucose data available for the selected date range.
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'insulin' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Insulin Usage
              </h3>
              <div className="h-64">
                {(reportData?.insulinStats.doses?.length ?? 0) > 0 ? (
                  <Bar data={insulinChartData} options={chartOptions} />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No insulin data available for the selected date range.
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'meals' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Carbohydrate Intake
              </h3>
              <div className="h-64">
                {reportData?.mealStats.meals && reportData.mealStats.meals.length > 0 ? (
                  <Bar data={mealChartData} options={chartOptions} />
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No meal data available for the selected date range.
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'wellness' && (
            <div className="space-y-4">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Mood Distribution
                </h3>
                <div className="h-64">
                  {reportData?.wellnessStats.moodDistribution &&
                    Object.keys(reportData.wellnessStats.moodDistribution).length > 0 ? (
                    <Bar data={moodChartData} options={chartOptions} />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      No mood data available for the selected date range.
                    </div>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Sleep Patterns
                  </h3>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                      {reportData?.wellnessStats.averageSleep !== undefined && reportData.wellnessStats.averageSleep !== null
                        ? reportData.wellnessStats.averageSleep.toFixed(1)
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Average hours of sleep
                    </p>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Stress Levels
                  </h3>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {reportData?.wellnessStats.averageStress !== undefined && reportData.wellnessStats.averageStress !== null
                        ? `${reportData.wellnessStats.averageStress.toFixed(1)}/10`
                        : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Average stress level
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;