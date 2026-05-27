import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ChevronLeft, HelpCircle, Plus, Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

const CreateTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  // Question Pool states
  const [questionPool, setQuestionPool] = useState([]);
  const [loadingPool, setLoadingPool] = useState(false);
  const [poolSearch, setPoolSearch] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [totalTime, setTotalTime] = useState(30); // minutes
  const [passingMarks, setPassingMarks] = useState(10);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.25);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]); // Array of IDs
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await adminService.getCategories();
        setCategories(res.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    loadCategories();
  }, []);

  // 2. Fetch subcategories when category changes
  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      return;
    }
    const loadSubcategories = async () => {
      try {
        const res = await adminService.getSubcategories(category);
        setSubcategories(res.data || []);
      } catch (err) {
        console.error('Error fetching subcategories:', err);
      }
    };
    loadSubcategories();
  }, [category]);

  // 3. Fetch questions matching the selected Category to select from
  useEffect(() => {
    if (!category) {
      setQuestionPool([]);
      return;
    }

    const fetchQuestionPool = async () => {
      try {
        setLoadingPool(true);
        const res = await adminService.getQuestions({
          category,
          limit: 100 // load a large subset to choose from
        });
        setQuestionPool(res.data.questions || []);
      } catch (err) {
        console.error('Error loading question pool:', err);
      } finally {
        setLoadingPool(false);
      }
    };
    fetchQuestionPool();
  }, [category]);

  // 4. Load test details if editing
  useEffect(() => {
    if (!isEdit) return;

    const loadTestData = async () => {
      try {
        setLoading(true);
        const res = await adminService.getTest(id);
        const test = res.data;

        setName(test.name);
        setDescription(test.description || '');
        setCategory(test.category?._id || test.category);
        setSubcategory(test.subcategory?._id || test.subcategory || '');
        setDifficulty(test.difficulty || 'mixed');
        setTotalTime(test.totalTime);
        setPassingMarks(test.passingMarks || 0);
        setNegativeMarking(test.negativeMarking || false);
        setNegativeMarkValue(test.negativeMarkValue || 0.25);
        setRandomizeQuestions(test.randomizeQuestions !== undefined ? test.randomizeQuestions : true);
        setShuffleOptions(test.shuffleOptions || false);
        setIsActive(test.isActive !== undefined ? test.isActive : true);
        setSelectedQuestions(test.questions?.map(q => q._id || q) || []);
        
        if (test.startDate) {
          setStartDate(new Date(test.startDate).toISOString().slice(0, 16));
        }
        if (test.endDate) {
          setEndDate(new Date(test.endDate).toISOString().slice(0, 16));
        }
      } catch (err) {
        console.error('Error loading test details:', err.message);
        toast.error('Failed to load test details.');
        navigate('/admin/tests');
      } finally {
        setLoading(false);
      }
    };
    loadTestData();
  }, [id, isEdit, navigate]);

  const handleToggleQuestionSelection = (qId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(qId)) {
        return prev.filter(id => id !== qId);
      } else {
        return [...prev, qId];
      }
    });
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredPool.map(q => q._id);
    setSelectedQuestions(prev => {
      const added = [...prev];
      filteredIds.forEach(id => {
        if (!added.includes(id)) {
          added.push(id);
        }
      });
      return added;
    });
  };

  const handleClearAllFiltered = () => {
    const filteredIds = filteredPool.map(q => q._id);
    setSelectedQuestions(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Test name is required.');
      return;
    }
    if (!category) {
      toast.error('Please assign a Category.');
      return;
    }
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question to include in the test.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      category,
      subcategory: subcategory || null,
      difficulty,
      totalTime: parseInt(totalTime, 10),
      passingMarks: parseFloat(passingMarks),
      negativeMarking,
      negativeMarkValue: negativeMarking ? parseFloat(negativeMarkValue) : 0,
      randomizeQuestions,
      shuffleOptions,
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
      isActive,
      startDate: startDate || null,
      endDate: endDate || null,
    };

    try {
      setLoading(true);
      if (isEdit) {
        await adminService.updateTest(id, payload);
        toast.success('Test updated successfully!');
      } else {
        await adminService.createTest(payload);
        toast.success('Test created successfully!');
      }
      navigate('/admin/tests');
    } catch (err) {
      console.error('Error saving test:', err.message);
      toast.error(err.response?.data?.message || 'Error saving test configurations.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !name) return <Loader />;

  // Filter pool questions on local search text
  const filteredPool = questionPool.filter(q =>
    q.question.toLowerCase().includes(poolSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          to="/admin/tests"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Tests List
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-white font-black">
          {isEdit ? 'Modify Test Session' : 'Create Timed Test'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {isEdit ? 'Update exam properties, schedule dates, or modify question sheets.' : 'Create a timed examination composed of existing pool questions.'}
        </p>
      </div>

      {/* Form Panel */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Basic options left side */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card hover={false} className="p-6 flex flex-col gap-5">
            <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-800">Basic Configurations</h3>
            
            <Input
              label="Test Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Quantitative Reasoning Mock 1"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Description & Syllabus
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about topics included, marks distributions, etc..."
                className="w-full py-2.5 px-4 rounded-xl text-sm transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Select
                label="Parent Category"
                placeholder="Select Category"
                value={category}
                options={categories.map(c => ({ label: c.name, value: c._id }))}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setSelectedQuestions([]); // Clear selected questions when category shifts
                }}
              />
              <Select
                label="Subcategory (Optional)"
                placeholder="Select Subcategory"
                value={subcategory}
                options={subcategories.map(s => ({ label: s.name, value: s._id }))}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={!category}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Select
                label="Difficulty Style"
                value={difficulty}
                options={[
                  { label: 'Easy', value: 'easy' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Hard', value: 'hard' },
                  { label: 'Mixed Styles', value: 'mixed' }
                ]}
                onChange={(e) => setDifficulty(e.target.value)}
              />
              <Input
                label="Duration (Mins)"
                type="number"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
              />
              <Input
                label="Passing Score"
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
              />
            </div>
          </Card>

          {/* Question Pool selection */}
          <Card hover={false} className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white">Included Questions ({selectedQuestions.length})</h3>
              {category && filteredPool.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[10px] uppercase font-bold text-indigo-500 hover:text-indigo-600"
                  >
                    Select Page
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={handleClearAllFiltered}
                    className="text-[10px] uppercase font-bold text-slate-400 hover:text-slate-500"
                  >
                    Clear Page
                  </button>
                </div>
              )}
            </div>

            {!category ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Please select a parent Category above to load available questions pool.
              </div>
            ) : loadingPool ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : filteredPool.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active questions found in this category. Write questions first.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="relative mb-2">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search question pool..."
                    value={poolSearch}
                    onChange={(e) => setPoolSearch(e.target.value)}
                    className="w-full py-1.5 pl-9 pr-4 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {filteredPool.map((q) => {
                    const isChecked = selectedQuestions.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => handleToggleQuestionSelection(q._id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isChecked
                            ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/5 text-slate-800 dark:text-white'
                            : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="shrink-0 mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4.5 h-4.5 text-indigo-500" />
                          ) : (
                            <Square className="w-4.5 h-4.5" />
                          )}
                        </span>
                        <div>
                          <p className="text-xs font-bold leading-relaxed">{q.question}</p>
                          <div className="flex gap-2 text-[9px] text-slate-400 mt-1 font-bold">
                            <span className="capitalize">{q.difficulty}</span>
                            <span>•</span>
                            <span>{q.marks} marks</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right column settings toggles & schedules */}
        <div className="flex flex-col gap-6">
          <Card hover={false} className="p-6 flex flex-col gap-5">
            <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-50 dark:border-slate-800">Advanced Controls</h3>

            {/* Negative Marking */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Negative Penalty</label>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Deduct marks for incorrect keys.</p>
              </div>
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {negativeMarking && (
              <Input
                label="Penalty Value"
                type="number"
                step="0.05"
                value={negativeMarkValue}
                onChange={(e) => setNegativeMarkValue(e.target.value)}
              />
            )}

            <div className="border-t border-slate-50 dark:border-slate-800/80 pt-4 flex flex-col gap-4">
              {/* Randomization */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Randomize Questions</label>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Shuffles question sequence order.</p>
                </div>
                <input
                  type="checkbox"
                  checked={randomizeQuestions}
                  onChange={(e) => setRandomizeQuestions(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Shuffle Options */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shuffle Answers Options</label>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Scramble options placement order.</p>
                </div>
                <input
                  type="checkbox"
                  checked={shuffleOptions}
                  onChange={(e) => setShuffleOptions(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="border-t border-slate-50 dark:border-slate-800/80 pt-4 flex flex-col gap-4">
              {/* Schedules */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Start Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl transition-all duration-300 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-50 dark:border-slate-800/80 pt-4">
              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Set Active immediately</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Make test visible to students.</p>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </Card>

          {/* Action button triggers */}
          <div className="flex gap-4">
            <Button
              variant="primary"
              type="submit"
              loading={loading}
              icon={Save}
              fullWidth
              className="font-bold shadow-indigo-500/10 py-3"
            >
              {isEdit ? 'Save Test Changes' : 'Create Placement Test'}
            </Button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default CreateTest;
