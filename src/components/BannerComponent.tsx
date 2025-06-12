import React, { useEffect, useState, useRef, useContext } from 'react';
import { UserContext } from "../context/UserContext";

// Banner cache system to avoid multiple API calls
class BannerCache {
    private static instance: BannerCache;
    private advertiseBanners: AdvertiseBanner[] = [];
    private isLoading = false;
    private loadPromise: Promise<AdvertiseBanner[]> | null = null;
    // Track last country that successfully returned banners
    private static lastSuccessfulCountry: string | null = null;
    private static currentCountry: string | null = null;

    static getInstance(): BannerCache {
        if (!BannerCache.instance) {
            BannerCache.instance = new BannerCache();
        }
        return BannerCache.instance;
    }

    // Get current country being used
    static getCurrentCountry(): string | null {
        return BannerCache.currentCountry;
    }

    // Set current country
    static setCurrentCountry(country: string | null): void {
        // Only clear last successful country if the country changes
        if (country !== BannerCache.currentCountry) {
            console.log(`Changing country from ${BannerCache.currentCountry} to ${country}`);
            BannerCache.currentCountry = country;
            
            // Clear last successful country when changing countries
            // This forces all banner components to refresh
            BannerCache.lastSuccessfulCountry = null;
        }
    }

    // Track when a country successfully returns banners
    static setCountrySuccess(country: string): void {
        BannerCache.lastSuccessfulCountry = country;
    }

    // Check if current country is successful 
    static isCurrentCountrySuccessful(): boolean {
        return BannerCache.currentCountry !== null && 
               BannerCache.lastSuccessfulCountry === BannerCache.currentCountry;
    }

    async getAdvertiseBanners(): Promise<AdvertiseBanner[]> {
        // Return cached data if available
        if (this.advertiseBanners.length > 0) {
            return this.advertiseBanners;
        }

        // Return existing promise if already loading
        if (this.isLoading && this.loadPromise) {
            return this.loadPromise;
        }

        // Start loading
        this.isLoading = true;
        this.loadPromise = this.fetchAdvertiseBanners();
        
        try {
            this.advertiseBanners = await this.loadPromise;
            return this.advertiseBanners;
        } finally {
            this.isLoading = false;
        }
    }

    private async fetchAdvertiseBanners(): Promise<AdvertiseBanner[]> {
        try {
            const response = await fetch('https://bonusforyou.org/api/advertiseBanner');
            const data = await response.json();
            
            if (data.status && data.data.length > 0) {
                return data.data;
            }
            return [];
        } catch (error) {
            console.error('Error fetching advertisement banners:', error);
            return [];
        }
    }

    getRandomBanner(): AdvertiseBanner | null {
        if (this.advertiseBanners.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * this.advertiseBanners.length);
        return this.advertiseBanners[randomIndex];
    }

    // Clear cache (useful for refresh scenarios)
    clearCache(): void {
        this.advertiseBanners = [];
        this.isLoading = false;
        this.loadPromise = null;
        BannerCache.lastSuccessfulCountry = null;
    }
}

// Get cache instance
const bannerCache = BannerCache.getInstance();

interface BannerImage {
    id: number;
    advertiser_id: number;
    display_app_name: string;
    display_page_id: number;
    display_position: string;
    display_banner_image: string;
    display_banner_target_link: string;
    display_credit: number;
    display_countrt: string;
    display_status: number;
    created_at: string;
    updated_at: string;
}

interface AdvertiseBanner {
    id: number;
    image: string;
    link: string;
    status: string;
    start_date: string;
    end_date: string;
    created_at: string;
    updated_at: string;
}

interface BannerComponentProps {
    pageName: string; // e.g., "Available Events", "Ongoing Events", etc.
    position: 'top' | 'bottom';
    className?: string;
    country?: string; // Add optional country prop
}

// Track impressions per session to avoid duplicate calls
const sessionImpressions = new Set<string>();

// Store selected banners per position to enable rotation
const bannerRotationStore: Record<string, {
    banners: BannerImage[],
    currentIndex: number,
    lastRotationTime: number
}> = {};

