export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse select-none">
      
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-900 h-32 rounded-2xl p-6 flex flex-col justify-between">
            <div className="w-1/3 bg-slate-800 h-4 rounded"></div>
            <div className="w-2/3 bg-slate-800 h-8 rounded mt-3"></div>
            <div className="w-1/2 bg-slate-800 h-3 rounded mt-2"></div>
          </div>
        ))}
      </div>

      {/* Grid for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-900 h-[380px] rounded-2xl p-6">
          <div className="w-1/4 bg-slate-800 h-5 rounded mb-6"></div>
          <div className="w-full bg-slate-950/60 h-64 rounded-xl"></div>
        </div>
        <div className="bg-slate-900/40 border border-slate-900 h-[380px] rounded-2xl p-6">
          <div className="w-1/3 bg-slate-800 h-5 rounded mb-6"></div>
          <div className="w-full bg-slate-950/60 h-64 rounded-xl"></div>
        </div>
      </div>

      {/* Grid for Lists/Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/40 border border-slate-900 h-[400px] rounded-2xl p-6">
          <div className="w-1/4 bg-slate-800 h-5 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="w-1/2 bg-slate-800 h-4 rounded"></div>
                <div className="w-1/6 bg-slate-800 h-4 rounded"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900/40 border border-slate-900 h-[400px] rounded-2xl p-6">
          <div className="w-1/4 bg-slate-800 h-5 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="w-1/2 bg-slate-800 h-4 rounded"></div>
                <div className="w-1/6 bg-slate-800 h-4 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardSkeleton;
