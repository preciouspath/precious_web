import React, { useState, useEffect } from 'react';
import { Bell, Mail, Calendar, DollarSign, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notificationApi';
import Loader from '../components/common/Loader';

interface NotificationFormData {
    adApprovals: boolean;
    systemUpdates: boolean;
    ticketUpdates: boolean;
    personalizedAds: boolean;
}

const NotificationPreferences: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { register, handleSubmit, setValue } = useForm<NotificationFormData>();

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const response = await getNotificationPreferences();
            if (response.data.success) {
                const settings = response.data.data;
                setValue('adApprovals', settings.settings?.adApprovals ?? true);
                setValue('systemUpdates', settings.settings?.systemUpdates ?? true);
                setValue('ticketUpdates', settings.settings?.ticketUpdates ?? true);
                setValue('personalizedAds', settings.settings?.personalizedAds ?? true);
            }
        } catch (error) {
            // toast.error('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: NotificationFormData) => {
        try {
            setSaving(true);
            const response = await updateNotificationPreferences({ settings: data });
            if (response.data.success) {
                toast.success('Notification preferences updated successfully');
            }
        } catch (error) {
            toast.error('Failed to update preferences');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="max-w-[1200px] mx-auto font-['AeonikRegular']">
            <div className="mb-8">
                <h1 className="headings-web-h4-headline text-slate-900">Notification Preferences</h1>
                <p className="body-text-body-2 text-slate-500 mt-1">Manage how you receive updates and alerts</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Notifications */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center text-[#9146C1]">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h3 className="headings-web-h6-headline text-slate-900">Email Notifications</h3>
                            <p className="text-xs text-slate-400 font-['AeonikMedium']">Receive important updates via email</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-slate-400" />
                                <div>
                                    <p className="font-['AeonikBold'] text-sm text-slate-900">Ad Approval/Rejection Alerts</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Get notified when your ads are reviewed</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                {...register('adApprovals')}
                                className="w-5 h-5 text-[#9146C1] rounded focus:ring-[#9146C1] cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between p-5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Bell size={18} className="text-slate-400" />
                                <div>
                                    <p className="font-['AeonikBold'] text-sm text-slate-900">Platform Updates</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Receive news about new features and changes</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                {...register('systemUpdates')}
                                className="w-5 h-5 text-[#9146C1] rounded focus:ring-[#9146C1] cursor-pointer"
                            />
                        </label>
                    </div>
                </div>

                {/* In-App Alerts */}
                <div className="bg-white rounded-lg border border-slate-100 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                            <Bell size={24} />
                        </div>
                        <div>
                            <h3 className="headings-web-h6-headline text-slate-900">Support & Feedback</h3>
                            <p className="text-xs text-slate-400 font-['AeonikMedium']">Notifications about your support tickets</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <Calendar size={18} className="text-slate-400" />
                                <div>
                                    <p className="font-['AeonikBold'] text-sm text-slate-900">Support Ticket Status Alerts</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Updates when your support tickets are responded to</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                {...register('ticketUpdates')}
                                className="w-5 h-5 text-[#9146C1] rounded focus:ring-[#9146C1] cursor-pointer"
                            />
                        </label>

                        <label className="flex items-center justify-between p-5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">
                            <div className="flex items-center gap-3">
                                <DollarSign size={18} className="text-slate-400" />
                                <div>
                                    <p className="font-['AeonikBold'] text-sm text-slate-900">Personalized Insights & Ads</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Receive relevant tips and promotional content</p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                {...register('personalizedAds')}
                                className="w-5 h-5 text-[#9146C1] rounded focus:ring-[#9146C1] cursor-pointer"
                            />
                        </label>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-medical flex items-center gap-2 min-w-[200px] justify-center disabled:opacity-50"
                    >
                        {saving ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <Save size={16} /> Save Preferences
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationPreferences;
