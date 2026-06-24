import React, { useState } from 'react';
import { getDashboardStats, getHealthTrends } from '../api/healthApi';
import AdBanner from '../components/AdBanner';
import HealthChart from '../components/HealthChart';
import { socketService } from '../utils/socketService';
import { useAuthStore } from '../store/authStore';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly'>('weekly');
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();

  React.useEffect(() => {
    fetchDashboardData();
  }, [activeTab]);

  // Real-time updates via Socket.io
  React.useEffect(() => {
    if (user?._id) {
      socketService.connect();
      socketService.joinRoom(user._id);

      socketService.onSmartwatchUpdate((newData: any) => {
        console.log("Real-time SMARTWATCH DATA received:", newData);
        setStats((prevStats: any) => ({
          ...prevStats,
          ...newData
        }));
      });

      return () => {
        socketService.offSmartwatchUpdate();
      };
    }
  }, [user?._id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes] = await Promise.all([
        getDashboardStats(),
        getHealthTrends(activeTab)
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (trendsRes.data.success) {
        setTrends(trendsRes.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  // Fallback to defaults if stats missing
  const heartRate = stats?.heartRate || 0;
  const steps = stats?.steps || 0;
  const bloodOxygen = stats?.bloodOxygen || 0;
  const sleepScore = stats?.sleepScore || 0;
  const bloodPressure = stats?.bloodPressure || "--/--";

  const stepsGoal = 10000;
  const stepsPercentage = steps > 0 ? Math.min(Math.round((steps / stepsGoal) * 100), 100) : 0;
  const stepsFraction = stepsPercentage / 100;

  const boPercentage = Math.min(Number(bloodOxygen) || 0, 100);
  const boFraction = boPercentage / 100;

  const averageSteps = trends.length
    ? Math.round(trends.reduce((sum: number, d: any) => sum + (d.steps || 0), 0) / trends.length)
    : Math.round(steps);

  return (
    <section className="py-10 lg:py-18">
      <div className="container">
        <div className='bg-white rounded-[15px]'>
          <h1 className="headings-web-h4-headline bold text-[#374151] p-[15px] border-b border-[#F1F5F9]">Dashboard</h1>

          <div className='p-[15px] md:p-[20px]'>
            {/* Top Row Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              {/* Heart Rate Card */}
              <div className="md:col-span-4 bg-white rounded-[10px] border border-[#F1F5F9] p-[15px] shadow-[0px_3px_24px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-[45px] h-[45px] bg-[#F4ECFB] rounded-full flex items-center justify-center">
                    <img src="/images/d-icon1.svg" alt="d-icon" />
                  </div>
                  <div className="flex flex-col gap-[5px]">
                    <p className="body-text-body-1 !text-[#6B7280]">Heart Rate</p>
                    <p className="body-text-body-1 !text-[#008236]">Normal</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center py-4">
                  <svg viewBox="0 0 100 30" className="w-full h-16 text-purple-500">
                    <path
                      d="M0,25 L10,25 L20,15 L25,25 L30,5 L35,25 L40,15 L50,25 L70,25 L80,10 L90,25 L100,25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                <div className="mt-2">
                  <h2 className="headings-web-h5-headline bold text-slate-800">{heartRate} bpm</h2>
                </div>
              </div>

              {/* Steps Card */}
              <div className="md:col-span-4 bg-white rounded-[10px] border border-[#F1F5F9] p-[15px] shadow-[0px_3px_24px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-[45px] h-[45px] bg-[#FEF9C2] rounded-full flex items-center justify-center">
                    <img src="/images/d-icon2.svg" alt="d-icon" />
                  </div>
                  <div className="flex flex-col gap-[5px]">
                    <p className="body-text-body-1 !text-[#6B7280]">Steps</p>
                    <p className="body-text-body-1 !text-[#FDC700]">Caution</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#F1F5F9" strokeWidth="6" fill="none" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#FBBF24"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - stepsFraction)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold other-fonts-caption-text text-[#374151]">
                      <span>{steps.toLocaleString()}</span>
                      <span className="text-[10px] font-medium text-slate-500">steps</span>
                    </div>
                  </div>
                  <h2 className="headings-web-h5-headline bold text-[#374151]">{steps.toLocaleString()}</h2>
                </div>
              </div>

              {/* Blood Oxygen Card */}
              <div className="md:col-span-4 bg-white rounded-[10px] border border-[#F1F5F9] p-[15px] shadow-[0px_3px_24px_rgba(0,0,0,0.05)] flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-[45px] h-[45px] bg-[#DCFCE7] rounded-full flex items-center justify-center">
                    <img src="/images/d-icon3.svg" alt="d-icon" />
                  </div>
                  <div className="flex flex-col gap-[5px]">
                    <p className="body-text-body-1 !text-[#6B7280]">Blood Oxygen</p>
                    <p className="body-text-body-1 !text-[#008236]">Stable</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#F1F5F9" strokeWidth="6" fill="none" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#10B981"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - boFraction)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold other-fonts-caption-text text-[#374151]">
                      {boPercentage}%
                    </span>
                  </div>
                  <h2 className="headings-web-h5-headline bold text-[#374151]">{bloodOxygen}%</h2>
                </div>
              </div>
            </div>

            {/* Second Row Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Sleep Card */}
              <div className="bg-white rounded-2xl border border-slate-50 p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[180px]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-[45px] h-[45px] bg-[#DFF2FE] rounded-full flex items-center justify-center">
                    <img src="/images/d-icon4.svg" alt="d-icon" />
                  </div>
                  <div className="flex flex-col gap-[5px]">
                    <p className="body-text-body-1 !text-[#6B7280]">Sleep</p>
                    <p className="body-text-body-1 !text-[#FDC700]">Improve</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="#F1F5F9" strokeWidth="6" fill="none" />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#0EA5E9"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - Math.min(sleepScore / 24, 1))}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] leading-tight text-slate-500 font-bold other-fonts-caption-text">
                      <span>{sleepScore.toFixed(1)}</span>
                      <span className="text-[10px] font-medium text-slate-500">hrs</span>
                    </div>
                  </div>
                  <h2 className="headings-web-h5-headline bold text-[#374151]">{sleepScore.toFixed(1)} hrs</h2>
                </div>
              </div>

              {/* Blood Pressure Card */}
              <div className="bg-white rounded-2xl border border-slate-50 p-6 shadow-[0px_2px_10px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[180px]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-[45px] h-[45px] bg-[#FFE2E2] rounded-full flex items-center justify-center">
                    <img src="/images/d-icon5.svg" alt="d-icon" className='h-[23px]' />
                  </div>
                  <div className="flex flex-col gap-[5px]">
                    <p className="body-text-body-1 !text-[#6B7280]">Blood Pressure</p>
                    <p className="body-text-body-1 !text-[#D08700]">Caution</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <h2 className="headings-web-h5-headline bold text-[#374151]">{bloodPressure} mmHg</h2>
                  <div className="flex items-end gap-1.5 h-20">
                    <div className="w-4 bg-slate-100 rounded-sm h-[35%] opacity-50"></div>
                    <div className="w-4 bg-slate-100 rounded-sm h-[25%] opacity-50"></div>
                    <div className="w-4 bg-yellow-200 rounded-sm h-[55%]"></div>
                    <div className="w-4 bg-yellow-400 rounded-sm h-[85%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <AdBanner />

            {/* Unified Health Metrics Chart */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-lg">
              <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Steps Performance
                  </h2>
                  <p className="text-sm text-slate-500">
                    {activeTab === 'weekly' ? 'Last 7 days' : 'Last 30 days'} step count overview.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('weekly')}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeTab === 'weekly'
                        ? 'bg-[#9146C1] text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setActiveTab('monthly')}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                      activeTab === 'monthly'
                        ? 'bg-[#9146C1] text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <HealthChart
                data={trends}
                period={activeTab}
                summary={{
                  averageSteps: averageSteps
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Dashboard;
