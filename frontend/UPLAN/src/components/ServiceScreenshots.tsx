import React from 'react';

// Screenshot-style preview components for the homepage services section
// These represent actual views from the U PLAN application

export const TimetableGenerationScreenshot = () => {
  return (
    <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 overflow-hidden">
      {/* Mini timetable view */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm h-full p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-gray-700 dark:text-gray-300">Weekly Study Schedule</h3>
          <div className="text-xs text-gray-500">Mon - Fri</div>
        </div>
        
        {/* Timetable grid */}
        <div className="grid grid-cols-5 gap-1 h-[calc(100%-2rem)]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIdx) => (
            <div key={day} className="flex flex-col gap-1">
              <div className="text-xs text-center text-gray-600 dark:text-gray-400 mb-1">{day}</div>
              
              {/* Study sessions */}
              {dayIdx % 2 === 0 ? (
                <>
                  <div className="bg-blue-500 rounded px-1 py-1 text-white flex-1 flex items-center justify-center">
                    <span className="text-[0.5rem]">Math</span>
                  </div>
                  <div className="bg-green-500 rounded px-1 py-1 text-white flex-1 flex items-center justify-center">
                    <span className="text-[0.5rem]">Physics</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-purple-500 rounded px-1 py-1 text-white flex-1 flex items-center justify-center">
                    <span className="text-[0.5rem]">Chem</span>
                  </div>
                  <div className="bg-orange-500 rounded px-1 py-1 text-white flex-1 flex items-center justify-center">
                    <span className="text-[0.5rem]">Bio</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdaptiveUpdatesScreenshot = () => {
  return (
    <div className="w-full h-48 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 overflow-hidden">
      {/* Drag and drop / update interface */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm h-full p-3 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-xs text-gray-700 dark:text-gray-300">Real-time Updates</h3>
        </div>
        
        {/* Session cards being updated */}
        <div className="space-y-2 flex-1">
          <div className="bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 border-dashed rounded p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-blue-500 rounded"></div>
              <div>
                <div className="text-xs text-gray-700 dark:text-gray-300">Mathematics</div>
                <div className="text-[0.6rem] text-gray-500">Rescheduled</div>
              </div>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400">→</div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-green-500 rounded"></div>
              <div>
                <div className="text-xs text-gray-700 dark:text-gray-300">Physics</div>
                <div className="text-[0.6rem] text-green-600 dark:text-green-400">Auto-adjusted</div>
              </div>
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">✓</div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-8 bg-orange-500 rounded"></div>
              <div>
                <div className="text-xs text-gray-700 dark:text-gray-300">Chemistry</div>
                <div className="text-[0.6rem] text-orange-600 dark:text-orange-400">Pending</div>
              </div>
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">⟳</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProgressTrackingScreenshot = () => {
  return (
    <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 overflow-hidden">
      {/* Progress dashboard */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm h-full p-3">
        <h3 className="text-xs text-gray-700 dark:text-gray-300 mb-3">Study Progress</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
            <div className="text-[0.6rem] text-gray-500 dark:text-gray-400">Completed</div>
            <div className="text-lg text-blue-700 dark:text-blue-400">24</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded p-2">
            <div className="text-[0.6rem] text-gray-500 dark:text-gray-400">Hours</div>
            <div className="text-lg text-green-600 dark:text-green-400">48</div>
          </div>
        </div>
        
        {/* Mini progress bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[0.6rem] text-gray-600 dark:text-gray-400 mb-1">
              <span>Mathematics</span>
              <span>85%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[0.6rem] text-gray-600 dark:text-gray-400 mb-1">
              <span>Physics</span>
              <span>72%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '72%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[0.6rem] text-gray-600 dark:text-gray-400 mb-1">
              <span>Chemistry</span>
              <span>63%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '63%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExamIntegrationScreenshot = () => {
  return (
    <div className="w-full h-48 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 overflow-hidden">
      {/* Exam schedule view */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm h-full p-3">
        <h3 className="text-xs text-gray-700 dark:text-gray-300 mb-3">Upcoming Exams</h3>
        
        <div className="space-y-2">
          <div className="bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500 rounded p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-700 dark:text-gray-300">Mathematics Final</div>
                <div className="text-[0.6rem] text-gray-500">Dec 15, 2025</div>
              </div>
              <div className="bg-red-500 text-white text-[0.6rem] px-2 py-1 rounded">
                3 days
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border-l-2 border-orange-500 rounded p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-700 dark:text-gray-300">Physics Midterm</div>
                <div className="text-[0.6rem] text-gray-500">Dec 18, 2025</div>
              </div>
              <div className="bg-orange-500 text-white text-[0.6rem] px-2 py-1 rounded">
                6 days
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500 rounded p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-700 dark:text-gray-300">Chemistry Quiz</div>
                <div className="text-[0.6rem] text-gray-500">Dec 20, 2025</div>
              </div>
              <div className="bg-blue-500 text-white text-[0.6rem] px-2 py-1 rounded">
                8 days
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500 rounded p-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-700 dark:text-gray-300">Biology Test</div>
                <div className="text-[0.6rem] text-gray-500">Dec 22, 2025</div>
              </div>
              <div className="bg-green-500 text-white text-[0.6rem] px-2 py-1 rounded">
                10 days
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
