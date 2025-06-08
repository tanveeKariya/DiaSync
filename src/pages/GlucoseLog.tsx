import React, { useState, useEffect, useRef } from 'react';
import { format, subDays, startOfToday, endOfToday, parseISO } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Plus, Download, Calendar, ArrowLeft, ArrowRight, Edit, Trash2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { GLUCOSE_COLORS, MEAL_CONTEXTS } from '../config/constants';
import { glucoseApi } from '../services/api';
import { useForm } from 'react-hook-form';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

interface GlucoseReading {
  _id?: string;
  value: number;
  timestamp: string;
  mealContext: string;
  readingType: string;
  feeling: string;
  notes?: string;
  tags?: string[];
}

interface GlucoseFormData {
  value: number;
  timestamp: string;
  mealContext: string;
  readingType: string;
  feeling: string;
  notes?: string;
  tags?: string;
}

const GlucoseLog: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [editingReading, setEditingReading] = useState<GlucoseReading | null>(null);
  const chartRef = useRef<any>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<GlucoseFormData>();

  useEffect(() => {
    fetchReadings();
  }, [selectedDate, timeRange]);

  const fetchReadings = async () => {
    try {
      setIsLoading(true);
      const startDate = timeRange === 'daily' 
        ? startOfToday() 
        : timeRange === 'weekly' 
          ? subDays(new Date(), 7)
          : subDays(new Date(), 30);
      
      const endDate = endOfToday();
      
      const response = await glucoseApi.getReadings({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      });
      
      setReadings(response.data);
    } catch (error) {
      console.error('Error fetching glucose readings:', error);
      setReadings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: GlucoseFormData) => {
    try {
      const readingData = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        unit: 'mg/dL'
      };

      if (editingReading) {
        await glucoseApi.updateReading(editingReading._id!, readingData);
      } else {
        await glucoseApi.addReading(readingData);
      }

      await fetchReadings();
      setIsAddingReading(false);
      setEditingReading(null);
      reset();
    } catch (error) {
      console.error('Error saving glucose reading:', error);
    }
  };
  

  const handleEdit = (reading: GlucoseReading) => {
    setEditingReading(reading);
    setValue('value', reading.value);
    setValue('timestamp', format(new Date(reading.timestamp), "yyyy-MM-dd'T'HH:mm"));
    setValue('mealContext', reading.mealContext);
    setValue('readingType', reading.readingType);
    setValue('feeling', reading.feeling);
    setValue('notes', reading.notes || '');
    setValue('tags', reading.tags?.join(', ') || '');
    setIsAddingReading(true);
  };

//    const handleDelete = async (id?: string): Promise<void> => {
//   if (!id) {
//     window.alert('Invalid reading ID. Please try again.');
//     return;
//   }

//   try {
//     const confirmDelete = window.confirm('Are you sure you want to delete this reading?');
//     if (!confirmDelete) return;

//     await glucoseApi.deleteReading(id);
//     await fetchReadings();
//     window.alert('Reading deleted successfully.');
//   } catch (error: unknown) {
//     const errorMsg =
//       (error as any)?.response?.data?.message ||
//       (error as Error)?.message ||
//       'An unexpected error occurred while deleting the reading.';

//     console.error('Error deleting glucose reading:', error);
//     window.alert(errorMsg);
//   }
// };

// In GlucoseLog.tsx

// ... (other imports and state) ...

   const handleDelete = async (id?: string): Promise<void> => {
    if (!id) {
      window.alert('Invalid reading ID. Please try again.');
      return;
    }

    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this reading?');
      if (!confirmDelete) return;

      await glucoseApi.deleteReading(id);
      await fetchReadings();
      window.alert('Reading deleted successfully.');
    } catch (error: unknown) {
      // Improved error handling to extract message from server response
      let errorMsg = 'An unexpected error occurred while deleting the reading.';

      // Use type guard to check if error is an AxiosError before accessing its properties
      if (typeof axios !== 'undefined' && axios.isAxiosError && axios.isAxiosError(error) && error.response) {
        // If the server sent a specific error message in the response body
        if (error.response.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
          errorMsg = (error.response.data as any).message;
        } else {
          // Fallback if no specific message in data, but we have a response status
          errorMsg = `Error: ${error.response.status} ${error.response.statusText || ''}. Please try again.`;
        }
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      console.error('Error deleting glucose reading:', error); // Log the full error object for debugging
      window.alert(errorMsg);
    }
  };

