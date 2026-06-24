import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getActiveAds, trackImpression, trackClick } from '../api/adApi';
import { X, ChevronLeft, ChevronRight, Info, ExternalLink } from 'lucide-react';
// import { formatUploadUrl } from '../utils/urlHelper';

const AdBanner: React.FC = () => {
    const [ads, setAds] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isIdling, setIsIdling] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAd, setSelectedAd] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const trackedImpressions = useRef<Set<string>>(new Set());
    const timerRef = useRef<any>(null);
    const hasFetchedRef = useRef(false);

    const DEFAULT_IMAGE = "/images/default.jpg";

    // const getImageUrl = (imagePath: string) => {
    //     if (!imagePath || imagePath === 'undefined' || imagePath.length < 5) return DEFAULT_IMAGE;
    //     return formatUploadUrl(imagePath);
    // };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (e.currentTarget.src === DEFAULT_IMAGE) return;
        e.currentTarget.src = DEFAULT_IMAGE;
    };

    const fetchAds = useCallback(async () => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        try {
            const res = await getActiveAds();
            if (res.success && res.data && res.data.length > 0) {
                // The V2 API returns a flattened list of ranked creatives
                const flattenedAds = res.data.map((creative: any) => ({
                    ...creative,
                    // Ensure mediaUrl is formatted correctly
                    mediaUrl: creative.mediaUrl?.startsWith('http')
                        ? creative.mediaUrl
                        : (import.meta.env.VITE_IMAGE_URL ? `${import.meta.env.VITE_IMAGE_URL}${creative.mediaUrl}` : creative.mediaUrl)
                }));
                setAds(flattenedAds);
            }
        } catch (error) {
            console.error("Error fetching ads:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAds();
    }, [fetchAds]);

    // Independent effect for impression tracking
    useEffect(() => {
        if (ads.length > 0) {
            const track = (ad: any) => {
                if (ad && ad._id && !trackedImpressions.current.has(ad._id)) {
                    console.log(`[DEBUG] Tracking impression for ad: ${ad._id}`);
                    trackImpression(ad._id).catch((err) => {
                        console.error(`[DEBUG] Impression tracking failed for ${ad._id}:`, err);
                    });
                    trackedImpressions.current.add(ad._id);
                }
            };

            track(ads[currentIndex]);
            if (ads.length > 1) {
                track(ads[(currentIndex + 1) % ads.length]);
            }
        }
    }, [ads, currentIndex]);

    const handleNext = useCallback(() => {
        if (ads.length === 0) return;
        setCurrentIndex(prevIndex => (prevIndex + 1) % ads.length);
    }, [ads.length]);

    const handlePrev = useCallback(() => {
        if (ads.length === 0) return;
        setCurrentIndex(prevIndex => (prevIndex - 1 + ads.length) % ads.length);
    }, [ads.length]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (ads.length <= 1 || isModalOpen || isIdling) return;

        timerRef.current = setInterval(() => {
            handleNext();
        }, 10000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [ads.length, isModalOpen, isIdling, handleNext]);

    const handleAdClick = (ad: any) => {
        if (!ad) return;
        trackClick(ad._id).catch(() => { });
        setSelectedAd(ad);
        setIsModalOpen(true);
    };

    if (loading || ads.length === 0) return null;

    const renderAdCard = (ad: any, isSecondary = false) => {
        if (!ad) return null;
        const isVideo = ad.mediaUrl?.endsWith('.mp4') || ad.type === 'video';

        return (
            <div
                key={ad._id}
                className={`relative flex-1 rounded-[24px] overflow-hidden flex flex-col justify-end transition-all duration-700 shadow-[0_12px_40px_-15px_rgba(0,0,0,0.3)] border border-white/20 h-full group ${isSecondary ? 'hidden lg:flex' : 'flex'}`}
                onMouseEnter={() => setIsIdling(true)}
                onMouseLeave={() => setIsIdling(false)}
            >
                {/* Background Media */}
                <div className="absolute inset-0 z-0">
                    {isVideo ? (
                        <video
                            src={ad.mediaUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                    ) : (
                        <img
                            src={ad.mediaUrl || DEFAULT_IMAGE}
                            alt={ad.headline}
                            onError={handleImageError}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
                </div>

                {/* Content */}
                <div className="relative z-10 p-6 md:p-7 flex flex-col items-start text-left w-full translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="mb-2.5">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-['AeonikBold'] uppercase tracking-widest backdrop-blur-md border border-white/20 text-white ${isSecondary ? 'bg-sky-500/30' : 'bg-[#9146C1]/30'}`}>
                            Sponsored
                        </span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-['AeonikBlack'] text-white mb-2 leading-tight uppercase tracking-tight line-clamp-1 drop-shadow-md">
                        {ad.headline}
                    </h3>

                    <p className="text-[13px] font-['AeonikRegular'] text-white mb-5 line-clamp-2 leading-relaxed min-h-[40px] max-w-[90%] drop-shadow-sm opacity-90">
                        {ad.description}
                    </p>

                    <div className="w-full">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAdClick(ad); }}
                            className={`inline-flex items-center gap-2.5 px-5 py-3 rounded-xl font-['AeonikBold'] text-[10px] uppercase tracking-widest transition-all active:scale-95 group/btn border border-white/10 ${isSecondary ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#9146C1] text-white hover:bg-[#8200DB] shadow-lg shadow-purple-900/40'}`}
                        >
                            {ad.ctaType?.replace('_', ' ') || 'Learn More'}
                            <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="relative mb-8 w-full animate-in fade-in slide-in-from-top-2 duration-700">
            {/* Ad Slider Container - Dual Card Layout - Balanced Height */}
            <div className="flex gap-6 min-h-[280px] md:min-h-[260px]">
                {/* Main Visible Ad */}
                {renderAdCard(ads[currentIndex])}

                {/* Second Ad (Visible on Desktop) */}
                {ads.length > 1 && renderAdCard(ads[(currentIndex + 1) % ads.length], true)}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-6">
                <button
                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                    className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:border-[#9146C1] hover:text-[#9146C1] hover:bg-white transition-all bg-white shadow-sm active:scale-90"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="flex gap-2">
                    {ads.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1 rounded-full transition-all duration-500 cursor-pointer ${idx === currentIndex
                                ? 'w-6 bg-[#9146C1]'
                                : 'w-1 bg-slate-200 hover:bg-slate-300'
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="w-9 h-9 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:border-[#9146C1] hover:text-[#9146C1] hover:bg-white transition-all bg-white shadow-sm active:scale-90"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Ad Details Modal - Enhanced Premium Design */}
            {isModalOpen && selectedAd && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
                    {/* Backdrop with sophisticated blur and fade-in */}
                    <div
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500"
                        onClick={() => setIsModalOpen(false)}
                    />

                    <div className="relative z-10 w-full max-w-[750px] bg-white rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(145,70,193,0.25)] border border-white/20 flex flex-col md:flex-row h-auto max-h-[90vh] md:max-h-[500px] animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 ease-out">

                        {/* Left Side: Immersive Visual (Image/Video) */}
                        <div className="relative w-full md:w-[40%] h-48 md:h-auto bg-slate-100 overflow-hidden group">
                            {selectedAd.type === 'video' ? (
                                <video
                                    src={selectedAd.mediaUrl}
                                    autoPlay
                                    muted
                                    loop
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={selectedAd.mediaUrl || DEFAULT_IMAGE}
                                    alt={selectedAd.headline}
                                    onError={handleImageError}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-3000 ease-out"
                                />
                            )}
                            {/* Visual Overlays for depth */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent hidden md:block" />

                            {/* Floating Badge on Image */}
                            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 animate-in slide-in-from-left-4 duration-1000 delay-300">
                                <span className="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md text-[#9146C1] font-['AeonikBold'] text-[9px] uppercase tracking-widest shadow-md border border-white/40">
                                    Official Campaign
                                </span>
                            </div>

                            {/* Mobile Close Button */}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 md:hidden w-9 h-9 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center text-white border border-white/30"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Right Side: Sophisticated Content */}
                        <div className="flex-1 p-6 md:p-10 lg:p-12 flex flex-col overflow-y-auto bg-white/50 backdrop-blur-sm">

                            {/* Desktop Close Button - Professional integrated style */}
                            <div className="hidden md:flex justify-end absolute top-6 right-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#9146C1] hover:bg-white hover:rotate-90 transition-all duration-500 border border-slate-100 active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
                                <div className="w-12 h-12 bg-[#F4ECFB] rounded-2xl flex items-center justify-center mb-5 shadow-inner ring-4 ring-[#F4ECFB]/50 border border-white">
                                    <Info size={24} className="text-[#9146C1]" />
                                </div>
                                <div className="inline-flex items-center gap-2 mb-1.5">
                                    <div className="w-6 h-[2px] bg-[#9146C1]/30 rounded-full"></div>
                                    <span className="text-[9px] uppercase tracking-[0.34em] font-['AeonikBold'] text-[#9146C1]/60">Member Spotlight</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-['AeonikBlack'] text-slate-900 leading-tight uppercase tracking-tight">
                                    {selectedAd.headline}
                                </h2>
                            </div>

                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                                <div className="h-1 w-16 bg-gradient-to-r from-[#9146C1] to-[#9146C1]/20 rounded-full mb-4" />

                                <p className="text-slate-600 text-sm md:text-base leading-relaxed font-['AeonikRegular'] opacity-80 max-w-md">
                                    {selectedAd.description}
                                </p>

                                <div className="pt-8 flex flex-col sm:flex-row gap-4 mt-auto">
                                    <button
                                        onClick={() => { if (selectedAd.ctaLink) window.open(selectedAd.ctaLink, '_blank'); else setIsModalOpen(false); }}
                                        className="flex-[2] bg-[#9146C1] text-white py-4 px-8 rounded-2xl font-['AeonikBold'] text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-purple-900/10 hover:bg-[#8200DB] active:scale-95 transition-all flex items-center justify-center gap-2.5 group/btn"
                                    >
                                        {selectedAd.ctaType?.replace('_', ' ') || 'Learn More'}
                                        <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 bg-white text-slate-400 py-4 px-6 rounded-2xl font-['AeonikBold'] text-[10px] uppercase tracking-widest hover:bg-slate-50 hover:text-slate-600 transition-all border border-slate-100 flex items-center justify-center"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>

                            {/* Subtle Brand Footer */}
                            <div className="mt-auto pt-8 text-center md:text-left animate-in fade-in duration-1000 delay-500">
                                <p className="text-[8px] uppercase tracking-widest text-slate-300 font-['AeonikBold']">
                                    Powered by SmartHealth Ads • © 2026
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdBanner;
