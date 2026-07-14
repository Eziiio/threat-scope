import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Terminal, Loader2 } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';

// Define form validation schema using Zod
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const Login = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      // Handled in Context toast
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans cyber-grid flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Glow decorative rings */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-sky-500/10 rounded-xl border border-sky-500/20 text-sky-400 mb-4 glow-blue">
            <Shield className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-display font-extrabold tracking-tight text-slate-100">
            ThreatScope Portal
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1.5">
            LOG IN TO COMMENCE TELEMETRY SCANS
          </p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-2xl p-8 border border-slate-800 relative glow-blue shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Email input */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold tracking-wider text-slate-400 block uppercase">
                Operator Email
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
                  } text-sm pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-sky-500/20 outline-none transition duration-200 text-slate-200 placeholder-slate-600`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>●</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-semibold tracking-wider text-slate-400 block uppercase">
                  Cipher Password
                </label>
              </div>
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
                  } text-sm pl-10 pr-4 py-3 rounded-xl focus:ring-1 focus:ring-sky-500/20 outline-none transition duration-200 text-slate-200 placeholder-slate-600`}
                />
              </div>
              {errors.password && (
                <p className="text-[11px] font-mono text-rose-400 mt-1 flex items-center gap-1.5">
                  <span>●</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>Authenticate Operator</span>
                </>
              )}
            </button>

          </form>

          {/* Prompt to register */}
          <div className="mt-8 text-center border-t border-slate-900 pt-6">
            <p className="text-xs text-slate-500">
              Need access?{' '}
              <Link
                to="/register"
                className="text-sky-400 hover:text-sky-300 font-semibold transition duration-150"
              >
                Register new operator credential
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;
