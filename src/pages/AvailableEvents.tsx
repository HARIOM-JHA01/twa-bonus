import Header from "../components/Header";
import Footer from "../components/Footer";
import BannerComponent from "../components/BannerComponent";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import WebApp from "@twa-dev/sdk";

import { Draw } from "../types/type";

type Country = {
    id: number;
    country_name: string;
    country_code: string;
};

export default function AvailableEvents() {
    const userContext = useContext(UserContext);
    const user = userContext?.user;
    const setUser = userContext?.setUser;
    const navigate = useNavigate();

    // Local state for the list of countries and the selected country
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<string>(
        user?.country || ""
    );
    const [draws, setDraws] = useState<Draw[] | null>(null);

    // Fetch countries list on mount
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch(
                    "https://bonusforyou.org/api/countries"
                );
                const data = await response.json();
                if (data.status) {
                    setCountries(data.data);
                }
            } catch (error) {
                console.error("Error fetching countries:", error);
            }
        };

        fetchCountries();
    }, []);

    // Update selected country whenever user.country changes
    useEffect(() => {
        if (user?.country) {
            setSelectedCountry(user.country);
        }
    }, [user?.country]);

    // Fetch draws whenever user id or selectedCountry changes
    useEffect(() => {
        const fetchDraws = async () => {
            try {
                if (!user?.id || !selectedCountry) {
                    console.error(
                        "User ID or selected country not available, cannot fetch data"
                    );
                    return;
                }
                const payload = {
                    user_id: user.id,
                    contry_id: selectedCountry,
                };
                const response = await fetch(
                    "https://bonusforyou.org/api/user/countrywisedraw",
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
                console.log("Data fetched:", data);
                if (data.status === false) {
                    setDraws([]);
                } else {
                    setDraws(data.data);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setDraws(null);
            }
        };

        fetchDraws();
    }, [user?.id, selectedCountry]);

    // Set up back button only once
    useEffect(() => {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(handleBack);
        return () => {
            WebApp.BackButton.offClick(handleBack);
        };
    }, []);

    const handleBack = () => {
        window.history.back();
    };

    // Handle country change and update in context
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCountry = e.target.value;
        setSelectedCountry(newCountry);
        
        // Update country in user context to make it consistent across the app
        if (setUser && user) {
            setUser({
                ...user,
                country: newCountry
            });
        }
    };

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col min-h-[100vh] w-full">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    Available Events
                </div>

                {/* Use BannerComponent with the country prop */}
                <BannerComponent
                    pageName="Available Events"
                    position="top"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mt-2"
                    country={selectedCountry}
                />

                {/* Container with fixed width */}
                <div className="w-[95vw] mx-auto mt-2">
                    {/* Dropdown now takes full width of container */}
                    <select
                        value={selectedCountry}
                        onChange={handleCountryChange}
                        className="w-full p-2 rounded border-2 border-black bg-gray-400 text-white font-bold text-lg"
                    >
                        <option value="">Select a country</option>
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
                    <div className="p-3 rounded-md text-center">
                        {draws?.length === 0 ? (
                            <h2>No Data to Display</h2>
                        ) : (
                            draws?.map((draw) => (
                                <DrawCard
                                    key={draw.id}
                                    draw={draw}
                                    navigate={navigate}
                                />
                            ))
                        )}
                    </div>
                </section>

                {/* Bottom Banner with country prop */}
                <BannerComponent
                    pageName="Available Events"
                    position="bottom"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mb-2"
                    country={selectedCountry}
                />
            </main>
            <Footer />
        </div>
    );
}

interface DrawCardProps {
    draw: Draw;
    navigate: (path: string) => void;
}

const DrawCard: React.FC<DrawCardProps> = ({ draw, navigate }) => {
    return (
        <div
            className="flex gap-1 flex-col border-2 border-black rounded-lg mb-2 cursor-pointer"
            onClick={() => navigate(`/draw-event/${draw.id}`)}
        >
            <h2 className="text-black ps-3 font-bold">{draw.draw_name}</h2>
            <img
                src={draw.draw_image}
                alt={draw.draw_name}
                className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto"
            />
            <div className="flex justify-between">
                <h2 className="text-black ps-3">
                    Start On:{" "}
                    {draw.start_date
                        ? (() => {
                              const dateObj = new Date(draw.start_date);
                              // Format the date as dd-mm-yyyy
                              const datePart = dateObj
                                  .toLocaleDateString("en-GB")
                                  .replace(/\//g, "-");
                              // Format the time as hh:mm (24-hour format)
                              const timePart = dateObj.toLocaleTimeString(
                                  "en-GB",
                                  {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  }
                              );
                              return `${datePart} ${timePart} GMT`;
                          })()
                        : "Not Available"}
                </h2>
                <h2 className="text-black pe-3">
                    End On:{" "}
                    {draw.end_date
                        ? (() => {
                              const dateObj = new Date(draw.end_date);
                              const datePart = dateObj
                                  .toLocaleDateString("en-GB")
                                  .replace(/\//g, "-");
                              const timePart = dateObj.toLocaleTimeString(
                                  "en-GB",
                                  {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                  }
                              );
                              return `${datePart} ${timePart} GMT`;
                          })()
                        : "Not Available"}
                </h2>
            </div>
        </div>
    );
};
