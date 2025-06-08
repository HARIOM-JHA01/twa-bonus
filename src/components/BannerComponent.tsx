import React, { useEffect, useState, useRef, useContext } from 'react';
import { UserContext } from "../context/UserContext";

// Banner cache system to avoid multiple API calls
class BannerCache {
    private static instance: BannerCache;
    private advertiseBanners: AdvertiseBanner[] = [];
    private isLoading = false;
    private loadPromise: Promise<AdvertiseBanner[]> | null = null;

    static getInstance(): BannerCache {
        if (!BannerCache.instance) {
            BannerCache.instance = new BannerCache();
        }
        return BannerCache.instance;
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

    // Fetch country-specific banner image
    const fetchCountrySpecificBanner = async (countryName: string, pageId: number, position: string) => {
        try {
            const apiUrl = `https://bonusforyou.org/api/user/get-country-wise-banner-image/?app_name=bonusmonster&page_id=${pageId}&position=${position}&country=${countryName.toLowerCase()}`;
            
            console.log(`BannerComponent country-specific API URL: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            if (response.ok) {
                const data = await response.json();
                console.log(`BannerComponent country-specific API data:`, data);
                
                if (data.status && data.data?.banner_image) {
                    setCountrySpecificImage(data.data.banner_image);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Error fetching country-specific banner:', error);
            return false;
        }
    };

    useEffect(() => {
        const fetchBannerData = async () => {
            try {
                console.log(`BannerComponent mounting: ${pageName} - ${position}`); // Debug log
                setLoading(true);
                const pageId = getPageId(pageName);
                console.log(`BannerComponent pageId: ${pageId} for ${pageName} - ${position}`); // Debug log

                // First try to fetch country-specific banner if country is provided
                const countryToUse = country || user?.country || '';
                
                if (countryToUse) {
                    console.log(`Trying to fetch country-specific banner for ${countryToUse}`);
                    const gotCountryBanner = await fetchCountrySpecificBanner(countryToUse, pageId, position);
                    
                    if (gotCountryBanner) {
                        console.log(`Successfully fetched country-specific banner for ${countryToUse}`);
                        setLoading(false);
                        return;
                    }
                }
                
                // If country-specific banner failed or not available, fall back to regular banner
                // Use different API endpoints for development vs production
                const isDevelopment = import.meta.env.DEV;
                const apiUrl = isDevelopment 
                    ? `/api/banner/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`
                    : `https://bonusforyou.org/api/user/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`;
                
                console.log(`BannerComponent API URL: ${apiUrl}`); // Debug log

                // Fetch banner directly using the correct API
                const response = await fetch(apiUrl);
                console.log(`BannerComponent API response status: ${response.status} for ${pageName} - ${position}`); // Debug log

                if (response.ok) {
                    const data = await response.json();
                    console.log(`BannerComponent API data:`, data); // Debug log
                    
                    if (data.status && data.data && data.data.length > 0) {
                        const banner = data.data[0];
                        
                        if (banner.display_status === 1) {
                            setBannerImage(banner);
                            // Track impression when banner is loaded
                            setTimeout(() => {
                                trackImpression(pageId, banner.id);
                            }, 1000); // Small delay to ensure banner is visible
                            return;
                        }
                    } else {
                        console.log(`BannerComponent: No banner data for ${pageName} - ${position}`); // Debug log
                    }
                }
                
                // If no banner found or API error, fetch fallback
                console.log(`BannerComponent: Fetching fallback for ${pageName} - ${position}`); // Debug log
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
        bannerSrc = countrySpecificImage;
        bannerAlt = `${pageName} ${position} country-specific banner`;
    } else if (bannerImage && !imageError) {
        bannerSrc = `https://bonusforyou.org/public/AdverBannerImages/${bannerImage.display_banner_image}`;
        bannerAlt = `${pageName} ${position} banner`;
    } else if (fallbackBanner) {
        bannerSrc = fallbackBanner.image;
        bannerAlt = `Advertisement ${fallbackBanner.id}`;
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