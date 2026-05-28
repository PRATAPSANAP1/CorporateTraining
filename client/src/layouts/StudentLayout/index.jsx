import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import {
  LayoutDashboard, Brain, Terminal, Code2, Mic,
  Trophy, ClipboardList, User, LogOut, Menu, X,
  Moon, Sun, Bell, Settings, Search, BookOpen
} from 'lucide-react';
import codingService from '../../services/codingService';
import testService from '../../services/testService';

const navItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { label: 'Aptitude Tests', path: '/student/tests?category=aptitude', icon: Brain },
  { label: 'Technical Tests', path: '/student/tests?category=technical', icon: Terminal },
  { label: 'Coding Practice', path: '/student/coding', icon: Code2 },
  { label: 'AI Interview', path: '/student/interview', icon: Mic },
  { label: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
  { label: 'My Results', path: '/student/results', icon: ClipboardList },
  { label: 'Profile', path: '/student/profile', icon: User },
];

const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ coding: [], tests: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ coding: [], tests: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const codingRes = await codingService.getProblems({ limit: 100 });
        const codingProblems = codingRes.data.problems || [];
        const filteredCoding = codingProblems.filter(p =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
        );

        const testsRes = await testService.getTests({ limit: 100 });
        const allTests = testsRes.data || [];
        const filteredTests = allTests.filter(t =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        setSearchResults({
          coding: filteredCoding.slice(0, 5),
          tests: filteredTests.slice(0, 5)
        });
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800/80 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="OIT_STACK Logo" className="w-9 h-9 object-contain rounded-xl bg-white border border-slate-100 dark:border-slate-800 shadow-sm" />
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-sm">OIT_STACK</h1>
              <p className="text-[10px] text-slate-400 font-medium">Student Portal</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || 'Student'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'student@oit_stack.com'}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Logout">
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>

          <div className="flex lg:hidden items-center gap-2">
            <img src="/logo.jpg" alt="OIT_STACK Logo" className="w-7 h-7 object-contain rounded-lg bg-white border border-slate-100 dark:border-slate-800 shadow-sm" />
            <span className="font-bold text-slate-900 dark:text-white text-sm">OIT_STACK</span>
          </div>
          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <div ref={searchRef} className="hidden sm:block relative w-64 md:w-80 mr-1.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search any problem or test..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 transition-all placeholder-slate-400"
                />
              </div>

              {showSearchDropdown && searchQuery.trim() && (
                <div className="absolute top-11 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto p-2">
                  {searching ? (
                    <div className="p-3 text-center text-xs text-slate-400">Searching...</div>
                  ) : searchResults.coding.length === 0 && searchResults.tests.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400">No matches found</div>
                  ) : (
                    <div className="space-y-3">
                      {searchResults.coding.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">Coding Problems</h4>
                          <div className="space-y-0.5">
                            {searchResults.coding.map(p => (
                              <button
                                key={p._id}
                                onClick={() => {
                                  navigate(`/student/coding/${p._id}`);
                                  setShowSearchDropdown(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="truncate">{p.title}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {searchResults.tests.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-1">MCQ Tests</h4>
                          <div className="space-y-0.5">
                            {searchResults.tests.map(t => (
                              <button
                                key={t._id}
                                onClick={() => {
                                  navigate(`/student/tests/${t._id}`);
                                  setShowSearchDropdown(false);
                                  setSearchQuery('');
                                }}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                                <span className="truncate">{t.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={toggleDark} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>
            <button onClick={() => toast('No new notifications', { icon: '🔔' })} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <button onClick={() => navigate('/student/profile')} className="p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;

