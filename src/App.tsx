import { useEffect, useState, useContext, useCallback } from "react";
import WebApp from "@twa-dev/sdk";
import Header from "./components/Header";
import { useNavigate } from "react-router-dom";
import Footer from "./components/Footer";
import { UserContext } from "./context/UserContext";
import { useTranslation } from "react-i18next";
import BannerComponent from "./components/BannerComponent";

function App() {
    const { setUser, setIsLoggedIn, isLoggedIn, hasAttemptedLogin, setHasAttemptedLogin } = useContext(UserContext);
    const [loading, setLoading] = useState(() => {
        // If already logged in, don't show loading
        return !isLoggedIn;
    });
    const [loginFailed, setLoginFailed] = useState(false);
    const [countryCode, setCountryCode] = useState<string | null>(null);

    const { t } = useTranslation();
    const navigate = useNavigate();

    // Memoize navigation handlers to prevent recreating functions
    const handleNavigation = useCallback((path: string) => {
        navigate(path);
    }, [navigate]);

    // Initialize WebApp (promotion banner fetching remains commented out)
    useEffect(() => {
        WebApp.ready();
        // Promotion banner fetching remains commented out since we're using BannerComponent now
    }, []); // Empty dependency array - only run once

    // Fetch country code (separate effect) - only if not already logged in
    useEffect(() => {
        if (isLoggedIn || hasAttemptedLogin) {
            setLoading(false);
            return;
        }

        const fetchCountryCode = async () => {
            try {
                const response = await fetch(
                    "https://bonusforyou.org/api/user/get-country"
                );
                const data = await response.json();
                if (data.countryCode) {
                    setCountryCode(data.countryCode);
                }
            } catch (error) {
                console.error("Error fetching country:", error);
            }
        };

        fetchCountryCode();
    }, [isLoggedIn, hasAttemptedLogin]); // Only run if not logged in and haven't attempted

    // Login effect - only run when countryCode is available and haven't attempted login
    useEffect(() => {
        // Skip if already logged in or already attempted login
        if (isLoggedIn || hasAttemptedLogin) {
            setLoading(false);
            return;
        }

        // Don't attempt login until we have countryCode
        if (countryCode === null) return;

        // const telegram_id = WebApp.initDataUnsafe.user?.id;
        const telegram_id = "1111";
        const first_name = WebApp.initDataUnsafe.user?.first_name || "";
        const last_name = WebApp.initDataUnsafe.user?.last_name || "";
        const username = WebApp.initDataUnsafe.user?.username || "";

        if (telegram_id) {
            const loginUser = async () => {
                try {
                    setHasAttemptedLogin(true); // Mark that we've attempted login
                    
                    const response = await fetch(
                        "https://bonusforyou.org/api/user/login",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                telegram_id,
                                first_name,
                                last_name,
                                username,
                                countryCode,
                            }),
                        }
                    );

                    const data = await response.json();

                    if (data.status) {
                        const userData = data.data;
                        setUser({
                            id: userData.id,
                            name: userData.name,
                            telegramId: userData.telegram_id,
                            country: userData.country,
                            uniqueId: userData.unique_id,
                        });
                        setIsLoggedIn(true);
                    } else {
                        console.error("Failed to fetch user data.");
                        setLoginFailed(true);
                    }
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                    setLoginFailed(true);
                } finally {
                    setLoading(false);
                }
            };

            loginUser();
        } else {
            console.error("Telegram ID not found.");
            setLoginFailed(true);
            setLoading(false);
            setHasAttemptedLogin(true);
        }
    }, [countryCode, isLoggedIn, hasAttemptedLogin, setUser, setIsLoggedIn, setHasAttemptedLogin]); // Include all dependencies

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (loginFailed) {
        return (
            <div className="flex justify-center items-center h-screen bg-yellow-300 text-black">
                Login Failed. Please try again later.
            </div>
        );
    }

    return (
        <>
            <Header />
            <div className="bg-yellow-300 min-h-screen flex flex-col z-10">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    My Panel
                </div>
                
                {/* Top Banner for Participant My Panel */}
                <BannerComponent 
                    pageName="Participant My panel" 
                    position="top"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mt-2"
                />

                <main className="bg-yellow-300 pt-4 flex flex-col justify-start items-center w-full flex-grow">
                    <section className="flex flex-col gap-4 mt-4 mb-4 items-center">
                        <div
                            onClick={() => handleNavigation("/available-rewards")}
                            className="py-3 bg-[#37474F] text-center rounded-md text-white hover:font-bold hover:cursor-pointer w-[90vw]"
                        >
                            {t("app.availableEvents")}
                        </div>
                        <div
                            onClick={() => handleNavigation("/ongoing-rewards")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.ongoingEvents")}
                        </div>
                        <div
                            onClick={() => handleNavigation("/participated-rewards")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.participatedEvents")}
                        </div>
                        <div
                            onClick={() => handleNavigation("/prize-i-won")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.prizeIWon")}
                        </div>
                        <div
                            onClick={() => handleNavigation("/profile")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.myProfile")}
                        </div>
                        
                        {/* Bottom Banner for Participant My Panel */}
                        <BannerComponent 
                            pageName="Participant My panel" 
                            position="bottom"
                            className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto"
                        />
                        
                        <Footer />
                    </section>
                </main>
            </div>
        </>
    );
}

export default App;
