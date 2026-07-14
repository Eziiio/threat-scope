import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export const Layout = () => {
  return (
    <div className="flex bg-[#030712] min-h-screen text-[#f3f4f6] font-sans">
      
      {/* Navigation Sidebar Panel */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Control Panel */}
        <Header />
        
        {/* Scrollable View Panel */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#030712]">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default Layout;