// ... (rest of your component) ...

  const targetMin = user?.targetGlucoseRange?.min || 70;
  const targetMax = user?.targetGlucoseRange?.max || 180;

  const getGlucoseColor = (value: number) => {
    if (value < targetMin - 20) return GLUCOSE_COLORS.VERY_LOW;
    if (value < targetMin) return GLUCOSE_COLORS.LOW;
    if (value <= targetMax) return GLUCOSE_COLORS.NORMAL;
    if (value <= targetMax + 50) return GLUCOSE_COLORS.HIGH;
    return GLUCOSE_COLORS.VERY_HIGH;
  };

  const chartData = {
    datasets: [{
      label: 'Glucose Level',
      data: readings.map(reading => ({
        x: new Date(reading.timestamp),
        y: reading.value
      })),
      borderColor: GLUCOSE_COLORS.NORMAL,
      backgroundColor: `${GLUCOSE_COLORS.NORMAL}20`,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: readings.map(r => getGlucoseColor(r.value)),
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: (timeRange === 'daily'
            ? 'hour'
            : timeRange === 'weekly'
            ? 'day'
            : 'week') as 'hour' | 'day' | 'week',
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM d',
            week: 'MMM d'
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        min: readings.length > 0 ? Math.min(targetMin - 30, Math.min(...readings.map(r => r.value)) - 10) : 50,
        max: readings.length > 0 ? Math.max(targetMax + 30, Math.max(...readings.map(r => r.value)) + 10) : 300,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const reading = readings[context.dataIndex];
            return [
              `Glucose: ${context.parsed.y} mg/dL`,
              `Time: ${format(new Date(reading.timestamp), 'HH:mm')}`,
              `Context: ${reading.mealContext}`,
              `Feeling: ${reading.feeling}`
            ];
          }
        }
      },
      legend: {
        display: false
      }
    }
  };

  const statistics = readings.length > 0 ? {
    average: Math.round(readings.reduce((acc, r) => acc + r.value, 0) / readings.length),
    min: Math.min(...readings.map(r => r.value)),
    max: Math.max(...readings.map(r => r.value)),
    inRange: readings.filter(r => r.value >= targetMin && r.value <= targetMax).length,
    total: readings.length
  } : {
    average: 0,
    min: 0,
    max: 0,
    inRange: 0,
    total: 0
  };

  const handleDateChange = (direction: 'prev' | 'next') => {
    const currentDate = parseISO(selectedDate);
    const newDate = direction === 'prev' 
      ? subDays(currentDate, timeRange === 'daily' ? 1 : timeRange === 'weekly' ? 7 : 30)
      : new Date(currentDate.setDate(currentDate.getDate() + (timeRange === 'daily' ? 1 : timeRange === 'weekly' ? 7 : 30)));
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Time,Glucose (mg/dL),Context,Reading Type,Feeling,Notes\n" +
      readings.map(reading => {
        const date = new Date(reading.timestamp);
        return `${format(date, 'yyyy-MM-dd')},${format(date, 'HH:mm')},${reading.value},${reading.mealContext},${reading.readingType},${reading.feeling},"${reading.notes || ''}"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `glucose-readings-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cancelForm = () => {
    setIsAddingReading(false);
    setEditingReading(null);
    reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Glucose Monitor</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            icon={<Download size={16} />}
            onClick={exportData}
          >
            Export
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setIsAddingReading(true)}
          >
            Add Reading
          </Button>
        </div>
      </div>

      {(isAddingReading || editingReading) && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingReading ? 'Edit Reading' : 'Add New Reading'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<X size={16} />}
              onClick={cancelForm}
            />
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Glucose Value (mg/dL)"
                type="number"
                {...register('value', { 
                  required: 'Glucose value is required',
                  min: { value: 20, message: 'Value must be at least 20' },
                  max: { value: 600, message: 'Value must be less than 600' }
                })}
                error={errors.value?.message}
              />

              <Input
                label="Date & Time"
                type="datetime-local"
                {...register('timestamp')}
                defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meal Context
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-gray-800"
                  {...register('mealContext', { required: 'Meal context is required' })}
                >
                  {MEAL_CONTEXTS.map(context => (
                    <option key={context} value={context}>{context}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reading Type
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-gray-800"
                  {...register('readingType', { required: 'Reading type is required' })}
                >
                  <option value="Manual">Manual</option>
                  <option value="CGM">CGM</option>
                  <option value="Lab">Lab</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  How do you feel?
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-gray-800"
                  {...register('feeling', { required: 'Feeling is required' })}
                >
                  <option value="Very Low">Very Low</option>
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Very High">Very High</option>
                  <option value="Not Specified">Not Specified</option>
                </select>
              </div>

              <Input
                label="Tags (comma-separated)"
                {...register('tags')}
                placeholder="e.g., exercise, stress, sick"
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-sky-500 focus:ring-sky-500 dark:bg-gray-800"
                  rows={3}
                  {...register('notes')}
                  placeholder="Add any notes here"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                {editingReading ? 'Update Reading' : 'Save Reading'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={() => handleDateChange('prev')}
            />
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-gray-500" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight size={16} />}
              onClick={() => handleDateChange('next')}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={timeRange === 'daily' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('daily')}
            >
              Daily
            </Button>
            <Button
              variant={timeRange === 'weekly' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={timeRange === 'monthly' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('monthly')}
            >
              Monthly
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-sky-50 dark:bg-sky-900/30 border border-sky-100 dark:border-sky-800">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
              <p className="text-2xl font-bold" style={{ color: getGlucoseColor(statistics.average) }}>
                {statistics.average} mg/dL
              </p>
            </div>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">In Range</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {statistics.total > 0 ? Math.round((statistics.inRange / statistics.total) * 100) : 0}%
              </p>
            </div>
          </Card>
          
          <Card className="bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Lowest</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {statistics.min || 0} mg/dL
              </p>
            </div>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Highest</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {statistics.max || 0} mg/dL
              </p>
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          </div>
        ) : readings.length > 0 ? (
          <div className="h-[400px] relative">
            <Line ref={chartRef} data={chartData} options={chartOptions} />
            <div className="absolute inset-0 pointer-events-none">
              <div 
                className="h-full bg-green-100/20 dark:bg-green-900/20"
                style={{
                  position: 'absolute',
                  top: `${(1 - (targetMax - targetMin) / (chartOptions.scales.y.max - chartOptions.scales.y.min)) * 100}%`,
                  height: `${((targetMax - targetMin) / (chartOptions.scales.y.max - chartOptions.scales.y.min)) * 100}%`,
                  width: '100%'
                }}
              />
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            No glucose readings found. Add your first reading to get started!
          </div>
        )}

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Reading History</h3>
          <div className="space-y-2">
            {readings.length > 0 ? readings.slice(-10).reverse().map((reading, index) => (
              <div 
                key={reading._id || index}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(reading.timestamp), 'MMM d, yyyy HH:mm')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reading.mealContext} • {reading.readingType} • Feeling: {reading.feeling}
                      </p>
                      {reading.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          {reading.notes}
                        </p>
                      )}
                      {reading.tags && reading.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reading.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <p 
                        className="text-lg font-semibold"
                        style={{ color: getGlucoseColor(reading.value) }}
                      >
                        {reading.value} mg/dL
                      </p>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={<Edit size={14} />}
                          onClick={() => handleEdit(reading)}
                        />
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleDelete(reading._id!)}
                          className="text-red-500 hover:text-red-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No readings found. Add your first glucose reading to get started!
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GlucoseLog;