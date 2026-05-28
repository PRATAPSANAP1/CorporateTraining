import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import ManageTests from './ManageTests';
import ManageQuestions from './ManageQuestions';
import { Brain, Calculator, AlignLeft, Shapes, Terminal, BookOpen, Mic } from 'lucide-react';

const subjectMap = {
  'math': { label: 'Math', icon: Calculator, defaultCategory: 'Quantitative Aptitude' },
  'verbal': { label: 'Verbal', icon: AlignLeft, defaultCategory: 'Verbal Ability' },
  'non-verbal': { label: 'Non-Verbal', icon: Shapes, defaultCategory: 'Logical Reasoning' },
  'mcq': { label: 'MCQ Tests', icon: BookOpen, defaultCategory: null }, 
  'interview': { label: 'Interview', icon: Mic, defaultCategory: 'Interview' }, 
};

const AdminSubjectHub = ({ group }) => {
  const { subject } = useParams();
  const [activeTab, setActiveTab] = useState('tests');

  if (group === 'technical' && (!subject || !subjectMap[subject])) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const info = group === 'aptitude' 
    ? { label: 'Aptitude Hub', icon: Brain, defaultCategory: null } 
    : subjectMap[subject];

  const Icon = info.icon;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {group === 'aptitude' ? 'Aptitude' : `Technical — ${info.label}`}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage tests and questions for this section.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'tests' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('tests')}
        >
          Tests
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'questions' 
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
          onClick={() => setActiveTab('questions')}
        >
          Questions Pool
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'tests' && (
          <ManageTests defaultCategoryName={info.defaultCategory} hideHeader={true} />
        )}
        {activeTab === 'questions' && (
          <ManageQuestions defaultCategoryName={info.defaultCategory} hideHeader={true} />
        )}
      </div>
    </div>
  );
};

export default AdminSubjectHub;
