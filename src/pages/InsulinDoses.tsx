// C:\Users\tanve\Downloads\project-bolt-sb1-onne9y7q\project\src\pages\InsulinDoses.tsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Filter, FileDown, ChevronLeft, ChevronRight, Syringe, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { INSULIN_TYPES, INJECTION_SITES } from '../config/constants'; // Ensure these match your backend enum values!
import { insulinApi } from '../services/api'; // Correct import path for your API service

interface InsulinDose {
  _id?: string;
  insulinType: string;
  brand?: string;
  units: number;
  timestamp: string;
  injectionSite?: string;
  relatedMeal?: string; // This would be an ID if you want to link to a Meal object
  notes?: string;
}

interface InsulinFormData {
  insulinType: string;
  brand?: string;
  units: number;
  timestamp: string; // Will be "yyyy-MM-dd'T'HH:mm" format from input
  injectionSite?: string;
  relatedMeal?: string; // Frontend will send ID, backend expects ObjectId
  notes?: string;
}

const InsulinDoses: React.FC = () => {
  const [isAddingDose, setIsAddingDose] = useState(false);
  const [editingDose, setEditingDose] = useState<InsulinDose | null>(null);
  const [doses, setDoses] = useState<InsulinDose[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDosesCount, setTotalDosesCount] = useState(0); // To display total records
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [error, setError] = useState<string | null>(null); // State for displaying errors

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<InsulinFormData>();
  const itemsPerPage = 10; // This should match the default limit in your backend API

  // Fetch doses whenever currentPage, searchTerm, or filterType changes
  useEffect(() => {
    fetchDoses();
  }, [currentPage, searchTerm, filterType]);

  const fetchDoses = async () => {
    setError(null); // Clear previous errors
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        type: filterType
      };

      const response = await insulinApi.getDoses(params);
      setDoses(response.data.doses); // Backend should return { doses: [], totalCount: N }
      setTotalPages(response.data.totalPages); // Assuming backend calculates totalPages
      setTotalDosesCount(response.data.totalCount); // Assuming backend returns totalCount
    } catch (error: any) {
      console.error('Error fetching insulin doses:', error);
      setError(error.response?.data?.message || 'Failed to fetch insulin doses. Please try again.');
      setDoses([]);
      setTotalPages(1);
      setTotalDosesCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // src/pages/InsulinDoses.tsx

// ... (other imports and component setup) ...

const onSubmit = async (data: InsulinFormData) => {
  setError(null); // Clear previous errors
  try {
    // Ensure timestamp is sent as a valid ISO string or omit it for backend default
    const doseDataToSend = {
      ...data,
      timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString()
    };

    // --- FIX START ---
    // If relatedMeal is an empty string, set it to null or undefined
    // Mongoose will ignore null/undefined for an optional ObjectId field
    if (doseDataToSend.relatedMeal === '') {
      doseDataToSend.relatedMeal = undefined; // Or null, both work
    }
    // --- FIX END ---

    if (editingDose) {
      await insulinApi.updateDose(editingDose._id!, doseDataToSend);
    } else {
      await insulinApi.addDose(doseDataToSend);
    }

    setIsAddingDose(false);
    setEditingDose(null);
    reset(); // Clear form fields
    // After saving, reset current page to 1 to see the new/updated dose at the top (optional)
    setCurrentPage(1);
    fetchDoses(); // Re-fetch data to update the list
  } catch (error: any) {
    console.error('Error saving insulin dose:', error);
    // Display the error message from the backend if available
    setError(error.response?.data?.message || 'Failed to save insulin dose. Please check your inputs.');
  }
};

// ... (rest of your component) ...

  const handleEdit = (dose: InsulinDose) => {
    setEditingDose(dose);
    // Set form values for editing
    setValue('insulinType', dose.insulinType);
    setValue('brand', dose.brand || '');
    setValue('units', dose.units);
    // Format timestamp for datetime-local input
    setValue('timestamp', format(new Date(dose.timestamp), "yyyy-MM-dd'T'HH:mm"));
    setValue('injectionSite', dose.injectionSite || '');
    setValue('relatedMeal', dose.relatedMeal || ''); // If relatedMeal is an ID, this might need conversion
    setValue('notes', dose.notes || '');
    setIsAddingDose(true);
  };

  const handleDelete = async (id: string) => {
    setError(null); // Clear previous errors
    if (!id) {
      setError('Cannot delete: Insulin dose ID is missing.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this insulin dose?')) {
      try {
        await insulinApi.deleteDose(id);
        // After deletion, reset page if the last item on a page was deleted
        if (doses.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchDoses(); // Re-fetch data to update the list
        }
      } catch (error: any) {
        console.error('Error deleting insulin dose:', error);
        setError(error.response?.data?.message || 'Failed to delete insulin dose. Please try again.');
      }
    }
  };

  const cancelForm = () => {
    setIsAddingDose(false);
    setEditingDose(null);
    reset(); // Clear form fields
    setError(null); // Clear errors when canceling
  };

  const exportData = async () => {
    setError(null); // Clear previous errors
    try {
      // You could use reportsApi.exportData if your backend provides a CSV export
      // For now, keeping your existing client-side CSV generation
      const csvContent = "data:text/csv;charset=utf-8," +
        "Date,Time,Type,Units,Brand,Injection Site,Related Meal,Notes\n" +
        doses.map(dose => {
          const date = new Date(dose.timestamp);
          // Ensure quotes around notes in case it contains commas
          return `${format(date, 'yyyy-MM-dd')},${format(date, 'HH:mm')},${dose.insulinType},${dose.units},"${dose.brand || ''}","${dose.injectionSite || ''}","${dose.relatedMeal || ''}","${(dose.notes || '').replace(/"/g, '""')}"`;
        }).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.href = encodedUri;
      link.setAttribute('download', `insulin-doses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting doses:', error);
      setError('Failed to export data.');
    }
  };

  // Note: filteredDoses is now just a display of the *already fetched* paginated doses,
  // the actual filtering/searching is done on the backend via fetchDoses.
  // This variable is no longer strictly necessary if your backend handles all filtering,
  // but it doesn't hurt. If your backend doesn't handle all search/filter,
  // you'd re-introduce client-side filtering here on the 'doses' array.
  // For the current setup, it would be `const displayDoses = doses;`
  // But let's assume `filteredDoses` implies backend filtering via `searchTerm` and `filterType` parameters.
  // The provided `filteredDoses` logic here would only filter the *current page's* data,
  // which might be confusing if the backend is already filtering.
  // Given the backend handles `search` and `type` params, this client-side `filteredDoses` constant
  // is redundant and potentially misleading. We will just use `doses` directly.

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <Syringe className="mr-2 text-orange-600" size={24} />
          Insulin Doses
        </h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsAddingDose(true)}
        >
          Add Dose
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <X className="h-6 w-6 text-red-500 cursor-pointer" onClick={() => setError(null)} />
          </span>
        </div>
      )}

      {(isAddingDose || editingDose) && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingDose ? 'Edit Insulin Dose' : 'Add New Insulin Dose'}
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
                <label htmlFor="insulinType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Insulin Type
                </label>
                <select
                  id="insulinType"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  {...register('insulinType', { required: 'Insulin type is required' })}
                >
                  <option value="">Select a type</option> {/* Added a default empty option */}
                  {INSULIN_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {errors.insulinType && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.insulinType.message}</p>
                )}
              </div>

              <Input
                label="Brand (Optional)"
                id="brand"
                {...register('brand')}
                placeholder="e.g., Humalog, Lantus"
              />

              <Input
                label="Units"
                id="units"
                type="number"
                step="0.5"
                {...register('units', {
                  required: 'Units are required',
                  min: { value: 0.1, message: 'Units must be positive' } // Min unit matching schema
                })}
                error={errors.units?.message}
              />

              <Input
                label="Date & Time"
                id="timestamp"
                type="datetime-local"
                {...register('timestamp')}
                defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")} // Set default for new entry
              />

              <div>
                <label htmlFor="injectionSite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Injection Site
                </label>
                <select
                  id="injectionSite"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  {...register('injectionSite')}
                >
                  <option value="Not Specified">Not Specified</option> {/* Default option */}
                  {INJECTION_SITES.map(site => (
                    <option key={site} value={site}>{site}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Related Meal (Optional)"
                id="relatedMeal"
                {...register('relatedMeal')}
                placeholder="Meal ID (e.g., for linking)" // Clarify this expects an ID
              />

              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                  rows={3}
                  {...register('notes')}
                  placeholder="Add any notes here..."
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
                {editingDose ? 'Update Dose' : 'Save Dose'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!isAddingDose && !editingDose && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search doses by brand or notes..."
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
                className="rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-orange-500 focus:ring-orange-500 dark:bg-gray-800 dark:text-white"
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1); // Reset to first page on new filter
                }}
              >
                <option value="">All Types</option>
                {INSULIN_TYPES.map(type => (
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : doses.length > 0 ? (
              <div className="space-y-4">
                {doses.map((dose) => (
                  <div key={dose._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {dose.insulinType} - {dose.units} units
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(dose.timestamp), 'PPpp')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit size={16} />}
                          onClick={() => handleEdit(dose)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={16} />}
                          onClick={() => handleDelete(dose._id!)}
                          className="text-red-500 hover:text-red-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {dose.brand && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Brand</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{dose.brand}</p>
                        </div>
                      )}
                      {dose.injectionSite && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Injection Site</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{dose.injectionSite}</p>
                        </div>
                      )}
                      {dose.relatedMeal && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Related Meal ID</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{dose.relatedMeal}</p>
                        </div>
                      )}
                    </div>

                    {dose.notes && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                        <p className="text-sm text-gray-900 dark:text-white">{dose.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No insulin doses found. Add your first dose to get started!
              </div>
            )}

            {totalDosesCount > itemsPerPage && ( // Only show pagination if there are more items than fit on one page
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
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalDosesCount)}</span> of <span className="font-medium">{totalDosesCount}</span> results
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

export default InsulinDoses;