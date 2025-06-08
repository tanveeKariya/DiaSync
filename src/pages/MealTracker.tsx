import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Search, Filter, FileDown, ChevronLeft, ChevronRight, Utensils, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { MEAL_TYPES } from '../config/constants';
import axios from 'axios';

interface FoodItem {
  name: string;
  carbs: number;
  protein?: number;
  fat?: number;
  calories?: number;
  glycemicIndex?: number;
  servingSize?: string;
  amount: number;
}

interface MealEntry {
  _id?: string;
  mealType: string;
  timestamp: string;
  foodItems: FoodItem[];
  totalCarbs: number;
  totalCalories?: number;
  notes?: string;
  preGlucose?: number;
  postGlucose?: number;
  insulinDose?: number;
}

interface MealFormData {
  mealType: string;
  timestamp: string;
  foodItems: FoodItem[];
  totalCarbs: number;
  totalCalories?: number;
  notes?: string;
  preGlucose?: number;
  postGlucose?: number;
  insulinDose?: number;
}

const MealTracker: React.FC = () => {
  const [isAddingMeal, setIsAddingMeal] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMealType, setFilterMealType] = useState('');
  const itemsPerPage = 10;

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<MealFormData>({
    defaultValues: {
      foodItems: [{ name: '', carbs: 0, protein: 0, fat: 0, calories: 0, amount: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'foodItems'
  });

  const watchedFoodItems = watch('foodItems');

  useEffect(() => {
    fetchMeals();
  }, [currentPage, searchTerm, filterMealType]);

  useEffect(() => {
    // Calculate total carbs and calories when food items change
    const totalCarbs = watchedFoodItems.reduce((sum, item) => sum + (item.carbs * item.amount || 0), 0);
    const totalCalories = watchedFoodItems.reduce((sum, item) => sum + (item.calories * item.amount || 0), 0);
    
    setValue('totalCarbs', totalCarbs);
    setValue('totalCalories', totalCalories);
  }, [watchedFoodItems, setValue]);

  const fetchMeals = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        mealType: filterMealType
      });

      const response = await axios.get(`/api/meals?${params}`);
      setMeals(response.data);
    } catch (error) {
      console.error('Error fetching meals:', error);
      setMeals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MealFormData) => {
    try {
      const mealData = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      };

      if (editingMeal) {
        await axios.put(`/api/meals/${editingMeal._id}`, mealData);
      } else {
        await axios.post('/api/meals', mealData);
      }

      await fetchMeals();
      setIsAddingMeal(false);
      setEditingMeal(null);
      reset({
        foodItems: [{ name: '', carbs: 0, protein: 0, fat: 0, calories: 0, amount: 1 }]
      });
    } catch (error) {
      console.error('Error saving meal:', error);
    }
  };

  const handleEdit = (meal: MealEntry) => {
    setEditingMeal(meal);
    setValue('mealType', meal.mealType);
    setValue('timestamp', format(new Date(meal.timestamp), "yyyy-MM-dd'T'HH:mm"));
    setValue('foodItems', meal.foodItems);
    setValue('totalCarbs', meal.totalCarbs);
    setValue('totalCalories', meal.totalCalories || 0);
    setValue('notes', meal.notes || '');
    setValue('preGlucose', meal.preGlucose || 0);
    setValue('postGlucose', meal.postGlucose || 0);
    setValue('insulinDose', meal.insulinDose || 0);
    setIsAddingMeal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await axios.delete(`/api/meals/${id}`);
        await fetchMeals();
      } catch (error) {
        console.error('Error deleting meal:', error);
      }
    }
  };

  const cancelForm = () => {
    setIsAddingMeal(false);
    setEditingMeal(null);
    reset({
      foodItems: [{ name: '', carbs: 0, protein: 0, fat: 0, calories: 0, amount: 1 }]
    });
  };

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = searchTerm === '' || 
      meal.foodItems.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      meal.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterMealType === '' || meal.mealType === filterMealType;
    
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredMeals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMeals = filteredMeals.slice(startIndex, startIndex + itemsPerPage);

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Meal Type,Total Carbs,Total Calories,Pre-Glucose,Post-Glucose,Insulin Dose,Notes\n" +
      meals.map(meal => {
        return `${format(new Date(meal.timestamp), 'yyyy-MM-dd HH:mm')},${meal.mealType},${meal.totalCarbs},${meal.totalCalories || ''},${meal.preGlucose || ''},${meal.postGlucose || ''},${meal.insulinDose || ''},"${meal.notes || ''}"`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `meal-log-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Utensils className="mr-2 text-teal-600" size={24} />
          Meal Tracker
        </h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsAddingMeal(true)}
        >
          Add Meal
        </Button>
      </div>

      {(isAddingMeal || editingMeal) && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingMeal ? 'Edit Meal' : 'Add New Meal'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meal Type
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-800"
                  {...register('mealType', { required: 'Meal type is required' })}
                >
                  {MEAL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Date & Time"
                type="datetime-local"
                {...register('timestamp')}
                defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">Food Items</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => append({ name: '', carbs: 0, protein: 0, fat: 0, calories: 0, amount: 1 })}
                >
                  Add Food
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                  <Input
                    label="Food Name"
                    {...register(`foodItems.${index}.name`, { required: 'Food name is required' })}
                    error={errors.foodItems?.[index]?.name?.message}
                  />
                  <Input
                    label="Carbs (g)"
                    type="number"
                    step="0.1"
                    {...register(`foodItems.${index}.carbs`, { required: 'Carbs are required' })}
                    error={errors.foodItems?.[index]?.carbs?.message}
                  />
                  <Input
                    label="Protein (g)"
                    type="number"
                    step="0.1"
                    {...register(`foodItems.${index}.protein`)}
                  />
                  <Input
                    label="Fat (g)"
                    type="number"
                    step="0.1"
                    {...register(`foodItems.${index}.fat`)}
                  />
                  <Input
                    label="Calories"
                    type="number"
                    {...register(`foodItems.${index}.calories`)}
                  />
                  <div className="flex items-end space-x-2">
                    <Input
                      label="Amount"
                      type="number"
                      step="0.1"
                      {...register(`foodItems.${index}.amount`)}
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-600"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Total Carbs (g)"
                type="number"
                {...register('totalCarbs')}
                readOnly
                className="bg-gray-50 dark:bg-gray-800"
              />

              <Input
                label="Total Calories"
                type="number"
                {...register('totalCalories')}
                readOnly
                className="bg-gray-50 dark:bg-gray-800"
              />

              <Input
                label="Pre-meal Glucose (optional)"
                type="number"
                {...register('preGlucose')}
              />

              <Input
                label="Post-meal Glucose (optional)"
                type="number"
                {...register('postGlucose')}
              />

              <Input
                label="Insulin Dose (optional)"
                type="number"
                step="0.5"
                {...register('insulinDose')}
              />

              <div className="md:col-span-2">
                <Input
                  label="Notes (optional)"
                  {...register('notes')}
                  multiline
                  rows={3}
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
                {editingMeal ? 'Update Meal' : 'Save Meal'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!isAddingMeal && !editingMeal && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search meals..."
                icon={<Search size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-800"
                value={filterMealType}
                onChange={(e) => setFilterMealType(e.target.value)}
              >
                <option value="">All Meals</option>
                {MEAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <Button
                variant="outline"
                icon={<FileDown size={16} />}
                onClick={exportData}
              >
                Export
              </Button>
            </div>
          </div>

          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : paginatedMeals.length > 0 ? (
              <div className="space-y-4">
                {paginatedMeals.map((meal) => (
                  <div key={meal._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {meal.mealType}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(meal.timestamp), 'PPpp')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit size={16} />}
                          onClick={() => handleEdit(meal)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDelete(meal._id!)}
                          className="text-red-500 hover:text-red-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Carbs</p>
                        <p className="text-lg font-semibold text-teal-600 dark:text-teal-400">
                          {meal.totalCarbs}g
                        </p>
                      </div>
                      {meal.totalCalories && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Calories</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {meal.totalCalories}
                          </p>
                        </div>
                      )}
                      {meal.insulinDose && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Insulin Dose</p>
                          <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                            {meal.insulinDose} units
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Food Items:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {meal.foodItems.map((item, index) => (
                          <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            {item.name} - {item.carbs}g carbs {item.amount > 1 && `(x${item.amount})`}
                          </div>
                        ))}
                      </div>
                    </div>

                    {(meal.preGlucose || meal.postGlucose) && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Glucose:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {meal.preGlucose && `Pre: ${meal.preGlucose} mg/dL`}
                          {meal.preGlucose && meal.postGlucose && ' → '}
                          {meal.postGlucose && `Post: ${meal.postGlucose} mg/dL`}
                        </p>
                      </div>
                    )}

                    {meal.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{meal.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No meals found. Add your first meal to get started!
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 mt-4">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">{startIndex + 1}</span>
                      {' '}-{' '}
                      <span className="font-medium">
                        {Math.min(startIndex + itemsPerPage, filteredMeals.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{filteredMeals.length}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button
                        variant="outline"
                        className="rounded-l-md"
                        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        icon={<ChevronLeft size={16} />}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-r-md"
                        onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        icon={<ChevronRight size={16} />}
                        iconPosition="right"
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default MealTracker;