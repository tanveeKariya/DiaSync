// MealTracker.tsx

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Search, Filter, FileDown, ChevronLeft, ChevronRight, Utensils, Edit, Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { MEAL_TYPES } from '../config/constants';
import { mealApi } from '../services/api'; // Import mealApi

interface FoodItem {
  name: string;
  carbs: number;
  protein?: number;
  fat?: number;
  calories?: number;
  glycemicIndex?: number; // Added as it was in initial FoodItem, but not used in UI yet
  servingSize?: string; // Added as it was in initial FoodItem, but not used in UI yet
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

// Interface for form data (might be slightly different from MealEntry due to calculation/optional fields)
interface MealFormData {
  mealType: string;
  timestamp: string;
  foodItems: FoodItem[];
  totalCarbs: number; // Will be calculated
  totalCalories?: number; // Will be calculated
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
  const [totalMealsCount, setTotalMealsCount] = useState(0); // To handle pagination correctly from backend
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const itemsPerPage = 10;

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<MealFormData>({
    defaultValues: {
      mealType: MEAL_TYPES[0], // Default to first meal type
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"), // Default to current time
      foodItems: [{ name: '', carbs: 0, protein: 0, fat: 0, calories: 0, amount: 1 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'foodItems'
  });

  const watchedFoodItems = watch('foodItems'); // Watch for changes in food items to calculate totals

  // Effect to fetch meals when pagination, search, or filter changes
  useEffect(() => {
    fetchMeals();
  }, [currentPage, searchTerm, filterMealType]);

  // Effect to calculate totals when food items change in the form
  useEffect(() => {
    // *** MODIFIED CALCULATION LOGIC FOR ROBUSTNESS ***
    const totalCarbs = watchedFoodItems.reduce((sum, item) => {
      // Ensure carbs and amount are numbers, default to 0 if NaN or invalid
      const carbs = parseFloat(String(item.carbs)) || 0;
      const amount = parseFloat(String(item.amount)) || 0;
      return sum + (carbs * amount);
    }, 0);

    const totalCalories = watchedFoodItems.reduce((sum, item) => {
      // Ensure calories and amount are numbers, default to 0 if NaN or invalid
      const calories = parseFloat(String(item.calories ?? 0)) || 0; // Use ?? 0 for initial undefined/null
      const amount = parseFloat(String(item.amount)) || 0;
      return sum + (calories * amount);
    }, 0);

    setValue('totalCarbs', totalCarbs);
    setValue('totalCalories', totalCalories);
  }, [watchedFoodItems, setValue]); // Dependencies are correct

  // Function to fetch meals from the API
  const fetchMeals = async () => {
    setIsLoading(true);
    setFeedbackMessage(null); // Clear previous feedback

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        mealType: filterMealType
      };

      const response = await mealApi.getMeals(params);
      // Assuming your backend returns an object with `data` (meals) and `totalCount`
      // It's good to be explicit here if your backend always sends { meals: [], totalCount: 0 }
      // If it sometimes sends just the array, the fallback is useful.
      setMeals(response.data.meals || response.data);
      setTotalMealsCount(response.data.totalCount || response.data.length);
    } catch (error: any) {
      console.error('Error fetching meals:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to load meals. Please try again.' });
      setMeals([]); // Clear meals on error
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle form submission (Add/Edit meal)
  const onSubmit = async (data: MealFormData) => {
    setFeedbackMessage(null); // Clear previous feedback

    // Ensure timestamp is in ISO format
    const mealData = {
      ...data,
      timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
      // Ensure totalCarbs and totalCalories are explicitly included, though they are in `data` already
      // This is more for clarity or if your backend expects them directly in the top level
      totalCarbs: data.totalCarbs,
      totalCalories: data.totalCalories
    };

    try {
      if (editingMeal) {
        await mealApi.updateMeal(editingMeal._id!, mealData);
        setFeedbackMessage({ type: 'success', message: 'Meal updated successfully!' });
      } else {
        await mealApi.addMeal(mealData);
        setFeedbackMessage({ type: 'success', message: 'Meal added successfully!' });
      }

      await fetchMeals(); // Re-fetch meals to update the list
      cancelForm(); // Reset form and close it
    } catch (error: any) {
      console.error('Error saving meal:', error);
      // More specific error message if possible
      const errorMessage = error.response?.data?.message || 'Failed to save meal. Please check your input and try again.';
      setFeedbackMessage({ type: 'error', message: errorMessage });
    }
  };

  // Function to set up the form for editing a meal
  const handleEdit = (meal: MealEntry) => {
    setEditingMeal(meal);
    // Set form values for editing
    reset({
      mealType: meal.mealType,
      timestamp: format(new Date(meal.timestamp), "yyyy-MM-dd'T'HH:mm"),
      foodItems: meal.foodItems,
      totalCarbs: meal.totalCarbs,
      totalCalories: meal.totalCalories || 0, // Ensure default to 0 if undefined
      notes: meal.notes || '',
      preGlucose: meal.preGlucose || undefined, // Use undefined for optional number fields
      postGlucose: meal.postGlucose || undefined,
      insulinDose: meal.insulinDose || undefined,
    });
    setIsAddingMeal(true); // Open the form in edit mode
  };

  // Function to handle meal deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this meal entry?')) {
      setFeedbackMessage(null); // Clear previous feedback
      try {
        await mealApi.deleteMeal(id);
        setFeedbackMessage({ type: 'success', message: 'Meal deleted successfully!' });
        await fetchMeals(); // Re-fetch meals
      } catch (error: any) {
        console.error('Error deleting meal:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete meal. Please try again.';
        setFeedbackMessage({ type: 'error', message: errorMessage });
      }
    }
  };

  // Function to reset the form and close it
  const cancelForm = () => {
    setIsAddingMeal(false);
    setEditingMeal(null);
    reset({
      // Reset to default initial values
      mealType: MEAL_TYPES[0],
      timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      foodItems: [{ name: '', carbs: 0, protein: 0, fat: 0, calories: 0, amount: 1 }],
      totalCarbs: 0, // Explicitly reset calculated fields
      totalCalories: 0, // Explicitly reset calculated fields
      preGlucose: undefined, // Reset optional fields to undefined
      postGlucose: undefined,
      insulinDose: undefined,
      notes: ''
    });
    setFeedbackMessage(null); // Clear feedback when closing form
  };

  // Calculate total pages for pagination based on totalMealsCount from backend
  const totalPages = Math.ceil(totalMealsCount / itemsPerPage);

  // Function to handle data export
  const exportData = async () => {
    try {
      const response = await mealApi.getMeals({ limit: totalMealsCount }); // Fetch all meals
      const allMeals = response.data.meals || response.data;

      if (!allMeals || allMeals.length === 0) {
        setFeedbackMessage({ type: 'error', message: 'No data to export.' });
        return;
      }

      const csvContent = "data:text/csv;charset=utf-8," +
        "Date,Meal Type,Total Carbs (g),Total Calories,Pre-Glucose (mg/dL),Post-Glucose (mg/dL),Insulin Dose (units),Notes\n" +
        allMeals.map((meal: MealEntry) => {
          return `${format(new Date(meal.timestamp), 'yyyy-MM-dd HH:mm')},${meal.mealType},${meal.totalCarbs},${meal.totalCalories || ''},${meal.preGlucose || ''},${meal.postGlucose || ''},${meal.insulinDose || ''},"${(meal.notes || '').replace(/"/g, '""')}"`; // Escape quotes in notes
        }).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `meal-log-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setFeedbackMessage({ type: 'success', message: 'Meal data exported successfully!' });
    } catch (error) {
      console.error('Error exporting data:', error);
      setFeedbackMessage({ type: 'error', message: 'Failed to export data. Please try again.' });
    }
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
          onClick={() => {
            setIsAddingMeal(true);
            setEditingMeal(null); // Ensure no editing state when adding new
            reset({ // Reset form to default values for new entry
              mealType: MEAL_TYPES[0],
              timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
              foodItems: [{ name: '', carbs: 0, protein: 0, fat: 0, calories: 0, amount: 1 }],
              totalCarbs: 0, // Explicitly reset calculated fields
              totalCalories: 0, // Explicitly reset calculated fields
              preGlucose: undefined,
              postGlucose: undefined,
              insulinDose: undefined,
              notes: ''
            });
          }}
        >
          Add Meal
        </Button>
      </div>

      {/* Feedback Message */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-md flex items-center space-x-2 ${
            feedbackMessage.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
          role="alert"
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle size={20} className="flex-shrink-0" />
          ) : (
            <XCircle size={20} className="flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{feedbackMessage.message}</p>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={16} />}
            onClick={() => setFeedbackMessage(null)}
            className="ml-auto"
          />
        </div>
      )}

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
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-800 dark:text-white p-2"
                  {...register('mealType', { required: 'Meal type is required' })}
                >
                  {MEAL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.mealType && <p className="text-red-500 text-xs mt-1">{errors.mealType.message}</p>}
              </div>

              <Input
                label="Date & Time"
                type="datetime-local"
                {...register('timestamp', { required: 'Date and time are required' })}
                error={errors.timestamp?.message}
                max={format(new Date(), "yyyy-MM-dd'T'HH:mm")} // Prevent future dates
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
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 mb-2 p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                  <Input
                    label="Food Name"
                    {...register(`foodItems.${index}.name`, { required: 'Food name is required' })}
                    error={errors.foodItems?.[index]?.name?.message}
                  />
                  <Input
                    label="Carbs (g)"
                    type="number"
                    step="0.1"
                    {...register(`foodItems.${index}.carbs`, {
                      required: 'Carbs are required',
                      valueAsNumber: true,
                      min: { value: 0, message: 'Carbs cannot be negative' }
                    })}
                    error={errors.foodItems?.[index]?.carbs?.message}
                  />
                  <Input
                    label="Protein (g)"
                    type="number"
                    step="0.1"
                    {...register(`foodItems.${index}.protein`, { valueAsNumber: true, min: 0 })}
                  />
                  <Input
                    label="Fat (g)"
                    type="number"
                    step="0.1"
                    {...register(`foodItems.${index}.fat`, { valueAsNumber: true, min: 0 })}
                  />
                  <Input
                    label="Calories"
                    type="number"
                    {...register(`foodItems.${index}.calories`, { valueAsNumber: true, min: 0 })}
                  />
                  <div className="flex items-end space-x-2">
                    <Input
                      label="Amount"
                      type="number"
                      step="0.1"
                      {...register(`foodItems.${index}.amount`, {
                        required: 'Amount is required',
                        valueAsNumber: true,
                        min: { value: 0.1, message: 'Amount must be at least 0.1' }
                      })}
                      error={errors.foodItems?.[index]?.amount?.message}
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
              {errors.foodItems && <p className="text-red-500 text-xs mt-1">At least one food item is required.</p>}
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
                {...register('preGlucose', { valueAsNumber: true, min: 0 })}
              />

              <Input
                label="Post-meal Glucose (optional)"
                type="number"
                {...register('postGlucose', { valueAsNumber: true, min: 0 })}
              />

              <Input
                label="Insulin Dose (optional)"
                type="number"
                step="0.5"
                {...register('insulinDose', { valueAsNumber: true, min: 0 })}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-800 dark:text-white p-2"
                  {...register('notes')}
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
                placeholder="Search meals by food or notes..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on new search
                }}
                fullWidth
              />
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-800 dark:text-white p-2"
                value={filterMealType}
                onChange={(e) => {
                  setFilterMealType(e.target.value);
                  setCurrentPage(1); // Reset to first page on new filter
                }}
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
                Export CSV
              </Button>
            </div>
          </div>

          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              </div>
            ) : meals.length > 0 ? (
              <div className="space-y-4">
                {meals.map((meal) => (
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
                          aria-label={`Edit ${meal.mealType} meal`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDelete(meal._id!)}
                          className="text-red-500 hover:text-red-600"
                          aria-label={`Delete ${meal.mealType} meal`}
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
                      {meal.totalCalories !== undefined && meal.totalCalories > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Calories</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {meal.totalCalories}
                          </p>
                        </div>
                      )}
                      {meal.insulinDose !== undefined && meal.insulinDose > 0 && (
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
                      <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                        {meal.foodItems.map((item, index) => (
                          <li key={index}>
                            {item.name} - {item.carbs}g carbs {item.amount > 1 && `(x${item.amount})`}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {(meal.preGlucose !== undefined || meal.postGlucose !== undefined) && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Glucose:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {meal.preGlucose !== undefined && `Pre: ${meal.preGlucose} mg/dL`}
                          {meal.preGlucose !== undefined && meal.postGlucose !== undefined && ' → '}
                          {meal.postGlucose !== undefined && `Post: ${meal.postGlucose} mg/dL`}
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
                      <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {' '}-{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, totalMealsCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalMealsCount}</span>
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