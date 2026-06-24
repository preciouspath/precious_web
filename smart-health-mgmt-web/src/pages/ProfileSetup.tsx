import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { updateProfileApi, getMe } from '../api/authApi';
import { getFitbitAuthUrl } from '../api/fitbitApi';
import { toast } from 'react-toastify';
import Loader from '../components/common/Loader';
import { CheckCircle, Download, Share2, QrCode } from 'lucide-react';
import useAuthStore from '../store/authStore';

// Phone library imports
import PhoneInput, { parsePhoneNumber, isValidPhoneNumber } from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';
import 'react-phone-number-input/style.css';

type ProfileForm = {
    dateOfBirth: string;
    gender: string;
    height: string;
    weight: string;
    bloodGroup: string;
    systolic: string;
    diastolic: string;
    healthConditions: string;
    emergencyContact: {
        name: string;
        phone: string;
        relation: string;
    };
    consent: boolean;
};

const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, isInitialized, initialize } = useAuthStore();
    
    const initialStep = parseInt(searchParams.get('step') || '1') as 1 | 2 | 3;
    const [step, setStep] = useState<1 | 2 | 3>(initialStep);
    const [smartwatchConnected, setSmartwatchConnected] = useState(false);
    const [connectingDevice, setConnectingDevice] = useState<string | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [showPermissions, setShowPermissions] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);

    useEffect(() => {
        // Fetch user data to get QR code
        const loadUserData = async () => {
            if (!isInitialized) {
                initialize();
                return;
            }

            if (!isAuthenticated) {
                navigate('/login');
                return;
            }
            try {
                const res = await getMe();
                if (res?.data?.qrCode) {
                    setQrCode(res.data.qrCode);
                }

                // If user already has a connected smartwatch, update the local state
                if (res?.data?.healthProfile?.smartwatch?.connected) {
                    setSmartwatchConnected(true);
                    setSelectedDevice(res.data.healthProfile.smartwatch.type);
                }
            } catch {
                // User data will be fetched later
            }
        };
        loadUserData();
    }, [step, isAuthenticated, isInitialized, initialize, navigate]);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ProfileForm>({
        defaultValues: {
            healthConditions: ""
        },
        mode: 'onSubmit',
    });

    // const { fields, append, remove } = useFieldArray({
    //     control,
    //     name: "healthConditions"
    // });

    const mutation = useMutation({
        mutationFn: (data: any) => updateProfileApi(data),
        onSuccess: (_data: any) => {
            // Profile Saved, move to Smartwatch step
            setStep(2);
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || 'Update failed';
            toast.error(msg, { toastId: 'profile-error' });
        }
    });

    const onSubmit = (data: ProfileForm) => {
        if (!isAuthenticated) {
            toast.error("User session not found. Please login again.");
            navigate('/login');
            return;
        }

        // Process Emergency Contact
        let ecCountryCode = "+1";
        let ecPhoneOnly = data.emergencyContact.phone;
        let ecCountryName = "United States";

        if (data.emergencyContact.phone) {
            const ecParsed = parsePhoneNumber(data.emergencyContact.phone);
            if (ecParsed) {
                ecCountryCode = `+${ecParsed.countryCallingCode}`;
                ecPhoneOnly = ecParsed.nationalNumber;
                ecCountryName = en[ecParsed.country as keyof typeof en] || "United States";
            }
        }

        const payload = {
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            bloodGroup: data.bloodGroup,
            height: data.height,
            weight: data.weight,
            bloodPressure: `${data.systolic}/${data.diastolic}`,
            healthConditions: data.healthConditions?.trim() || "",
            emergencyContact: {
                name: data.emergencyContact.name || "Emergency Contact",
                phone: ecPhoneOnly,
                countryCode: ecCountryCode,
                countryName: ecCountryName,
                relation: data.emergencyContact.relation || "other",
            }
        };
        mutation.mutate(payload);
    };

    const handleConnectSmartwatch = (device: string) => {
        setSelectedDevice(device);
        setShowPermissions(true);
    };

    const handleGrantPermissions = () => {
        const deviceMap: Record<string, "Apple" | "Fitbit" | "GoogleFit"> = {
            "Apple Watch": "Apple",
            "Fitbit": "Fitbit",
            "Google Fit": "GoogleFit"
        };
        const backendDeviceType = selectedDevice ? deviceMap[selectedDevice] : undefined;

        // If it's Fitbit, trigger real OAuth flow
        if (backendDeviceType === "Fitbit") {
            setConnectingDevice("Fitbit");
            // Specify web redirect URI for the callback
            const webRedirectUri = window.location.origin + "/oauthredirect";
            
            getFitbitAuthUrl(webRedirectUri)
                .then((res) => {
                    const authUrl = res.data?.data?.authorizationUrl;
                    if (authUrl) {
                        window.location.href = authUrl;
                    } else {
                        throw new Error("Authorization URL not found");
                    }
                })
                .catch((err) => {
                    console.error("Fitbit Auth Error:", err);
                    toast.error("Failed to start Fitbit connection. Please try again.");
                    setConnectingDevice(null);
                });
            return;
        }

        // --- Other devices (Apple/Google) or Fallback simulation ---
        setConnectingDevice(selectedDevice);
        // Simulate connection delay
        setTimeout(() => {
            setSmartwatchConnected(true);
            setConnectingDevice(null);
            setShowPermissions(false);

            if (selectedDevice === "Apple Watch") {
                toast.success(`Apple Watch linked! Data will sync via mobile app.`);
            } else {
                toast.success(`${selectedDevice} connected successfully!`);
            }
        }, 2000);

        // Update user profile with smartwatch status (no mock data)
        updateProfileApi({
            smartwatch: {
                connected: true,
                type: backendDeviceType,
                lastSync: new Date().toISOString()
            }
        });
    };


    const handleSkipSmartwatch = () => {
        setStep(3); // Go to completion
    };

    const handleFinish = () => {
        toast.success("Registration successful! Your health profile and QR code have been created.");
        navigate('/dashboard');
    };

    const handleDownloadQR = () => {
        if (!qrCode) return;
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = 'my-health-qr-code.png';
        link.click();
        toast.success("QR Code downloaded!");
    };

    const handleShareQR = async () => {
        if (!qrCode) return;

        // Convert data URL to blob for sharing
        const blob = await fetch(qrCode).then(r => r.blob());
        const file = new File([blob], 'health-qr-code.png', { type: 'image/png' });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Health QR Code',
                    text: 'Scan this QR code to securely upload my medical documents.',
                    files: [file]
                });
            } catch (err) {
                // User cancelled or error
                toast.info("Share cancelled");
            }
        } else {
            // Fallback: copy to clipboard or show modal
            toast.info("Sharing not supported on this device. Please download and share manually.");
        }
    };

    const isLoading = mutation.isPending;

    // --- Step 3: QR Code & Completion ---
    if (step === 3) {
        return (
            <section className="section-padding flex items-center justify-center relative min-h-screen">
                <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
                <div className="container relative z-10">
                    <div className='!max-w-[600px] w-full p-0 relative mx-auto bg-white rounded-[8px] shadow-md overflow-hidden'>
                        <div className="text-center p-8 pb-6 bg-[var(--theme-color-primary-shade-900)]">
                            <div className="flex justify-center mb-4 text-white">
                                <CheckCircle size={64} />
                            </div>
                            <h2 className="headings-web-h4-headline text-white mb-2">Registration Successful!</h2>
                            <p className="body-text-body-2 !text-white">Your health profile and QR code have been created.</p>
                        </div>

                        <div className="p-8 text-center">
                            <p className="body-text-body-1 font-medium mb-4">Your Personal Health QR Code</p>

                            {qrCode ? (
                                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-inner mb-6">
                                    <img src={qrCode} alt="Health QR Code" className="w-48 h-48 mx-auto" />
                                </div>
                            ) : (
                                <div className="inline-flex items-center justify-center w-48 h-48 bg-gray-100 rounded-lg mb-6">
                                    <QrCode size={80} className="text-gray-400" />
                                </div>
                            )}

                            <p className="text-sm text-gray-500 mb-6">
                                Doctors can scan this code to securely upload prescriptions and reports to your account.
                            </p>

                            <div className="flex gap-4 justify-center mb-6">
                                <button
                                    onClick={handleDownloadQR}
                                    disabled={!qrCode}
                                    className="flex text-black items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    <Download size={20} />
                                    Download
                                </button>
                                <button
                                    onClick={handleShareQR}
                                    disabled={!qrCode}
                                    className="flex items-center gap-2 px-6 py-3 bg-[#9146C1] text-white rounded-lg hover:bg-[#7a3da3] transition-colors disabled:opacity-50"
                                >
                                    <Share2 size={20} />
                                    Share
                                </button>
                            </div>

                            <button
                                onClick={handleFinish}
                                className="w-full btn bg-[#9146C1] hover:bg-[#7a3da3] text-white py-3 rounded-md"
                            >
                                Continue to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // --- Step 2: Smartwatch Integration ---
    if (step === 2) {
        return (
            <section className="section-padding flex items-center justify-center relative min-h-screen">
                <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
                <div className="container relative z-10">
                    <div className='!max-w-[600px] w-full p-0 relative mx-auto bg-white rounded-[8px] shadow-md overflow-hidden'>
                        <div className="text-center p-8 pb-6 bg-[var(--theme-color-primary-shade-50)]">
                            <h2 className="headings-web-h4-headline text-[var(--theme-color-primary-shade-900)] mb-2">Smartwatch Integration</h2>
                            <p className="body-text-body-2 text-gray-600">Track your health in real-time.</p>
                        </div>

                        <div className="p-8">
                            {/* Permissions Modal */}
                            {showPermissions && !smartwatchConnected && (
                                <div className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
                                    <p className="font-medium mb-3">Grant permissions to access:</p>
                                    <ul className="space-y-2 text-sm text-gray-600 mb-4">
                                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Heart Rate</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Step Count</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Sleep Data</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Blood Oxygen (SpO₂)</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Blood Pressure (if supported)</li>
                                    </ul>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGrantPermissions}
                                            disabled={!!connectingDevice}
                                            className="flex-1 btn bg-[#9146C1] text-white py-2 rounded-md"
                                        >
                                            {connectingDevice ? <Loader text="" /> : "Grant & Connect"}
                                        </button>
                                        <button
                                            onClick={() => setShowPermissions(false)}
                                            className="flex-1 btn border border-gray-300 py-2 rounded-md"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!smartwatchConnected && !showPermissions && (
                                <>
                                    <p className="text-center mb-6 body-text-body-1 font-medium">Would you like to connect your smartwatch for real-time health tracking?</p>

                                    <div className="grid grid-cols-1 gap-4 mb-6 text-black">
                                        {['Apple Watch', 'Fitbit', 'Google Fit'].map((device) => (
                                            <button
                                                key={device}
                                                onClick={() => handleConnectSmartwatch(device)}
                                                disabled={!!connectingDevice}
                                                className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                                            >
                                                <span className="font-medium">{device}</span>
                                                <span className="text-xl">+</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="text-center">
                                        <button onClick={handleSkipSmartwatch} className="text-gray-500 underline hover:text-gray-700">
                                            Skip for now
                                        </button>
                                        <p className="text-xs text-gray-400 mt-2">You can connect your smartwatch later from Settings → Device Management.</p>
                                    </div>
                                </>
                            )}

                            {smartwatchConnected && (
                                <div className="text-center py-8">
                                    <div className="flex justify-center mb-4 text-green-500">
                                        <CheckCircle size={64} />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 text-black">Device connected successfully.</h3>
                                    <p className="text-gray-500 mb-6">We are now syncing your Heart Rate, Step Count, and Sleep Data.</p>
                                    <button onClick={() => setStep(3)} className="w-full btn bg-[#9146C1] hover:bg-[#7a3da3] text-white py-3 rounded-md">
                                        Continue
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // --- Step 1: Health Profile ---
    return (
        <section className="section-padding flex items-center justify-center relative min-h-screen">
            <div className="absolute top-0 left-0 w-full h-[227px] bg-[linear-gradient(90deg,#FBF7FD_0%,#EBDDF7_100%)]"></div>
            <div className="container relative z-10">
                <div className='!max-w-[700px] w-full p-0 relative mx-auto'>
                    <div className="bg-white rounded-[8px] shadow-[0px_1px_3px_rgba(0,0,0,0.25)] overflow-hidden relative">

                        {isLoading && (
                            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                                <Loader text="Setting up profile..." />
                            </div>
                        )}

                        <div className="text-center p-8 pb-10 bg-[var(--theme-color-primary-shade-50)]">
                            <div className="flex flex-col gap-[5px]">
                                <h2 className="headings-web-h4-headline text-[var(--theme-color-primary-shade-900)] mb-2">Basic Health Details</h2>
                                <p className="body-text-body-2 text-gray-600">Please provide your health information.</p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 pt-6">
                            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group">
                                        <label className="body-text-body-2 medium mb-1 block">Date of Birth</label>
                                        <input
                                            type="date"
                                            className={`form-control ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                                            max={new Date().toISOString().split('T')[0]}
                                            onKeyDown={(e) => e.preventDefault()}
                                            onClick={(e) => (e.target as any).showPicker?.()}
                                            onFocus={(e) => (e.target as any).showPicker?.()}
                                            {...register('dateOfBirth', { required: 'Date of birth is required' })}
                                        />
                                        {errors.dateOfBirth && <p className="!text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>}
                                    </div>

                                    <div className="form-group">
                                        <label className="body-text-body-2 medium mb-1 block">Gender</label>
                                        <select
                                            className={`form-control ${errors.gender ? 'border-red-500' : ''}`}
                                            {...register('gender', { required: 'Gender is required' })}
                                        >
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {errors.gender && <p className="!text-red-500 text-sm mt-1">{errors.gender.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="form-group">
                                        <label className="body-text-body-2 medium mb-1 block">Height</label>
                                        <select
                                            className={`form-control ${errors.height ? 'border-red-500' : ''}`}
                                            {...register('height', { required: 'Required' })}
                                        >
                                            <option value="">Select Height</option>
                                            {Array.from({ length: 60 }).map((_, i) => {
                                                const feet = Math.floor(i / 12) + 3;
                                                const inches = i % 12;
                                                const val = `${feet} feet ${inches} inches`;
                                                return <option key={val} value={val}>{val}</option>;
                                            })}
                                        </select>
                                        {errors.height && <p className="!text-red-500 text-sm mt-1">{errors.height.message}</p>}
                                    </div>

                                    <div className="form-group">
                                        <label className="body-text-body-2 medium mb-1 block">Weight</label>
                                        <select
                                            className={`form-control ${errors.weight ? 'border-red-500' : ''}`}
                                            {...register('weight', { required: 'Required' })}
                                        >
                                            <option value="">Select Weight</option>
                                            {Array.from({ length: 335 }).map((_, i) => (
                                                <option key={i} value={`${66 + i} lbs`}>{66 + i} lbs</option>
                                            ))}
                                        </select>
                                        {errors.weight && <p className="!text-red-500 text-sm mt-1">{errors.weight.message}</p>}
                                    </div>

                                    <div className="form-group">
                                        <label className="body-text-body-2 medium mb-1 block">Blood Group</label>
                                        <select
                                            className={`form-control ${errors.bloodGroup ? 'border-red-500' : ''}`}
                                            {...register('bloodGroup', { required: 'Required' })}
                                        >
                                            <option value="">Select</option>
                                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                                <option key={bg} value={bg}>{bg}</option>
                                            ))}
                                        </select>
                                        {errors.bloodGroup && <p className="!text-red-500 text-sm mt-1">{errors.bloodGroup.message}</p>}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 medium mb-1 block">Blood Pressure (Systolic/Diastolic)</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="Systolic (e.g. 120)"
                                                className={`form-control ${errors.systolic ? 'border-red-500' : ''}`}
                                                {...register('systolic', { required: 'Required', min: 70, max: 200, maxLength: { value: 3, message: 'Invalid' } })}
                                                maxLength={3}
                                            />
                                        </div>
                                        <span className="text-xl">/</span>
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="Diastolic (e.g. 80)"
                                                className={`form-control ${errors.diastolic ? 'border-red-500' : ''}`}
                                                {...register('diastolic', { required: 'Required', min: 40, max: 130, maxLength: { value: 3, message: 'Invalid' } })}
                                                maxLength={3}
                                            />
                                        </div>
                                    </div>
                                    {(errors.systolic || errors.diastolic) && <p className="!text-red-500 text-sm mt-1">Both values are required</p>}
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 medium mb-1 block">Health Conditions</label>
                                    <div className="form-group">
                                        {/* <label className="body-text-body-2 medium mb-1 block">
                                            Health Conditions
                                        </label> */}

                                        <textarea
                                            className="form-control"
                                            placeholder="Enter health conditions (e.g. Diabetes, Hypertension)"
                                            rows={3}
                                            {...register("healthConditions", {
                                                maxLength: { value: 200, message: "Too long" }
                                            })}
                                            maxLength={200}
                                        />

                                        {/* <p className="text-xs text-gray-400 mt-1">
                                            Leave empty if none
                                        </p> */}
                                    </div>

                                    {/* <button
                                        type="button"
                                        onClick={() => append({ value: "" })}
                                        className="text-[var(--theme-color-primary-shade-600)] text-sm font-medium hover:underline"
                                    >
                                        + Add More
                                    </button> */}
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 medium mb-1 block">Emergency Contact Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter contact name"
                                        {...register('emergencyContact.name', {
                                            maxLength: { value: 50, message: "Too long" }
                                        })}
                                        maxLength={50}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 medium mb-1 block">Emergency Contact Phone</label>
                                    <Controller
                                        name="emergencyContact.phone"
                                        control={control}
                                        rules={{
                                            required: 'Phone number is required',
                                            validate: (val) => {
                                                if (!val) return true;
                                                if (!isValidPhoneNumber(val)) {
                                                    return "Invalid mobile number";
                                                }
                                                const parsed = parsePhoneNumber(val);
                                                if (!parsed) return "Invalid mobile number";
                                                // if (parsed && parsed.nationalNumber.length !== 10) {
                                                //     return "Mobile number must be 10 digits";
                                                // }
                                                return true;
                                            }
                                        }}
                                        render={({ field: { onChange, value } }) => (
                                            <PhoneInput
                                                international
                                                defaultCountry="US"
                                                value={value}
                                                onChange={onChange}
                                                className={`form-control flex items-center gap-2 !pl-3 ${errors.emergencyContact?.phone ? 'border-red-500' : ''}`}
                                                numberInputProps={{
                                                    className: "bg-transparent border-none outline-none w-full !text-slate-900 placeholder:text-slate-400 focus:ring-0 h-full p-0 text-[14px]",
                                                    placeholder: "Enter mobile number",
                                                    maxLength: 20
                                                }}
                                            />
                                        )}
                                    />
                                    {errors.emergencyContact?.phone && (
                                        <p className="!text-red-500 text-sm mt-1">{errors.emergencyContact.phone.message as string}</p>
                                    )}
                                </div>

                                <div className="form-group">
                                    <label className="body-text-body-2 medium mb-1 block">Relation</label>
                                    <select
                                        className={`form-control ${errors.emergencyContact?.relation ? 'border-red-500' : ''}`}
                                        {...register('emergencyContact.relation', { required: 'Relation is required' })}
                                    >
                                        <option value="">Select relation</option>
                                        <option value="parent">Parent</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="sibling">Sibling</option>
                                        <option value="friend">Friend</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.emergencyContact?.relation && (
                                        <p className="!text-red-500 text-sm mt-1">{errors.emergencyContact.relation.message as string}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-4">
                                    <input
                                        id="consent"
                                        type="checkbox"
                                        className="checkbox w-5 h-5 border-gray-300 rounded checked:bg-[#9146C1] checked:border-[#9146C1] [--chkfg:white]"

                                        {...register('consent', { required: 'Consent is required' })}
                                    />
                                    <label htmlFor="consent" className="body-text-body-2 text-slate-950 cursor-pointer">
                                        I consent to share my medical reports.
                                    </label>
                                </div>
                                {errors.consent && <p className="!text-red-500 text-sm mt-1 block">Consent is required</p>}


                                <div className="pt-4">
                                    <button type="submit" className="w-full btn bg-[#9146C1] hover:bg-[#7a3da3] text-white py-3 rounded-md transition-colors" disabled={isLoading}>
                                        {isLoading ? 'Processing...' : 'Save & Continue'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfileSetup;
