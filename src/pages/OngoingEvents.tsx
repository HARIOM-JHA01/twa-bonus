import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import WebApp from "@twa-dev/sdk";

import { Draw } from "../types/type";

export default function OngoingEvents() {
    const [draws, setDraws] = useState<Draw[]>([]);
    const userContext = useContext(UserContext);
    const user = userContext?.user;
    const countryName = user?.country;

    useEffect(() => {
        const fetchDraws = async () => {
            try {
                const payload = {
                    user_id: user.id,
                    contry_id: countryName,
                };
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
                setDraws(data.data);
            } catch (error) {
                console.error("Error fetching draws:", error);
            }
        };

        fetchDraws();

        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => {
            window.history.back();
        });
    }, [user.id, countryName]);

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col min-h-[70vh] w-full">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    Ongoing Events
                </div>
                <section className="mt-2">
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
