import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Search, Filter, FileDown, ChevronLeft, ChevronRight, BookText, Edit, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import axios from 'axios';

interface JournalEntry {
  _id?: string;
  date: string;
  mood: string;
  stressLevel?: number;
  sleepHours?: number;
  exerciseMinutes?: number;
  exerciseType?: string;
  content: string;
  tags?: string[];
}

interface JournalFormData {
  date: string;
  mood: string;
  stressLevel?: number;
  sleepHours?: number;
  exerciseMinutes?: number;
  exerciseType?: string;
  content: string;
  tags?: string;
}

const Journal: React.FC = () => {
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState('');
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<JournalFormData>();
  const itemsPerPage = 10;

  const moods = ['Excellent', 'Good', 'Neutral', 'Bad', 'Terrible'];

  useEffect(() => {
    fetchEntries();
  }, [currentPage, searchTerm, filterMood]);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        mood: filterMood
      });

      const response = await axios.get(`/api/journal?${params}`);
      setEntries(response.data);
      setTotalPages(Math.ceil(response.data.length / itemsPerPage));
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: JournalFormData) => {
    try {
      const entryData = {
        ...data,
        date: data.date || new Date().toISOString(),
        tags: data.tags?.split(',').map((tag: string) => tag.trim()) || []
      };

      if (editingEntry) {
        await axios.put(`/api/journal/${editingEntry._id}`, entryData);
      } else {
        await axios.post('/api/journal', entryData);
      }
      
      setIsAddingEntry(false);
      setEditingEntry(null);
      reset();
      fetchEntries();
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setValue('date', format(new Date(entry.date), 'yyyy-MM-dd'));
    setValue('mood', entry.mood);
    setValue('stressLevel', entry.stressLevel || 0);
    setValue('sleepHours', entry.sleepHours || 0);
    setValue('exerciseMinutes', entry.exerciseMinutes || 0);
    setValue('exerciseType', entry.exerciseType || '');
    setValue('content', entry.content);
    setValue('tags', entry.tags?.join(', ') || '');
    setIsAddingEntry(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await axios.delete(`/api/journal/${id}`);
        await fetchEntries();
      } catch (error) {
        console.error('Error deleting journal entry:', error);
      }
    }
  };

  const cancelForm = () => {
    setIsAddingEntry(false);
    setEditingEntry(null);
    reset();
  };

  const exportData = async () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Date,Mood,Stress Level,Sleep Hours,Exercise Minutes,Exercise Type,Content\n" +
        entries.map(entry => {
          return `${format(new Date(entry.date), 'yyyy-MM-dd')},${entry.mood},${entry.stressLevel || ''},${entry.sleepHours || ''},${entry.exerciseMinutes || ''},${entry.exerciseType || ''},"${entry.content.replace(/"/g, '""')}"`;
        }).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.href = encodedUri;
      link.setAttribute('download', `journal-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting entries:', error);
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Excellent':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30';
      case 'Good':
        return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30';
      case 'Neutral':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
      case 'Bad':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30';
      case 'Terrible':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterMood === '' || entry.mood === filterMood;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
          <BookText className="mr-2 text-indigo-600" size={24} />
          Journal
        </h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setIsAddingEntry(true)}
        >
          Add Entry
        </Button>
      </div>

      {(isAddingEntry || editingEntry) && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingEntry ? 'Edit Journal Entry' : 'Add New Journal Entry'}
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
                label="Date"
                type="date"
                {...register('date')}
                defaultValue={format(new Date(), 'yyyy-MM-dd')}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mood
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800"
                  {...register('mood', { required: 'Mood is required' })}
                >
                  {moods.map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
                {errors.mood && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-500">{errors.mood.message}</p>
                )}
              </div>

              <Input
                label="Stress Level (1-10)"
                type="number"
                min="1"
                max="10"
                {...register('stressLevel', {
                  min: { value: 1, message: 'Minimum value is 1' },
                  max: { value: 10, message: 'Maximum value is 10' }
                })}
                error={errors.stressLevel?.message}
              />

              <Input
                label="Sleep Hours"
                type="number"
                step="0.5"
                {...register('sleepHours', {
                  min: { value: 0, message: 'Sleep hours must be positive' }
                })}
                error={errors.sleepHours?.message}
              />

              <Input
                label="Exercise Minutes"
                type="number"
                {...register('exerciseMinutes', {
                  min: { value: 0, message: 'Exercise minutes must be positive' }
                })}
                error={errors.exerciseMinutes?.message}
              />

              <Input
                label="Exercise Type"
                {...register('exerciseType')}
                placeholder="e.g., Walking, Running, Yoga"
              />

              <div className="md:col-span-2">
                <Input
                  label="Content"
                  {...register('content', { required: 'Content is required' })}
                  error={errors.content?.message}
                  multiline
                  rows={4}
                  placeholder="How are you feeling today? What happened? Any insights or observations..."
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Tags (comma-separated)"
                  {...register('tags')}
                  placeholder="e.g., exercise, stress, medication, work"
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
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!isAddingEntry && !editingEntry && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search entries..."
                icon={<Search size={16} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
              />
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-800"
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
              >
                <option value="">All Moods</option>
                {moods.map(mood => (
                  <option key={mood} value={mood}>{mood}</option>
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

          <div className="space-y-4">
            {isLoading ? (
              <Card>
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              </Card>
            ) : filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <Card key={entry._id}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMoodColor(entry.mood)}`}>
                            {entry.mood}
                          </span>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit size={16} />}
                              onClick={() => handleEdit(entry)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={16} />}
                              onClick={() => handleDelete(entry._id!)}
                              className="text-red-500 hover:text-red-600"
                            />
                          </div>
                        </div>
                      </div>

                      {(entry.stressLevel || entry.sleepHours || entry.exerciseMinutes) && (
                        <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600 dark:text-gray-400">
                          {entry.stressLevel && (
                            <span>Stress: {entry.stressLevel}/10</span>
                          )}
                          {entry.sleepHours && (
                            <span>Sleep: {entry.sleepHours}h</span>
                          )}
                          {entry.exerciseMinutes && (
                            <span>
                              Exercise: {entry.exerciseMinutes}min
                              {entry.exerciseType && ` (${entry.exerciseType})`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                    {entry.content}
                  </p>

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Card>
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No journal entries found. Add your first entry to get started!
                </div>
              </Card>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    icon={<ChevronLeft size={16} />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    icon={<ChevronRight size={16} />}
                    iconPosition="right"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Journal;