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

    // Local state for the selected country name.
    const [selectedCountry, setSelectedCountry] = useState<string>("");

    // Fetch the list of countries and set the default selection based on the user's current country.
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch(
                    "https://bonusforyou.org/api/countries"
                );
                const data = await response.json();
                if (data.status) {
                    setCountries(data.data);
                    // If user has a country (stored as country name), find the matching country.
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
    }, [user]);

    // Fetch the running draws whenever the user or selected country changes.
    useEffect(() => {
        if (!user?.id) {
            console.error("User ID not available, cannot fetch data");
            return;
        }
        const fetchDraws = async () => {
            try {
                const payload = {
                    user_id: user.id,
                    // Passing the selected country name in the payload.
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
                setDraws(data.data || []); // ensure draws is always an array
            } catch (error) {
                console.error("Error fetching draws:", error);
                setDraws([]); // fallback to empty array
            }
        };

        fetchDraws();

        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => {
            window.history.back();
        });

        return () => {
            WebApp.BackButton.offClick(() => {
                window.history.back();
            });
        };
    }, [user?.id, selectedCountry]);

    // Update the selected country when the user chooses a different one.
    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCountry(e.target.value);
        console.log("Selected country:", e.target.value);
    };

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col min-h-[70vh] w-full">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    Ongoing Events
                </div>
                <div className="w-[92vw] mx-auto mt-4">
                    <select
                        value={selectedCountry}
                        onChange={handleCountryChange}
                        className="w-full p-2 rounded border border-black bg-yellow-300 text-black"
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
                <section className="mt-4">
                    <div className="p-2 rounded-md text-center shadow-md">
                        {draws.length === 0 ? (
                            <h2>No Data to Display</h2>
                        ) : (
                            draws.map((draw) => (
                                <DrawCard key={draw.id} draw={draw} />
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
}

export const DrawCard: React.FC<DrawCardProps> = ({ draw }) => {
    const navigate = useNavigate();
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
                    Start On: {new Date(draw.start_date).toLocaleDateString()}
                </h2>
                <h2 className="text-black pe-3">
                    End On: {new Date(draw.end_date).toLocaleDateString()}
                </h2>
            </div>
        </div>
    );
};
