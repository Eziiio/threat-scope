import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import SkeletonLoader from './components/SkeletonLoader.jsx';
import { Lock } from 'lucide-react';

// Lazy load page components
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

// Mini unauthorized page
const Unauthorized = () => (
  <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans cyber-grid flex flex-col items-center justify-center p-6">
    <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-rose-500/20 text-center relative glow-red">
      <div className="inline-flex p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 mb-4">
        <Lock className="w-8 h-8 animate-bounce" />
      </div>
      <h2 className="text-xl font-display font-extrabold text-rose-500 mb-2">ACCESS DEVIATION DETECTED</h2>
      <p className="text-xs font-mono text-slate-400 mb-6">Cleared security level mismatch. Operations logged.</p>
      <Navigate to="/dashboard" replace />
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={<SkeletonLoader />}>
            <Routes>
              
              {/* Guest-Only routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* Private Analyst/Admin routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              
            </Routes>
          </Suspense>
        </Router>
        
        {/* Hot Toaster for alerts notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0b0f19',
              color: '#f3f4f6',
              border: '1px solid #1e293b',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px'
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#030712'
              }
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#030712'
              }
            }
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
