import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Lock, Terminal, Loader2, UserCheck } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';

// Define registration validation schema with password matches check
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  role: z.enum(['admin', 'analyst']).default('analyst')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const Register = () => {
  const { register: registerAction, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'analyst'
    }
  });

  const onSubmit = async (data) => {
    try {
      // Remove confirmPassword before sending to server
      const { confirmPassword, ...registerData } = data;
      await registerAction(registerData);
      navigate('/dashboard');
    } catch (err) {
      // Handled in Context
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans cyber-grid flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Decorative Blur */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400 mb-4 glow-red">
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-slate-100">
            Create Operator Credential
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1.5">
            REGISTER TO COMMENCE PLATFORM ASSIGNMENTS
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-slate-800 relative glow-blue shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 block uppercase">
                Operator Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name')}
                  className={`w-full bg-slate-950/80 border ${
                    errors.name ? 'border-rose-500/40 focus:border-rose-500' : 'border-slate-800 focus:border-sky-500'
                  } text-sm pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-sky-500/20 outline-none transition duration-200 text-slate-200 placeholder-slate-600`}
                />
              </div>
              {errors.name && (
                <p className="text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>●</span> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 block uppercase">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="analyst@threatscope.local"
                  {...register('email')}
                  className={`w-full bg-slate-950/80 border ${
                    errors.email ? 'border-rose-500/40 focus:border-rose-500' : 'border-slate-800 focus:border-sky-500'
                  } text-sm pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-sky-500/20 outline-none transition duration-200 text-slate-200 placeholder-slate-600`}
                />
              </div>
              {errors.email && (
                <p className="text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>●</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Role selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 block uppercase">
                Assigned Platform Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </span>
                <select
                  {...register('role')}
                  className="w-full bg-slate-950/80 border border-slate-800 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition duration-200 text-slate-200 appearance-none cursor-pointer"
                >
                  <option value="analyst">Security Analyst</option>
                  <option value="admin">SOC Administrator</option>
                </select>
              </div>
              {errors.role && (
                <p className="text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>●</span> {errors.role.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 block uppercase">
                Cipher Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`w-full bg-slate-950/80 border ${
                    errors.password ? 'border-rose-500/40 focus:border-rose-500' : 'border-slate-800 focus:border-sky-500'
                  } text-sm pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-sky-500/20 outline-none transition duration-200 text-slate-200 placeholder-slate-600`}
                />
              </div>
              {errors.password && (
                <p className="text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>●</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold tracking-wider text-slate-400 block uppercase">
                Confirm Cipher Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={`w-full bg-slate-950/80 border ${
                    errors.confirmPassword ? 'border-rose-500/40 focus:border-rose-500' : 'border-slate-800 focus:border-sky-500'
                  } text-sm pl-10 pr-4 py-2.5 rounded-xl focus:ring-1 focus:ring-sky-500/20 outline-none transition duration-200 text-slate-200 placeholder-slate-600`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-[10px] font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>●</span> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Register operator credentials</span>
                </>
              )}
            </button>

          </form>

          {/* Prompt to login */}
          <div className="mt-6 text-center border-t border-slate-900 pt-4">
            <p className="text-xs text-slate-500">
              Already have credentials?{' '}
              <Link
                to="/login"
                className="text-sky-400 hover:text-sky-300 font-semibold transition duration-150"
              >
                Log in to portal
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Register;
