import Header from "../components/Header";
import Footer from "../components/Footer";
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

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col min-h-[70vh] w-full">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    Available Events
                </div>
                {/* Container with fixed width */}
                <div className="w-[92vw] mx-auto mt-4">
                    {/* Dropdown now takes full width of container */}
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full p-2 rounded border border-black bg-yellow-300 text-black"
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
                <section className="mt-4">
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
            </main>
            <Footer />
        </div>
    );
}

interface DrawCardProps {
    draw: Draw;
    navigate: any;
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
                    Start On: {draw.start_date || "Not Available"}
                </h2>
                <h2 className="text-black pe-3">
                    End On: {draw.end_date || "Not Available"}
                </h2>
            </div>
        </div>
    );
};
