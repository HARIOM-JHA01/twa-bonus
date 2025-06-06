import React, { useEffect, useState, useRef } from 'react';

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
}

// Track impressions per session to avoid duplicate calls
const sessionImpressions = new Set<string>();

const BannerComponent: React.FC<BannerComponentProps> = ({ 
    pageName, 
    position, 
    className = "rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto my-2" 
}) => {
    const [bannerImage, setBannerImage] = useState<BannerImage | null>(null);
    const [fallbackBanner, setFallbackBanner] = useState<AdvertiseBanner | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const impressionSent = useRef(false);

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
        return pageMapping[pageName] || 4; // Default to Participant My panel if not found
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
            const response = await fetch('https://bonusforyou.org/api/advertiseBanner');
            const data = await response.json();
            
            if (data.status && data.data.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.data.length);
                setFallbackBanner(data.data[randomIndex]);
            }
        } catch (error) {
            console.error('Error fetching fallback banner:', error);
        }
    };

    useEffect(() => {
        const fetchBannerData = async () => {
            try {
                setLoading(true);
                const pageId = getPageId(pageName);

                // Use different API endpoints for development vs production
                // In development: use proxy (/api/banner -> /api/user)
                // In production: use direct API endpoint
                const isDevelopment = import.meta.env.DEV;
                const apiUrl = isDevelopment 
                    ? `/api/banner/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`
                    : `https://bonusforyou.org/api/user/get-banner-image?app_name=bonusmonster&page_id=${pageId}&position=${position}`;

                // Fetch banner directly using the correct API
                const response = await fetch(apiUrl);

                if (response.ok) {
                    const data = await response.json();
                    
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
                    }
                }
                
                // If no banner found or API error, fetch fallback
                await fetchFallbackBanner();
                
            } catch (error) {
                console.error('Error fetching banner data:', error);
                // Fetch fallback on error
                await fetchFallbackBanner();
            } finally {
                setLoading(false);
            }
        };

        fetchBannerData();
    }, [pageName, position]);

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

    if (bannerImage && !imageError) {
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