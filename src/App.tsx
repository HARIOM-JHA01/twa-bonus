import { useEffect, useState, useContext } from "react";
import WebApp from "@twa-dev/sdk";
import Header from "./components/Header";
import { useNavigate } from "react-router-dom";
import Footer from "./components/Footer";
import { UserContext } from "./context/UserContext";
import { useTranslation } from "react-i18next";
import headerImage from "/profile.jpg";

type PromotionBanner = {
    draw_image: string;
    draw_name: string;
};

type Country = {
    id: number;
    country_name: string;
    country_key: string;
    image: string | null;
    code: string | null;
    country_code: string;
    country_2_char_code: string;
    activation: number;
    created_at: string;
    updated_at: string;
};

function App() {
    const { user, setUser, setIsLoggedIn } = useContext(UserContext);
    const [promotionBanner, setPromotionBanner] =
        useState<PromotionBanner | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    // This state holds the currently selected country code.
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [loginFailed, setLoginFailed] = useState(false);

    const { t } = useTranslation();
    const navigate = useNavigate();

    // Fetch initial data only once: promotion banner, countries list and current country.
    useEffect(() => {
        WebApp.ready();

        // Fetch promotion banner data
        fetch("https://bonusforyou.org/api/PromotionBannerlist")
            .then((res) => res.json())
            .then((data) => {
                if (data.status) {
                    setPromotionBanner(data.data);
                }
            })
            .catch((error) =>
                console.error("Error fetching promotion banner:", error)
            );

        // Fetch countries list from API
        fetch("https://bonusforyou.org/api/countries")
            .then((res) => res.json())
            .then((data) => {
                if (data.status) {
                    setCountries(data.data);
                }
            })
            .catch((error) =>
                console.error("Error fetching countries:", error)
            );

        // Fetch the current country (via your get-country API)
        fetch("https://bonusforyou.org/api/user/get-country")
            .then((res) => res.json())
            .then((data) => {
                if (data.countryCode) {
                    setSelectedCountryCode(data.country);
                }
            })
            .catch((error) => console.error("Error fetching country:", error));
    }, []);

    // Separate effect for login; this effect runs when selectedCountryCode is available.
    useEffect(() => {
        const telegram_id = WebApp.initDataUnsafe.user?.id;
        // const telegram_id = "1111";
        const first_name = WebApp.initDataUnsafe.user?.first_name || "";
        const last_name = WebApp.initDataUnsafe.user?.last_name || "";
        const username = WebApp.initDataUnsafe.user?.username || "";

        if (telegram_id && selectedCountryCode) {
            fetch("https://bonusforyou.org/api/user/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    telegram_id: telegram_id,
                    countryCode: selectedCountryCode,
                    first_name: first_name,
                    last_name: last_name,
                    username: username,
                }),
            })
                .then((response) => response.json())
                .then((data) => {
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
                })
                .catch((error) => {
                    console.error("Failed to fetch user data:", error);
                    setLoginFailed(true);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else if (!telegram_id) {
            console.error("Telegram ID not found.");
            setLoginFailed(true);
            setLoading(false);
        }
    }, [setUser, setIsLoggedIn, selectedCountryCode]);

    // When a user selects a country, update the state and global context.
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCode = e.target.value;
        setSelectedCountryCode(newCode);
        const selectedCountry = countries.find(
            (country) => country.country_code === newCode
        );
        if (selectedCountry) {
            setUser({
                ...user,
                country: selectedCountry.country_name,
            });
        }
    };

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
                <main className="bg-yellow-300 pt-4 flex flex-col justify-start items-center w-full flex-grow">
                    {promotionBanner && (
                        <img
                            src={headerImage}
                            alt={promotionBanner?.draw_name || ""}
                            className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto"
                        />
                    )}

                    {/* Country Dropdown */}
                    <div className="w-[90vw] mx-auto mt-4">
                        <select
                            value={selectedCountryCode}
                            onChange={handleCountryChange}
                            className="w-full p-2 rounded border border-black bg-yellow-300 text-black"
                        >
                            <option value="">{selectedCountryCode}</option>
                            {countries.map((country) => (
                                <option
                                    key={country.id}
                                    value={country.country_code}
                                >
                                    {country.country_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <section className="flex flex-col gap-4 mt-4 mb-4 items-center">
                        <div
                            onClick={() => navigate("/available-rewards")}
                            className="py-3 bg-[#37474F] text-center rounded-md text-white hover:font-bold hover:cursor-pointer w-[90vw]"
                        >
                            {t("app.availableEvents")}
                        </div>
                        <div
                            onClick={() => navigate("/ongoing-rewards")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.ongoingEvents")}
                        </div>
                        <div
                            onClick={() => navigate("/participated-rewards")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.participatedEvents")}
                        </div>
                        <div
                            onClick={() => navigate("/prize-i-won")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.prizeIWon")}
                        </div>
                        <div
                            onClick={() => navigate("/profile")}
                            className="py-3 bg-[#37474F] w-[90vw] text-center rounded-md text-white hover:font-bold hover:cursor-pointer"
                        >
                            {t("app.myProfile")}
                        </div>
                    </section>
                </main>
                <Footer />
            </div>
        </>
    );
}

export default App;
