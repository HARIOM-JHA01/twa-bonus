import Header from "../components/Header";
import Footer from "../components/Footer";
import BannerComponent from "../components/BannerComponent";
import {
    useState,
    useEffect,
    useContext,
    useCallback,
    memo,
    useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import WebApp from "@twa-dev/sdk";
import React from "react";

import { Draw } from "../types/type";

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

export default function OngoingEvents() {
    const [draws, setDraws] = useState<Draw[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const userContext = useContext(UserContext);
    const user = userContext?.user;
    const [selectedCountry, setSelectedCountry] = useState<string>("");

    // Memoize the country change handler
    const handleCountryChange = useCallback(
        (e: React.ChangeEvent<HTMLSelectElement>) => {
            setSelectedCountry(e.target.value);
            console.log("Selected country:", e.target.value);
        },
        []
    );

    // Separate useEffect for countries (only depends on user.country)
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch(
                    "https://bonusforyou.org/api/countries"
                );
                const data = await response.json();
                if (data.status) {
                    setCountries(data.data);
                    if (user?.country) {
                        const found = data.data.find(
                            (c: Country) =>
                                c.country_name.toLowerCase() ===
                                user.country.toLowerCase()
                        );
                        if (found) {
                            setSelectedCountry(found.country_name);
                        } else {
                            setSelectedCountry("");
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching countries:", error);
            }
        };

        fetchCountries();
    }, [user?.country]); // Only depend on user.country, not entire user object

    // Separate useEffect for BackButton setup
    useEffect(() => {
        const handleBackButton = () => {
            window.history.back();
        };

        WebApp.BackButton.show();
        WebApp.BackButton.onClick(handleBackButton);

        return () => {
            WebApp.BackButton.offClick(handleBackButton);
            WebApp.BackButton.hide();
        };
    }, []); // Empty dependency array - only run once

    // Separate useEffect for draws
    useEffect(() => {
        if (!user?.id) {
            console.error("User ID not available, cannot fetch data");
            return;
        }

        const fetchDraws = async () => {
            try {
                const payload = {
                    user_id: user.id,
                    country_name: selectedCountry,
                };
                console.log("Fetching draws with payload:", payload);
                const response = await fetch(
                    "https://bonusforyou.org/api/user/countrywiserunningdraw",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    }
                );
                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch data with status: ${response.status}`
                    );
                }
                const data = await response.json();
                console.log("Draws data:", data);
                setDraws(data.data || []);
            } catch (error) {
                console.error("Error fetching draws:", error);
                setDraws([]);
            }
        };

        fetchDraws();
    }, [user?.id, selectedCountry]);

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col min-h-[70vh] w-full">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    Ongoing Events
                </div>

                {/* Top Banner for Ongoing Events */}
                <BannerComponent
                    pageName="Ongoing Events"
                    position="top"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mt-2"
                />

                {/* Container with fixed width */}
                <div className="w-[95vw] mx-auto mt-2">
                    {/* Dropdown now takes full width of container */}
                    <select
                        value={selectedCountry}
                        onChange={handleCountryChange}
                        className="w-full p-2 rounded border-2 border-black bg-gray-400 text-white font-bold text-lg"
                    >
                        {selectedCountry === "" && (
                            <option value="">Select Country</option>
                        )}
                        {countries.map((country) => (
                            <option
                                key={country.id}
                                value={country.country_name}
                            >
                                {country.country_name}
                            </option>
                        ))}
                    </select>
                </div>
                <section className="mt-1">
                    <div className="p-2 rounded-md shadow-md">
                        {draws.length === 0 ? (
                            <h2 className="text-center">No Data to Display</h2>
                        ) : (
                            draws.map((draw) => (
                                <DrawCard key={draw.id} draw={draw} />
                            ))
                        )}
                    </div>
                </section>

                {/* Bottom Banner for Ongoing Events */}
                <BannerComponent
                    pageName="Ongoing Events"
                    position="bottom"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mb-2"
                />
            </main>
            <Footer />
        </div>
    );
}

interface DrawCardProps {
    draw: Draw;
}

export const DrawCard: React.FC<DrawCardProps> = memo(({ draw }) => {
    const navigate = useNavigate();

    // Memoize date formatting to prevent recalculation on every render
    const formattedStartDate = useMemo(() => {
        if (!draw.start_date) return "Not Available";
        const dateObj = new Date(draw.start_date);
        const datePart = dateObj.toLocaleDateString("en-GB").replace(/\//g, "-");
        const timePart = dateObj.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${datePart} ${timePart} GMT`;
    }, [draw.start_date]);

    const formattedEndDate = useMemo(() => {
        if (!draw.end_date) return "Not Available";
        const dateObj = new Date(draw.end_date);
        const datePart = dateObj.toLocaleDateString("en-GB").replace(/\//g, "-");
        const timePart = dateObj.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
        });
        return `${datePart} ${timePart} GMT`;
    }, [draw.end_date]);

    const handleCardClick = useCallback(() => {
        navigate(`/draw-event/${draw.id}`);
    }, [navigate, draw.id]);

    return (
        <div
            className="flex gap-1 flex-col border-2 text-center border-black rounded-lg mb-2 cursor-pointer"
            onClick={handleCardClick}
        >
            <h2 className="text-black ps-3 font-bold">{draw.draw_name}</h2>
            <img
                src={draw.draw_image}
                alt={draw.draw_name}
                className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto"
                loading="lazy"
            />
            <div className="flex justify-between">
                <h2 className="text-black ps-3">
                    Start On: {formattedStartDate}
                </h2>
                <h2 className="text-black pe-3">
                    End On: {formattedEndDate}
                </h2>
            </div>
        </div>
    );
});
