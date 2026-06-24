import React, { useState, useEffect } from 'react';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notificationApi';
import { toast } from 'react-toastify';

const NotificationSettings: React.FC = () => {
   const [loading, setLoading] = useState(true);
   const [settings, setSettings] = useState({
      healthAlerts: true,
      doctorNotifications: true,
      personalizedAds: false,
      systemUpdates: true,
      ticketUpdates: true
   });

   useEffect(() => {
      fetchSettings();
   }, []);

   const fetchSettings = async () => {
      try {
         setLoading(true);
         const res = await getNotificationPreferences();
         if (res.data.success) {
            setSettings(res.data.data.settings);
         }
      } catch (error) {
         console.error('Error fetching settings:', error);
      } finally {
         setLoading(false);
      }
   };

   const handleToggle = async (key: keyof typeof settings) => {
      const newSettings = { ...settings, [key]: !settings[key] };
      setSettings(newSettings);
      try {
         const res = await updateNotificationPreferences({ settings: newSettings });
         if (res.data.success) {
            toast.success('Preferences updated');
         }
      } catch (error) {
         toast.error('Failed to update preferences');
         // Revert state on error
         setSettings(settings);
      }
   };

   if (loading) return <div className="p-20 text-center">Loading settings...</div>;

   return (
      <section className="py-10 lg:py-18">
         <div className="container">
            <div className="bg-white rounded-[15px] shadow-sm">
               {/* Header */}
               <div className="flex justify-between items-center p-[20px] border-b border-[#F1F5F9]">
                  <h1 className="headings-web-h4-headline bold text-[#1E293B]">
                     Notification Settings
                  </h1>
               </div>
               {/* Content */}
               <div className="p-[20px] md:p-[30px]">
                  <div className="space-y-12">
                     {/* Health & Safety */}
                     <div>
                        <h2 className="headings-web-h6-headline text-[#1E293B] mb-6">
                           Health & Safety
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="flex items-center justify-between p-[20px] bg-[#F8FAFC] rounded-[16px] border border-[#F1F5F9]">
                              <div>
                                 <p className="font-['AeonikBold'] text-[#334155] mb-1">Health Alerts</p>
                                 <p className="text-sm text-[#64748B]">Emergency alerts from wearable devices</p>
                              </div>
                              <Toggle
                                 enabled={settings.healthAlerts}
                                 onClick={() => handleToggle('healthAlerts')}
                              />
                           </div>
                           <div className="flex items-center justify-between p-[20px] bg-[#F8FAFC] rounded-[16px] border border-[#F1F5F9]">
                              <div>
                                 <p className="font-['AeonikBold'] text-[#334155] mb-1">Doctor Notifications</p>
                                 <p className="text-sm text-[#64748B]">Auto-notify doctor on health anomalies</p>
                              </div>
                              <Toggle
                                 enabled={settings.doctorNotifications}
                                 onClick={() => handleToggle('doctorNotifications')}
                              />
                           </div>
                        </div>
                     </div>

                     {/* Communication Preferences */}
                     <div>
                        <h2 className="headings-web-h6-headline text-[#1E293B] mb-6">
                           Communication & Updates
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="flex items-center justify-between p-[20px] bg-[#F8FAFC] rounded-[16px] border border-[#F1F5F9]">
                              <div>
                                 <p className="font-['AeonikBold'] text-[#334155] mb-1">System Updates</p>
                                 <p className="text-sm text-[#64748B]">New features and platform changes</p>
                              </div>
                              <Toggle
                                 enabled={settings.systemUpdates}
                                 onClick={() => handleToggle('systemUpdates')}
                              />
                           </div>
                           <div className="flex items-center justify-between p-[20px] bg-[#F8FAFC] rounded-[16px] border border-[#F1F5F9]">
                              <div>
                                 <p className="font-['AeonikBold'] text-[#334155] mb-1">Ticket Responses</p>
                                 <p className="text-sm text-[#64748B]">Updates on your support tickets</p>
                              </div>
                              <Toggle
                                 enabled={settings.ticketUpdates}
                                 onClick={() => handleToggle('ticketUpdates')}
                              />
                           </div>
                        </div>
                     </div>

                     {/* Marketing */}
                     <div>
                        <h2 className="headings-web-h6-headline text-[#1E293B] mb-6">
                           Promotions
                        </h2>
                        <div className="max-w-md">
                           <div className="flex items-center justify-between p-[20px] bg-[#F8FAFC] rounded-[16px] border border-[#F1F5F9]">
                              <div>
                                 <p className="font-['AeonikBold'] text-[#334155] mb-1">Personalized Ads</p>
                                 <p className="text-sm text-[#64748B]">Receive relevant tips and health insights</p>
                              </div>
                              <Toggle
                                 enabled={settings.personalizedAds}
                                 onClick={() => handleToggle('personalizedAds')}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>
   );
};
export default NotificationSettings;
/* ---------------- Toggle Component ---------------- */
const Toggle = ({
   enabled,
   onClick,
}: {
   enabled: boolean;
   onClick: () => void;
}) => (
   <button
      onClick={onClick}
      className={`w-[46px] h-[24px] rounded-full relative transition-colors ${enabled ? 'bg-[#9146C1]' : 'bg-slate-300'
         }`}
   >
      <span
         className={`absolute top-[3px] w-[18px] h-[18px] bg-white rounded-full transition-all ${enabled ? 'right-[3px]' : 'left-[3px]'
            }`}
      />
   </button>
);
