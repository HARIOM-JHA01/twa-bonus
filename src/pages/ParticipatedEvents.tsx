import Header from "../components/Header";
import Footer from "../components/Footer";
import BannerComponent from "../components/BannerComponent";
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import WebApp from "@twa-dev/sdk";
import { Draw } from "../types/type";

export default function AvailableEvents() {
    const [draws, setDraws] = useState<Draw[]>([]);
    const [error, setError] = useState<string | null>(null);
    const userContext = useContext(UserContext);
    const user = userContext?.user; // Default user ID

    useEffect(() => {
        fetch(
            `https://bonusforyou.org/api/user/Participated_draws?user_id=${user.id}`
        )
            .then((response) => {
                if (!response.ok) {
                    // Throw an error to be caught below if the status is not OK (e.g., 404)
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                // Ensure that we are setting an array even if data.data is undefined
                if (data && Array.isArray(data.data)) {
                    setDraws(data.data);
                } else {
                    setDraws([]);
                }
            })
            .catch((error) => {
                console.error("Error fetching draws:", error);
                setError("");
                setDraws([]); // Set empty array to prevent crash in rendering
            });

        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => {
            window.history.back();
        });
    }, [user.id]);

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col min-h-[100vh] w-full">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    Participated Events
                </div>

                {/* Top Banner for Participated Events */}
                <BannerComponent
                    pageName="Participated Events"
                    position="top"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mt-2"
                />

                <section className="mt-4">
                    <div className="p-2 rounded-md shadow-md">
                        {error && <p className="text-red-500">{error}</p>}
                        {draws.length === 0 ? (
                            <h2>No Data to Display</h2>
                        ) : (
                            draws.map((draw) => (
                                <DrawCard key={draw.id} draw={draw} />
                            ))
                        )}
                    </div>
                </section>

                {/* Bottom Banner for Participated Events */}
                <BannerComponent
                    pageName="Participated Events"
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

export const DrawCard: React.FC<DrawCardProps> = ({ draw }) => {
    const navigate = useNavigate();
    return (
        <div
            className="flex gap-1 flex-col border-2 text-center border-black rounded-lg mb-2 cursor-pointer"
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
