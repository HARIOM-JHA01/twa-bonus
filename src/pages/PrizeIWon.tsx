import Header from "../components/Header";
import Footer from "../components/Footer";
import BannerComponent from "../components/BannerComponent";
import { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import WebApp from "@twa-dev/sdk";
import { useNavigate } from "react-router-dom";
import giftBoxPath from "/giftbox.png";

// Updated Draw interface matching API response
interface Draw {
    id: number;
    user_id: number;
    poster_name: string;
    draw_name: string;
    draw_image: string;
    country: string;
    start_date: string;
    end_date: string;
    draw_detail: string;
    status: string;
    draw_status: number;
    channel_link: string | null;
    repeat: string;
    created_at: string;
    updated_at: string;
    win_no: string;
    win_prize: string;
    ewin_no: string;
    ewin_prize: string;
}

export default function PrizeIWon() {
    const [draws, setDraws] = useState<Draw[]>([]);
    const [selectedDraw, setSelectedDraw] = useState<Draw | null>(null);
    const userContext = useContext(UserContext);
    const user = userContext?.user || { id: 72 }; // Default user ID

    useEffect(() => {
        fetch(`https://bonusforyou.org/api/user/Win_draws?user_id=${user.id}`)
            .then((response) => response.json())
            .then((data) => {
                if (data && data.data) {
                    setDraws(data.data);
                } else {
                    setDraws([]);
                }
            })
            .catch((error) => console.error("Error fetching draws:", error));

        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => {
            window.history.back();
        });
    }, [user.id]);

    const handleCardClick = (draw: Draw) => {
        setSelectedDraw(draw);
    };

    const handleCloseDetail = () => {
        setSelectedDraw(null);
    };

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col min-h-[100vh] w-full relative">
                <div className="text-center text-lg font-bold text-white bg-gray-500">
                    Prize I Won
                </div>

                {/* Top Banner for Prize I Won */}
                <BannerComponent
                    pageName="Prize I Won"
                    position="top"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mt-2"
                />

                <section className="mt-4 px-2">
                    {draws.length === 0 ? (
                        <h2 className="p-2 text-center rounded-md shadow-md">
                            No Data to Display
                        </h2>
                    ) : (
                        draws.map((draw) => (
                            <DrawCard
                                key={draw.id}
                                draw={draw}
                                onCardClick={handleCardClick}
                            />
                        ))
                    )}
                </section>

                {/* Bottom Banner for Prize I Won */}
                <BannerComponent
                    pageName="Prize I Won"
                    position="bottom"
                    className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mb-2"
                />

                {selectedDraw && (
                    <DrawDetail
                        draw={selectedDraw}
                        onClose={handleCloseDetail}
                    />
                )}
            </main>
            <Footer />
        </div>
    );
}

interface DrawCardProps {
    draw: Draw;
    onCardClick: (draw: Draw) => void;
}

export const DrawCard: React.FC<DrawCardProps> = ({ draw, onCardClick }) => {
    const navigate = useNavigate();

    const handleGiftBoxClick = (e: React.MouseEvent<HTMLImageElement>) => {
        e.stopPropagation();
        onCardClick(draw);
    };

    return (
        <div
            className="flex gap-1 flex-col border-2 text-center border-black rounded-lg mb-2 cursor-pointer"
            onClick={() => navigate(`/participated-draw-event/${draw.id}`)}
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

                <div className="cursor-pointer" onClick={handleGiftBoxClick}>
                    <img
                        src={giftBoxPath}
                        alt="gift box"
                        className="w-7 h-7 pe-2"
                    />
                </div>
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

interface DrawDetailProps {
    draw: Draw;
    onClose: () => void;
}

export const DrawDetail: React.FC<DrawDetailProps> = ({ draw, onClose }) => {
    return (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-yellow-300 m-4 p-6 rounded-lg relative shadow-lg max-w-md w-full">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                >
                    ✖
                </button>
                <p className="text-center text-black mt-2 border font-bold border-black p-2 rounded-lg mb-3">
                    {draw.draw_name}
                </p>
                <img
                    src={draw.draw_image}
                    alt={draw.draw_name}
                    className="w-full h-auto object-cover rounded-lg mb-4"
                />
                <h2 className="text-md font-bold text-center text-yellow-600">
                    Congratulation !!!
                </h2>
                <h2 className="text-md font-bold text-center mb-4 text-yellow-600">
                    You are the winner for the prizes below
                </h2>
                <div className="flex flex-col gap-2">
                    <p className="text-lg text-black">
                        Prize Won: {draw.win_prize}
                    </p>
                    <p className="text-lg text-black">
                        Early Bird Prize Won: {draw.ewin_prize}
                    </p>
                </div>
                <p className="font-bold text-center mt-3">
                    Note: To claim your reward, contact our telegram channel
                </p>
            </div>
        </div>
    );
};
