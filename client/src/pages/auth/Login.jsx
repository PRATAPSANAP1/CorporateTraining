import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, LogIn, GraduationCap, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { login } from '../../store/slices/authSlice';

const Login = () => {
  const passwordInputRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(state => state.auth || {});

  const [role, setRole] = useState('student'); // 'student' | 'admin'
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  // Clear form when switching roles
  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setFormData({ email: '', password: '' });
    setErrors({});
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await dispatch(login({ email: formData.email, password: formData.password })).unwrap();
      // Validate role matches
      if (role === 'admin' && result?.user?.role !== 'admin') {
        toast.error('Access denied. This account is not an admin.');
        return;
      }
      if (role === 'student' && result?.user?.role === 'admin') {
        toast.error('Please use the Admin login tab.');
        return;
      }
      toast.success(`Welcome back, ${result?.user?.name?.split(' ')[0] || 'User'}!`);
    } catch (err) {
      toast.error(err?.message || err || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === 'admin';

  const activeTab = isAdmin
    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
    : 'bg-blue-600 text-white shadow-md shadow-blue-500/30';

  const btnClass = isAdmin
    ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  const ringClass = isAdmin ? 'focus:ring-indigo-500' : 'focus:ring-blue-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <img src="/logo.jpg" alt="OIT_STACK Logo" className="w-12 h-12 object-contain rounded-xl bg-white border border-slate-100 dark:border-slate-700 shadow-sm" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">OIT_STACK</h1>
            <span className="text-[10px] text-slate-500 font-medium">Placement Preparation Portal</span>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 mb-6 gap-1">
          <button
            type="button"
            onClick={() => handleRoleSwitch('student')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              !isAdmin ? activeTab : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              isAdmin ? activeTab : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        </div>

        {/* Card */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl border transition-all duration-300 p-8 ${
          isAdmin ? 'border-indigo-500/20 shadow-indigo-500/5' : 'border-slate-100 dark:border-slate-800'
        }`}>
          {/* Admin badge */}
          {isAdmin && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2 mb-5">
              <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                Admin access only. Unauthorized login is prohibited.
              </p>
            </div>
          )}

          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-5">
            {isAdmin ? 'Admin Sign In' : 'Student Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-2.5 w-4 h-4 pointer-events-none ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=""
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm ${
                    errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } ${ringClass}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-2.5 w-4 h-4 pointer-events-none ${errors.password ? 'text-red-400' : 'text-slate-400'}`} />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  ref={passwordInputRef}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-12 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition text-sm ${
                    errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                  } ${ringClass}`}
                />
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setShowPassword(!showPassword); setTimeout(() => passwordInputRef.current?.focus(), 0); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            {/* Forgot password */}
            {!isAdmin && (
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-blue-500 hover:underline">Forgot password?</Link>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnClass}`}
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  {isAdmin ? <Shield className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  {isAdmin ? 'Sign In as Admin' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {!isAdmin && (
            <p className="mt-5 text-center text-sm text-slate-500">
              New to OIT_STACK?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">Create an account</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