const BannerComponent: React.FC<BannerComponentProps> = ({ 
    pageName, 
    position, 
    className = "rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto my-2",
    country
}) => {
    const userContext = useContext(UserContext);
    const user = userContext?.user;
    const [bannerImage, setBannerImage] = useState<BannerImage | null>(null);
    const [fallbackBanner, setFallbackBanner] = useState<AdvertiseBanner | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const impressionSent = useRef(false);
    const [countrySpecificImage, setCountrySpecificImage] = useState<string | null>(null);

    // Page name to page_id mapping based on actual API data
    const getPageId = (pageName: string): number => {
        const pageMapping: { [key: string]: number } = {
            'Participant My panel': 4,
            'Available Events': 6,
            'Ongoing Events': 8,
            'Participated Events': 10,
            'Prize I Won': 12,
            'Participants My Profile': 14,
        };
        return pageMapping[pageName] || 4; 
    };

    // Track banner impression (only once per banner per session)
    const trackImpression = async (pageId: number, bannerId: number) => {
        const impressionKey = `${pageId}-${bannerId}`;
        
        if (sessionImpressions.has(impressionKey) || impressionSent.current) {
            return;
        }

        try {
            await fetch('https://bonusforyou.org/api/user/page-wise-banner-impression', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page_id: pageId,
                    banner_id: bannerId
                })
            });
            
            sessionImpressions.add(impressionKey);
            impressionSent.current = true;
        } catch (error) {
            console.error('Error tracking banner impression:', error);
        }
    };

    // Track banner click
    const trackClick = async (pageId: number, bannerId: number) => {
        try {
            await fetch('https://bonusforyou.org/api/user/page-wise-banner-click', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page_id: pageId,
                    banner_id: bannerId
                })
            });
        } catch (error) {
            console.error('Error tracking banner click:', error);
        }
    };

    // Fetch fallback advertisement banner
    const fetchFallbackBanner = async () => {
        try {
            const banners = await bannerCache.getAdvertiseBanners();
            if (banners.length > 0) {
                const randomIndex = Math.floor(Math.random() * banners.length);
                setFallbackBanner(banners[randomIndex]);
            }
        } catch (error) {
            console.error('Error fetching fallback banner:', error);
        }
    };

    // Get the next banner from the rotation store for this page and position
    const getNextRotatingBanner = (pageId: number, position: string, eligibleBanners: BannerImage[]): BannerImage => {
        const rotationKey = `${pageId}-${position}`;
        const now = Date.now();
        
        // Initialize or update rotation store for this position
        if (!bannerRotationStore[rotationKey] || bannerRotationStore[rotationKey].banners.length !== eligibleBanners.length) {
            // If banners changed or first time, reinitialize
            bannerRotationStore[rotationKey] = {
                banners: [...eligibleBanners],
                currentIndex: 0,
                lastRotationTime: now
            };
            console.log(`Initialized banner rotation for ${rotationKey} with ${eligibleBanners.length} banners`);
        } else {
            // Only advance to next banner if it's been at least 30 seconds since last rotation
            // This prevents banner flickering during normal component re-renders
            const timeSinceLastRotation = now - bannerRotationStore[rotationKey].lastRotationTime;
            if (timeSinceLastRotation >= 30000) { // 30 seconds in milliseconds
                bannerRotationStore[rotationKey].currentIndex = 
                    (bannerRotationStore[rotationKey].currentIndex + 1) % bannerRotationStore[rotationKey].banners.length;
                bannerRotationStore[rotationKey].lastRotationTime = now;
                console.log(`Rotating to next banner for ${rotationKey}, index: ${bannerRotationStore[rotationKey].currentIndex}`);
            }
        }
        
        // Return the current banner in the rotation
        return bannerRotationStore[rotationKey].banners[bannerRotationStore[rotationKey].currentIndex];
    };

    useEffect(() => {
        const fetchBannerData = async () => {
            try {
                console.log(`BannerComponent mounting: ${pageName} - ${position}`); // Debug log
                setLoading(true);
                
                // Reset all banner states when dependencies change (especially country)
                setBannerImage(null);
                setCountrySpecificImage(null);
                setFallbackBanner(null);
                setImageError(false);
                impressionSent.current = false;
                
                const pageId = getPageId(pageName);
                console.log(`BannerComponent pageId: ${pageId} for ${pageName} - ${position}`); // Debug log

                // First try to fetch country-specific banner if country is provided
                let countryToUse = country || user?.country || '';
                // Convert country name to lowercase
                countryToUse = countryToUse.toLowerCase();
                
                if (countryToUse) {
                    console.log(`Trying to fetch country-specific banner for ${countryToUse}`);
                    
                    // Try to get a specific country banner
                    try {
                        // Use different API endpoints for development vs production
                        const isDevelopment = import.meta.env.DEV;
                        
                        const apiUrl = isDevelopment 
                            ? `/api/country-banner/get-country-wise-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}&country=${countryToUse}`
                            : `https://bonusforyou.org/api/user/get-country-wise-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}&country=${countryToUse}`;
                        
                        console.log(`Country-specific banner API URL: ${apiUrl}`);
                        
                        const response = await fetch(apiUrl);
                        console.log(`Country-specific banner response status: ${response.status}`);
                        
                        // Try to parse the response as JSON
                        const data = await response.json();
                        console.log('Country-specific banner data:', data);
                        
                        // Check if we have a successful response with a banner
                        if (response.ok && data.status === true) {
                            if (data.data?.banner_image) {
                                // Set the country-specific image
                                setCountrySpecificImage(data.data.banner_image);
                                console.log('Successfully loaded country-specific banner:', data.data.banner_image);
                                setLoading(false);
                                return;
                            }
                        }
                        
                        // If we reach here, we didn't find a valid country banner
                        console.log(`No valid banner found for country: ${countryToUse}`);
                    } catch (error) {
                        console.error('Error fetching country-specific banner:', error);
                    }
                    
                    // Country-specific banner failed, try regular banner API
                    try {
                        // Use different API endpoints for development vs production
                        const isDevelopment = import.meta.env.DEV;
                        const apiUrl = isDevelopment 
                            ? `/api/banner/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`
                            : `https://bonusforyou.org/api/user/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`;
                        
                        console.log(`Regular banner API URL: ${apiUrl}`);
                        
                        const response = await fetch(apiUrl);
                        console.log(`Regular banner response status: ${response.status}`);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log('Regular banner data:', data);
                            
                            if (data.status && data.data && data.data.length > 0) {
                                // Filter banners that match our position OR have "random" position
                                const eligibleBanners = data.data.filter((banner: BannerImage) => 
                                    banner.display_position === position || 
                                    banner.display_position === 'random'
                                );
                                
                                if (eligibleBanners.length > 0) {
                                    console.log(`Found ${eligibleBanners.length} eligible banners (position: "${position}" or "random")`);
                                    
                                    // Use the rotation mechanism instead of random selection
                                    const banner = getNextRotatingBanner(pageId, position, eligibleBanners);
                                    console.log(`Using rotating banner for ${pageName}-${position}:`, banner);
                                    
                                    if (banner.display_status === 1) {
                                        setBannerImage(banner);
                                        // Track impression when banner is loaded
                                        setTimeout(() => {
                                            trackImpression(pageId, banner.id);
                                        }, 1000); // Small delay to ensure banner is visible
                                        setLoading(false);
                                        return;
                                    }
                                } else {
                                    console.log(`No banners found with position "${position}" or "random"`);
                                }
                            }
                        }
                        
                        // If we reach here, regular banner failed too
                        console.log('Regular banner failed, fetching fallback');
                    } catch (error) {
                        console.error('Error fetching regular banner:', error);
                    }
                    
                    // If both country-specific and regular banners failed, use fallback
                    await fetchFallbackBanner();
                    setLoading(false);
                    return;
                } else {
                    // No country specified, try regular banner
                    try {
                        // Use different API endpoints for development vs production
                        const isDevelopment = import.meta.env.DEV;
                        const apiUrl = isDevelopment 
                            ? `/api/banner/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`
                            : `https://bonusforyou.org/api/user/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`;
                        
                        console.log(`Regular banner API URL: ${apiUrl}`);
                        
                        const response = await fetch(apiUrl);
                        console.log(`Regular banner response status: ${response.status}`);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log('Regular banner data:', data);
                            
                            if (data.status && data.data && data.data.length > 0) {
                                // Filter banners that match our position OR have "random" position
                                const eligibleBanners = data.data.filter((banner: BannerImage) => 
                                    banner.display_position === position || 
                                    banner.display_position === 'random'
                                );
                                
                                if (eligibleBanners.length > 0) {
                                    console.log(`Found ${eligibleBanners.length} eligible banners (position: "${position}" or "random")`);
                                    
                                    // Use the rotation mechanism instead of random selection
                                    const banner = getNextRotatingBanner(pageId, position, eligibleBanners);
                                    console.log(`Using rotating banner for ${pageName}-${position}:`, banner);
                                    
                                    if (banner.display_status === 1) {
                                        setBannerImage(banner);
                                        // Track impression when banner is loaded
                                        setTimeout(() => {
                                            trackImpression(pageId, banner.id);
                                        }, 1000); // Small delay to ensure banner is visible
                                        setLoading(false);
                                        return;
                                    }
                                } else {
                                    console.log(`No banners found with position "${position}" or "random"`);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching regular banner:', error);
                    }
                }
                
                // If all methods fail, fetch fallback
                console.log('All banner methods failed, using fallback');
                await fetchFallbackBanner();
            } catch (error) {
                console.error(`BannerComponent error for ${pageName} - ${position}:`, error);
                // Fetch fallback on error
                await fetchFallbackBanner();
            } finally {
                setLoading(false);
            }
        };

        fetchBannerData();
    }, [pageName, position, country, user?.country]);

    const handleBannerClick = async () => {
        if (bannerImage) {
            const pageId = getPageId(pageName);
            
            // Track click
            await trackClick(pageId, bannerImage.id);
            
            // Open link if available
            if (bannerImage.display_banner_target_link) {
                window.open(bannerImage.display_banner_target_link, '_blank', 'noopener,noreferrer');
            }
        } else if (fallbackBanner?.link) {
            // Handle fallback banner click
            window.open(fallbackBanner.link, '_blank', 'noopener,noreferrer');
        }
    };

    const handleImageError = () => {
        setImageError(true);
        // If main banner image fails, try to load fallback
        if (bannerImage && !fallbackBanner) {
            fetchFallbackBanner();
        }
    };

    // Don't render anything if loading
    if (loading) {
        return null;
    }

    // Determine which banner to show
    let bannerSrc = '';
    let bannerAlt = '';

    // Prioritize country-specific image
    if (countrySpecificImage) {
        // Check if the country-specific image is already a full URL
        if (countrySpecificImage.startsWith('http')) {
            bannerSrc = countrySpecificImage;
        } else {
            // If not, it might be just the filename, so construct the full URL
            bannerSrc = `https://bonusforyou.org/public/AdverBannerImages/${countrySpecificImage}`;
        }
        bannerAlt = `${pageName} ${position} country-specific banner`;
        console.log('Using country-specific banner:', bannerSrc);
    } else if (bannerImage && !imageError) {
        bannerSrc = `https://bonusforyou.org/public/AdverBannerImages/${bannerImage.display_banner_image}`;
        bannerAlt = `${pageName} ${position} banner`;
        console.log('Using regular banner:', bannerSrc);
    } else if (fallbackBanner) {
        bannerSrc = fallbackBanner.image;
        bannerAlt = `Advertisement ${fallbackBanner.id}`;
        console.log('Using fallback advertise banner:', bannerSrc);
    }

    // Don't render if no banner available
    if (!bannerSrc) {
        return null;
    }

    return (
        <div className="banner-container">
            <img
                src={bannerSrc}
                alt={bannerAlt}
                className={`cursor-pointer ${className}`}
                onClick={handleBannerClick}
                loading="lazy"
                onError={handleImageError}
                onLoad={() => {
                    console.log('Banner loaded successfully:', bannerSrc);
                }}
            />
        </div>
    );
};

export default BannerComponent;