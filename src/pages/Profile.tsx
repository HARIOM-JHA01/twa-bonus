import Header from "../components/Header";
import Footer from "../components/Footer";
import BannerComponent from "../components/BannerComponent";
import { useState, useEffect, useContext } from "react";
import WebApp from "@twa-dev/sdk";
import { UserContext } from "../context/UserContext.js";

export default function Profile() {
    const [error, setError] = useState("");

    const userContext = useContext(UserContext);
    if (!userContext) {
        setError("UserContext must be used within a UserProvider");
        throw new Error("UserContext must be used within a UserProvider");
    }
    const { user, isLoggedIn } = userContext;

    useEffect(() => {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => {
            window.history.back();
        });

        return () => {
            WebApp.BackButton.offClick(() => {
                window.history.back();
            });
        };
    }, []);

    return (
        <div className="bg-yellow-300 min-h-screen">
            <Header />
            <div className="text-center text-lg font-bold text-white bg-gray-500">
                My Profile
            </div>

            {/* Top Banner for Participants My Profile */}
            <BannerComponent
                pageName="Participants My Profile"
                position="top"
                className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mt-2"
            />

            <main className="bg-yellow-300 flex flex-col items-center w-full pt-4">
                {error ? (
                    <h1 className="text-red-600 font-bold">{error}</h1>
                ) : (
                    <>
                        {isLoggedIn ? (
                            <div className="flex flex-col gap-4 max-w-md bg-yellow-300 rounded-lg w-full">
                                <div className="flex flex-col px-4">
                                    <label className="font-semibold text-xl text-black">
                                        Name
                                    </label>
                                    <div className="border-black border-2 rounded px-4 py-5 text-black">
                                        {user?.name ||
                                            "Not provided"}
                                    </div>
                                </div>

                                <div className="flex flex-col px-4">
                                    <label className="font-semibold text-xl text-black">
                                        Telegram ID
                                    </label>
                                    <div className="border-black border-2 rounded px-4 py-2 text-black">
                                        {WebApp.initDataUnsafe.user?.username ||
                                            "Not provided"}
                                    </div>
                                </div>
                                <div className="flex flex-col px-4">
                                    <label className="font-semibold text-xl text-black">
                                        Country
                                    </label>
                                    <div className="border-black border-2 rounded px-4 py-2 text-black">
                                        {user.country || ""}
                                    </div>
                                </div>
                                <div className="flex flex-col px-4 pb-4">
                                    <label className="font-semibold text-xl text-black">
                                        Participant Code
                                    </label>
                                    <div className="border-black border-2 rounded px-4 py-2 text-black">
                                        {user.uniqueId || ""}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                Loading
                                {WebApp.initDataUnsafe.user?.id}
                            </div>
                        )}

                        {/* Bottom Banner for Participants My Profile - Moved outside of conditional */}
                        <BannerComponent
                            pageName="Participants My Profile"
                            position="bottom"
                            className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto mt-4 mb-4"
                        />
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
