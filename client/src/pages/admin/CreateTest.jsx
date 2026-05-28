import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Save, ChevronLeft, Plus, Search, CheckSquare, Square, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import adminService from '../../services/adminService';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';

// One section = one category + its selected questions
const newSection = () => ({ id: Date.now(), category: '', questions: [], pool: [], loadingPool: false, search: '', expanded: true });

const CreateTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('mixed');
  const [totalTime, setTotalTime] = useState(30);
  const [passingMarks, setPassingMarks] = useState(10);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarkValue, setNegativeMarkValue] = useState(0.25);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [sections, setSections] = useState([newSection()]);

  const totalSelected = sections.reduce((sum, s) => sum + s.questions.length, 0);

  useEffect(() => {
    adminService.getCategories()
      .then(res => setCategories(res.data || []))
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Load question pool for a section when its category changes
  const loadPoolForSection = useCallback(async (sectionId, categoryId) => {
    if (!categoryId) return;
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, loadingPool: true, pool: [] } : s));
    try {
      const res = await adminService.getQuestions({ category: categoryId, limit: 500, includeInactive: 'true' });
      const pool = (res.data.questions || []).filter(q => q.isActive);
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, pool, loadingPool: false } : s));
    } catch {
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, loadingPool: false } : s));
    }
  }, []);

  // Edit mode: load existing test
  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminService.getTest(id);
        const test = res.data;
        setName(test.name);
        setDescription(test.description || '');
        setDifficulty(test.difficulty || 'mixed');
        setTotalTime(test.totalTime);
        setPassingMarks(test.passingMarks || 0);
        setNegativeMarking(test.negativeMarking || false);
        setNegativeMarkValue(test.negativeMarkValue || 0.25);
        setRandomizeQuestions(test.randomizeQuestions !== undefined ? test.randomizeQuestions : true);
        setShuffleOptions(test.shuffleOptions || false);
        setIsActive(test.isActive !== undefined ? test.isActive : true);
        if (test.startDate) setStartDate(new Date(test.startDate).toISOString().slice(0, 16));
        if (test.endDate) setEndDate(new Date(test.endDate).toISOString().slice(0, 16));

        // Group existing questions by category into sections
        const questions = test.questions || [];
        const catMap = {};
        questions.forEach(q => {
          const catId = q.category?._id || q.category || 'unknown';
          if (!catMap[catId]) catMap[catId] = [];
          catMap[catId].push(q._id || q);
        });

        const builtSections = Object.entries(catMap).map(([catId, qIds]) => ({
          id: Date.now() + Math.random(),
          category: catId,
          questions: qIds,
          pool: [],
          loadingPool: false,
          search: '',
          expanded: true,
        }));

        setSections(builtSections.length > 0 ? builtSections : [newSection()]);

        // Load pools for each section
        builtSections.forEach(s => loadPoolForSection(s.id, s.category));
      } catch {
        toast.error('Failed to load test details.');
        navigate('/admin/tests');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate, loadPoolForSection]);

  const handleSectionCategoryChange = (sectionId, categoryId) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, category: categoryId, questions: [], pool: [], search: '' } : s
    ));
    if (categoryId) loadPoolForSection(sectionId, categoryId);
  };

  const handleToggleQuestion = (sectionId, qId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const questions = s.questions.includes(qId)
        ? s.questions.filter(i => i !== qId)
        : [...s.questions, qId];
      return { ...s, questions };
    }));
  };

  const handleSelectAll = (sectionId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const filtered = s.pool.filter(q => q.question.toLowerCase().includes(s.search.toLowerCase()));
      const ids = filtered.map(q => q._id);
      const merged = [...new Set([...s.questions, ...ids])];
      return { ...s, questions: merged };
    }));
  };

  const handleClearAll = (sectionId) => {
    setSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const filtered = s.pool.filter(q => q.question.toLowerCase().includes(s.search.toLowerCase()));
      const ids = filtered.map(q => q._id);
      return { ...s, questions: s.questions.filter(i => !ids.includes(i)) };
    }));
  };

  const addSection = () => setSections(prev => [...prev, newSection()]);

  const removeSection = (sectionId) => {
    if (sections.length === 1) { toast.error('At least one section is required.'); return; }
    setSections(prev => prev.filter(s => s.id !== sectionId));
  };

  const toggleExpand = (sectionId) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, expanded: !s.expanded } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Test name is required.'); return; }
    if (totalSelected === 0) { toast.error('Please select at least one question.'); return; }
    const hasEmptyCat = sections.some(s => s.questions.length > 0 && !s.category);
    if (hasEmptyCat) { toast.error('Please assign a category to all sections with questions.'); return; }

    const allQuestions = sections.flatMap(s => s.questions);
    // Use first section's category as the primary category for backward compat
    const primaryCategory = sections.find(s => s.category)?.category || null;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      category: primaryCategory,
      difficulty,
      totalTime: parseInt(totalTime, 10),
      passingMarks: parseFloat(passingMarks),
      negativeMarking,
      negativeMarkValue: negativeMarking ? parseFloat(negativeMarkValue) : 0,
      randomizeQuestions,
      shuffleOptions,
      questions: allQuestions,
      totalQuestions: allQuestions.length,
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
      toast.error(err.response?.data?.message || 'Error saving test.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !name) return <Loader />;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-12">
      <div>
        <Link to="/admin/tests" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1.5" /> Back to Tests List
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{isEdit ? 'Modify Test' : 'Create Test'}</h1>
        <p className="text-sm text-slate-400 mt-0.5">Add multiple category sections to include questions from different subjects.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left: Basic config + Sections */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Basic Config */}
          <Card hover={false} className="p-6 flex flex-col gap-5">
            <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Basic Configuration</h3>
            <Input label="Test Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quantitative Reasoning Mock 1" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Description</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Topics covered, marks distribution..."
                className="w-full py-2.5 px-4 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none transition-all" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Select label="Difficulty" value={difficulty}
                options={[{ label: 'Easy', value: 'easy' }, { label: 'Medium', value: 'medium' }, { label: 'Hard', value: 'hard' }, { label: 'Mixed', value: 'mixed' }]}
                onChange={e => setDifficulty(e.target.value)} />
              <Input label="Duration (mins)" type="number" value={totalTime} onChange={e => setTotalTime(e.target.value)} />
              <Input label="Passing Score" type="number" value={passingMarks} onChange={e => setPassingMarks(e.target.value)} />
            </div>
          </Card>

          {/* Sections */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Question Sections</h3>
                <p className="text-xs text-slate-400 mt-0.5">{totalSelected} questions selected across {sections.length} section{sections.length > 1 ? 's' : ''}</p>
              </div>
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addSection} className="text-xs font-bold">
                Add Section
              </Button>
            </div>

            {sections.map((section, idx) => {
              const filtered = section.pool.filter(q => q.question.toLowerCase().includes(section.search.toLowerCase()));
              const catName = categories.find(c => c._id === section.category)?.name;

              return (
                <Card key={section.id} hover={false} className="p-0 overflow-hidden">
                  {/* Section header */}
                  <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                          {catName || 'Select a category'}
                        </p>
                        <p className="text-[10px] text-slate-400">{section.questions.length} questions selected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => toggleExpand(section.id)} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                        {section.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {sections.length > 1 && (
                        <button type="button" onClick={() => removeSection(section.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {section.expanded && (
                    <div className="p-5 flex flex-col gap-4">
                      {/* Category picker */}
                      <Select
                        label="Category"
                        placeholder="Select category for this section"
                        value={section.category}
                        options={categories.map(c => ({ label: c.name, value: c._id }))}
                        onChange={e => handleSectionCategoryChange(section.id, e.target.value)}
                      />

                      {/* Question pool */}
                      {!section.category ? (
                        <div className="py-8 text-center text-slate-400 text-xs">Select a category above to load questions.</div>
                      ) : section.loadingPool ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 text-indigo-500 animate-spin" /></div>
                      ) : section.pool.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-xs">No active questions in this category. Add questions first.</div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {/* Search + select all */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                              <input type="text" placeholder="Search questions..." value={section.search}
                                onChange={e => setSections(prev => prev.map(s => s.id === section.id ? { ...s, search: e.target.value } : s))}
                                className="w-full py-1.5 pl-8 pr-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:outline-none" />
                            </div>
                            <button type="button" onClick={() => handleSelectAll(section.id)} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 whitespace-nowrap">Select All</button>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <button type="button" onClick={() => handleClearAll(section.id)} className="text-[10px] font-bold text-slate-400 hover:text-slate-500 whitespace-nowrap">Clear</button>
                          </div>

                          <p className="text-[10px] text-slate-400">{filtered.length} questions available · {section.questions.length} selected</p>

                          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                            {filtered.map(q => {
                              const checked = section.questions.includes(q._id);
                              return (
                                <div key={q._id} onClick={() => handleToggleQuestion(section.id, q._id)}
                                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                                    checked
                                      ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/10'
                                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                                  }`}>
                                  <span className="shrink-0 mt-0.5">
                                    {checked
                                      ? <CheckSquare className="w-4 h-4 text-indigo-500" />
                                      : <Square className="w-4 h-4 text-slate-400" />}
                                  </span>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-relaxed">{q.question}</p>
                                    <div className="flex gap-2 text-[9px] text-slate-400 mt-1 font-bold">
                                      <span className="capitalize">{q.difficulty}</span>
                                      <span>•</span>
                                      <span>{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                                      {q.subcategory?.name && <><span>•</span><span>{q.subcategory.name}</span></>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right: Advanced settings */}
        <div className="flex flex-col gap-6">
          <Card hover={false} className="p-6 flex flex-col gap-5">
            <h3 className="font-bold text-slate-800 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">Advanced Controls</h3>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Negative Penalty</label>
                <p className="text-[10px] text-slate-400 mt-0.5">Deduct marks for wrong answers.</p>
              </div>
              <input type="checkbox" checked={negativeMarking} onChange={e => setNegativeMarking(e.target.checked)}
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
            </div>
            {negativeMarking && (
              <Input label="Penalty Value" type="number" step="0.05" value={negativeMarkValue} onChange={e => setNegativeMarkValue(e.target.value)} />
            )}

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Randomize Questions</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Shuffle question order.</p>
                </div>
                <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shuffle Options</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Scramble answer choices.</p>
                </div>
                <input type="checkbox" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">Start Date (Optional)</label>
                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">End Date (Optional)</label>
                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700/80 focus:border-indigo-500 focus:outline-none transition-all" />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Set Active</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Visible to students immediately.</p>
                </div>
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
              </div>
            </div>
          </Card>

          {/* Summary */}
          <Card hover={false} className="p-5 bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-500/20">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-3">Test Summary</h4>
            <div className="space-y-2">
              {sections.map((s, i) => {
                const cat = categories.find(c => c._id === s.category);
                return (
                  <div key={s.id} className="flex justify-between text-xs">
                    <span className="text-slate-500">Section {i + 1}: {cat?.name || 'No category'}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{s.questions.length} Qs</span>
                  </div>
                );
              })}
              <div className="border-t border-indigo-500/20 pt-2 flex justify-between text-xs font-black">
                <span className="text-slate-700 dark:text-slate-300">Total Questions</span>
                <span className="text-indigo-600 dark:text-indigo-400">{totalSelected}</span>
              </div>
            </div>
          </Card>

          <Button variant="primary" type="submit" loading={loading} icon={Save} fullWidth className="font-bold py-3 shadow-indigo-500/10">
            {isEdit ? 'Save Changes' : 'Create Test'}
          </Button>
        </div>

      </form>
    </div>
  );
};

export default CreateTest;
