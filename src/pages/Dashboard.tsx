import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet as DropletHalf, Utensils, Syringe, BookText, BarChart3, ChevronRight, PlusCircle, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { GLUCOSE_COLORS, DATE_FORMATS, CHART_COLORS } from '../config/constants';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { glucoseApi, mealApi, insulinApi, journalApi } from '../services/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    glucoseReadings: [],
    meals: [],
    insulinDoses: [],
    journalEntries: [],
    glucoseStats: {
      average: 0,
      min: 0,
      max: 0,
      inRangePercentage: 0,
      belowRangePercentage: 0,
      aboveRangePercentage: 0
    }
  });

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        const [glucoseResponse, mealsResponse, insulinResponse, journalResponse] = await Promise.all([
          glucoseApi.getReadings({ limit: 50 }),
          mealApi.getMeals({ limit: 10 }),
          insulinApi.getDoses({ limit: 10 }),
          journalApi.getEntries({ limit: 5 })
        ]);

        const readings = glucoseResponse.data || [];
        const targetMin = user?.targetGlucoseRange?.min || 70;
        const targetMax = user?.targetGlucoseRange?.max || 180;

        // Calculate glucose statistics
        let glucoseStats = {
          average: 0,
          min: 0,
          max: 0,
          inRangePercentage: 0,
          belowRangePercentage: 0,
          aboveRangePercentage: 0
        };

        if (readings.length > 0) {
          const values = readings.map((r: any) => r.value);
          const average = values.reduce((a: number, b: number) => a + b, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          
          const inRange = readings.filter((r: any) => r.value >= targetMin && r.value <= targetMax).length;
          const belowRange = readings.filter((r: any) => r.value < targetMin).length;
          const aboveRange = readings.filter((r: any) => r.value > targetMax).length;
          
          glucoseStats = {
            average: Math.round(average),
            min,
            max,
            inRangePercentage: Math.round((inRange / readings.length) * 100),
            belowRangePercentage: Math.round((belowRange / readings.length) * 100),
            aboveRangePercentage: Math.round((aboveRange / readings.length) * 100)
          };
        }

        setDashboardData({
          glucoseReadings: readings,
          meals: mealsResponse.data || [],
          insulinDoses: insulinResponse.data || [],
          journalEntries: journalResponse.data || [],
          glucoseStats
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Helper function to get color based on glucose value
  const getGlucoseColor = (value: number) => {
    const targetMin = user?.targetGlucoseRange?.min || 70;
    const targetMax = user?.targetGlucoseRange?.max || 180;
    
    if (value < targetMin - 20) return GLUCOSE_COLORS.VERY_LOW;
    if (value < targetMin) return GLUCOSE_COLORS.LOW;
    if (value <= targetMax) return GLUCOSE_COLORS.NORMAL;
    if (value <= targetMax + 50) return GLUCOSE_COLORS.HIGH;
    return GLUCOSE_COLORS.VERY_HIGH;
  };

  // Chart data for glucose readings
  const glucoseChartData = {
    labels: dashboardData.glucoseReadings.slice(-20).map((reading: any) => 
      format(new Date(reading.timestamp), 'MMM d, h:mm a')
    ),
    datasets: [
      {
        label: 'Glucose Level',
        data: dashboardData.glucoseReadings.slice(-20).map((reading: any) => reading.value),
        borderColor: CHART_COLORS.PRIMARY,
        backgroundColor: `${CHART_COLORS.PRIMARY}20`,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: CHART_COLORS.PRIMARY,
        fill: true,
        tension: 0.3
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#64748b'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: '#64748b'
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button 
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => navigate('/glucose')}
        >
          Add Reading
        </Button>
      </div>

      {/* Glucose Overview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <DropletHalf className="mr-2 text-sky-600" size={20} />
            Glucose Overview
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            icon={<ChevronRight size={16} />}
            iconPosition="right"
            onClick={() => navigate('/glucose')}
          >
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card className="bg-sky-50 dark:bg-sky-950 border border-sky-100 dark:border-sky-900">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
              <p className="text-2xl font-bold" style={{ color: getGlucoseColor(dashboardData.glucoseStats.average) }}>
                {dashboardData.glucoseStats.average} mg/dL
              </p>
            </div>
          </Card>
          
          <Card className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-900">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">In Range</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {dashboardData.glucoseStats.inRangePercentage}%
              </p>
            </div>
          </Card>
          
          <Card className="bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Below Range</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {dashboardData.glucoseStats.belowRangePercentage}%
              </p>
            </div>
          </Card>
          
          <Card className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Above Range</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {dashboardData.glucoseStats.aboveRangePercentage}%
              </p>
            </div>
          </Card>
        </div>

        {dashboardData.glucoseReadings.length > 0 ? (
          <Card className="h-64">
            <Line data={glucoseChartData} options={chartOptions} />
          </Card>
        ) : (
          <Card>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No glucose readings yet. Add your first reading to see your trends!
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Latest Readings</h3>
              <Button 
                variant="ghost" 
                size="xs"
                onClick={() => navigate('/glucose')}
              >
                Add New
              </Button>
            </div>
            
            <div className="space-y-3">
              {dashboardData.glucoseReadings.length > 0 ? (
                dashboardData.glucoseReadings.slice(-3).reverse().map((reading: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(reading.timestamp), DATE_FORMATS.FULL)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {reading.mealContext}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: getGlucoseColor(reading.value) }}>
                        {reading.value} mg/dL
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No readings yet
                </div>
              )}
            </div>
          </Card>
          
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Meals</h3>
              <Button 
                variant="ghost" 
                size="xs"
                onClick={() => navigate('/meals')}
              >
                Add New
              </Button>
            </div>
            
            <div className="space-y-3">
              {dashboardData.meals.length > 0 ? (
                dashboardData.meals.slice(0, 3).map((meal: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {meal.mealType}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {format(new Date(meal.timestamp), DATE_FORMATS.FULL)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-teal-600 dark:text-teal-400">
                        {meal.totalCarbs}g carbs
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No meals yet
                </div>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <CalendarClock className="mr-2 text-sky-600" size={20} />
            Recent Activity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Insulin Doses */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <Syringe className="mr-2 text-orange-600 dark:text-orange-500" size={16} />
                Insulin Doses
              </h3>
              <Button 
                variant="ghost" 
                size="xs"
                onClick={() => navigate('/insulin')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {dashboardData.insulinDoses.length > 0 ? (
                dashboardData.insulinDoses.slice(0, 3).map((dose: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {dose.insulinType}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {format(new Date(dose.timestamp), DATE_FORMATS.FULL)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-orange-600 dark:text-orange-400">
                        {dose.units} units
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No insulin doses yet
                </div>
              )}
            </div>
          </Card>

          {/* Journal Entries */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <BookText className="mr-2 text-indigo-600 dark:text-indigo-500" size={16} />
                Journal Entries
              </h3>
              <Button 
                variant="ghost" 
                size="xs"
                onClick={() => navigate('/journal')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {dashboardData.journalEntries.length > 0 ? (
                dashboardData.journalEntries.slice(0, 3).map((entry: any, index: number) => (
                  <div key={index} className="p-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(new Date(entry.date), DATE_FORMATS.DATE_ONLY)}
                      </p>
                      <p className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {entry.mood}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {entry.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No journal entries yet
                </div>
              )}
            </div>
          </Card>

          {/* Reports & Resources */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="mr-2 text-purple-600 dark:text-purple-500" size={16} />
                Reports & Resources
              </h3>
              <Button 
                variant="ghost" 
                size="xs"
                onClick={() => navigate('/reports')}
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/reports')}
              >
                Generate Monthly Report
              </Button>
              
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/reports')}
              >
                Export Data for Doctor
              </Button>
              
              <div className="p-3 bg-sky-50 dark:bg-sky-950 rounded-md mt-3">
                <h4 className="text-sm font-medium text-sky-800 dark:text-sky-300 mb-1">Tip of the Day</h4>
                <p className="text-xs text-sky-700 dark:text-sky-400">
                  Regular finger stick checks are still important, even if you use CGM. They provide calibration points and backup readings.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;