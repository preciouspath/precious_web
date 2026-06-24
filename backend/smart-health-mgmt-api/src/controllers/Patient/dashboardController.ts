import { Request, Response } from "express";
import user from "../../models/user";
import HealthHistory from "../../models/HealthHistory";

const parseSleepHours = (sleepValue: any) => {
    if (!sleepValue) return 0;
    if (typeof sleepValue === 'number') return sleepValue;
    if (typeof sleepValue === 'string') {
        const hoursMatch = sleepValue.match(/(\d+(?:\.\d+)?)\s*h/i);
        const minsMatch = sleepValue.match(/(\d+)\s*m/i);
        const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
        return hours + (minsMatch ? parseInt(minsMatch[1], 10) / 60 : 0);
    }
    return 0;
};

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const userModel = user as any;
        const person = await userModel.findOne({ _id: userId }).exec();

        if (!person) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let todayData = await HealthHistory.findOne({
            userId: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (!todayData) {
            const health = person.healthProfile || {};
            const smartwatch = health.smartwatch || {};
            const watchData = smartwatch.data || {};

            const normalizedSteps = Number(watchData.steps) || 0;
            const normalizedHeartRate = Number(watchData.heartRate) || 0;
            const normalizedBloodOxygen = Number(watchData.bloodOxygen) || 0;
            const normalizedSleepHours = parseSleepHours(watchData.sleep);
            const bloodPressure = watchData.bloodPressure || "--/--";

            if (normalizedSteps || normalizedHeartRate || normalizedBloodOxygen) {
                todayData = await HealthHistory.findOneAndUpdate(
                    {
                        userId: userId,
                        date: {
                            $gte: today,
                            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                        }
                    },
                    {
                        $set: {
                            steps: normalizedSteps,
                            heartRate: normalizedHeartRate,
                            bloodOxygen: normalizedBloodOxygen,
                            sleepHours: normalizedSleepHours,
                            bloodPressure,
                            source: "fitbit"
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
            } else {
                todayData = await HealthHistory.findOne({ userId: userId }).sort({ date: -1 });
            }
        }

        const stats = {
            heartRate: todayData?.heartRate || 0,
            steps: todayData?.steps || 0,
            bloodOxygen: todayData?.bloodOxygen || 0,
            sleepScore: todayData?.sleepHours || 0,
            bloodPressure: todayData?.bloodPressure || "--/--"
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};

export const getHealthTrends = async (req: Request, res: Response) => {
    try {
        const { period } = req.query;
        const userId = (req as any).user?.id;

        const now = new Date();
        let startDate: Date;

        if (period === 'monthly') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 6); // Last 7 days
        }

        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);

        let historyData = await HealthHistory.find({
            userId: userId,
            date: {
                $gte: startDate,
                $lte: endDate,
            }
        }).sort({ date: 1 });

        if (historyData.length === 0) {
            const userModel = user as any;
            const person = await userModel.findOne({ _id: userId }).exec();
            const health = person?.healthProfile || {};
            const smartwatch = health.smartwatch || {};
            const watchData = smartwatch.data || {};

            const normalizedSteps = Number(watchData.steps) || 0;
            const normalizedHeartRate = Number(watchData.heartRate) || 0;
            const normalizedBloodOxygen = Number(watchData.bloodOxygen) || 0;
            const normalizedSleepHours = typeof watchData.sleep === 'string' ?
                (() => {
                    const hoursMatch = watchData.sleep.match(/(\d+(?:\.\d+)?)\s*h/i);
                    const minsMatch = watchData.sleep.match(/(\d+)\s*m/i);
                    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
                    return hours + (minsMatch ? parseInt(minsMatch[1], 10) / 60 : 0);
                })() : Number(watchData.sleep) || 0;

            if (normalizedSteps || normalizedHeartRate || normalizedBloodOxygen) {
                const todayDate = new Date();
                todayDate.setHours(0, 0, 0, 0);

                const todayRecord = await HealthHistory.findOneAndUpdate(
                    {
                        userId: userId,
                        date: {
                            $gte: todayDate,
                            $lt: new Date(todayDate.getTime() + 24 * 60 * 60 * 1000)
                        }
                    },
                    {
                        $set: {
                            userId: userId,
                            date: todayDate,
                            steps: normalizedSteps,
                            heartRate: normalizedHeartRate,
                            bloodOxygen: normalizedBloodOxygen,
                            sleepHours: normalizedSleepHours,
                            bloodPressure: watchData.bloodPressure || "--/--",
                            source: "fitbit"
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );

                if (todayRecord) {
                    historyData = [todayRecord];
                }
            }
        }

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const historyMap = new Map<string, any>();
        historyData.forEach((record: any) => {
            const recordDate = record.date.toISOString().split('T')[0];
            historyMap.set(recordDate, record);
        });

        const chartData: any[] = [];
        if (period === 'monthly') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthLabel = monthNames[startDate.getMonth()];
            const currentDay = endDate.getDate();
            const bucketStarts = [1, 8, 15, 22, 29];
            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();

            for (let index = 0; index < bucketStarts.length; index++) {
                const bucketStart = bucketStarts[index];
                if (bucketStart > currentDay) break;

                const nextStart = bucketStarts[index + 1] || daysInMonth + 1;
                const bucketEnd = Math.min(nextStart - 1, currentDay);
                const bucketLabel = bucketStart === bucketEnd
                    ? `${bucketStart} ${monthLabel}`
                    : `${bucketStart}-${bucketEnd} ${monthLabel}`;

                let bucketSteps = 0;
                for (let day = bucketStart; day <= bucketEnd; day++) {
                    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
                    const dateKey = currentDate.toISOString().split('T')[0];
                    bucketSteps += historyMap.get(dateKey)?.steps || 0;
                }

                chartData.push({
                    label: bucketLabel,
                    date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(bucketStart).padStart(2, '0')}`,
                    steps: bucketSteps,
                    heartRate: 0,
                    bloodOxygen: 0,
                    sleepHours: 0,
                });
            }
        } else {
            const totalDays = 7;
            for (let i = 0; i < totalDays; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const isoDate = currentDate.toISOString().split('T')[0];
                const record = historyMap.get(isoDate);
                const label = daysOfWeek[currentDate.getDay()];

                chartData.push({
                    day: label,
                    label,
                    date: isoDate,
                    steps: record?.steps || 0,
                    heartRate: record?.heartRate || 0,
                    bloodOxygen: record?.bloodOxygen || 0,
                    sleepHours: record?.sleepHours || 0
                });
            }
        }

        const totalRecords = chartData.length;
        const avgSteps = totalRecords > 0 ? Math.round(
            chartData.reduce((sum: number, r: any) => sum + (r.steps || 0), 0) / totalRecords
        ) : 0;
        const avgHeartRate = totalRecords > 0 ? Math.round(
            chartData.reduce((sum: number, r: any) => sum + (r.heartRate || 0), 0) / totalRecords
        ) : 0;
        const avgBloodOxygen = totalRecords > 0 ? Math.round(
            chartData.reduce((sum: number, r: any) => sum + (r.bloodOxygen || 0), 0) / totalRecords
        ) : 0;

        res.json({
            success: true,
            data: chartData,
            summary: {
                averageSteps: avgSteps,
                averageHeartRate: avgHeartRate,
                averageBloodOxygen: avgBloodOxygen,
                period: period
            }
        });
    } catch (error) {
        console.error("Dashboard Trends Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error", error });
    }
};
