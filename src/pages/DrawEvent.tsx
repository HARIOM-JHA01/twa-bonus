import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { UserContext } from "../context/UserContext";
import { IndividualDraw } from "../types/type";

export default function DrawEvent() {
    const { id } = useParams<{ id: string }>();
    const [rewardDetail, setRewardDetail] = useState<IndividualDraw | null>(
        null
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [verificationLink, setVerificationLink] = useState("");
    // New state to accumulate verified links
    const [verifiedLinks, setVerifiedLinks] = useState<string[]>([]);
    // current verification step index
    const [currentVerificationIndex, setCurrentVerificationIndex] = useState(0);
    const [isWithinDateRange, setIsWithinDateRange] = useState(false);
    const [countdown, setCountdown] = useState<string>("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [hasJoined, setHasJoined] = useState(false);
    const userContext = useContext(UserContext);

    if (!userContext) {
        throw new Error("UserContext must be used within a UserProvider");
    }
    const { user } = userContext;

    useEffect(() => {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(() => {
            window.history.back();
        });

        if (id) {
            fetch(`https://bonusforyou.org/api/user/drawlistsingle/${id}`)
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(
                            `HTTP error! status: ${response.status}`
                        );
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data.status) {
                        const rewardData = data.data;
                        setRewardDetail(rewardData);
                        checkDateRange(
                            rewardData.start_date,
                            rewardData.end_date
                        );
                        checkIfAlreadyJoined(String(user.id), id);
                        console.log(
                            `https://bonusforyou.org/api/user/drawlistsingle/${id}`
                        );
                    } else {
                        console.error(
                            "Error fetching reward details:",
                            data.message
                        );
                    }
                })
                .catch((error) => {
                    console.error("Error fetching reward details:", error);
                });
        }
    }, [id, user]);

    const checkDateRange = (startDate: string, endDate: string) => {
        const currentDate = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        setIsWithinDateRange(currentDate >= start && currentDate <= end);
        console.log(
            "isWithinDateRange:",
            currentDate >= start && currentDate <= end
        );
        calculateCountdown(start);
    };

    const checkIfAlreadyJoined = async (userId: string, drawId: string) => {
        if (!userId || !drawId) {
            console.warn(
                "User ID or Draw ID is missing. Cannot check if already joined."
            );
            return;
        }

        try {
            const response = await fetch(
                `https://bonusforyou.org/api/user/CheckUserJoinDraw/${userId}/${drawId}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log("Check if already joined:", data);
            if (data == 1) {
                setHasJoined(true);
            } else {
                setHasJoined(false);
            }
        } catch (error) {
            console.error("Error joining draw:", error);
        }
    };

    const calculateCountdown = (startDate: Date) => {
        const interval = setInterval(() => {
            const now = new Date();
            const timeDiff = startDate.getTime() - now.getTime();

            if (timeDiff <= 0) {
                setCountdown("");
                clearInterval(interval);
            } else {
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
                const seconds = Math.floor((timeDiff / 1000) % 60);
                setCountdown(`${days}D ${hours}H ${minutes}M ${seconds}S`);
            }
        }, 1000);
        return () => clearInterval(interval);
    };

    // Helper to gather available verification links (max up to 5)
    const getVerificationLinks = () => {
        if (!rewardDetail) return [];
        const links = [
            rewardDetail.verifiaction_link_0,
            rewardDetail.verifiaction_link_1,
            rewardDetail.verifiaction_link_2,
            rewardDetail.verifiaction_link_3,
            rewardDetail.verifiaction_link_4,
        ];
        return links.filter((link) => link && link.trim().length > 0);
    };

    // Helper function to join the user via API call.
    // It sends the verification links as a string formatted like "[link1, link2, ...]"
    const joinUser = (verifiedLinksArray: string[]) => {
        const lowercaseVerifiedLinks = verifiedLinksArray.map((link) =>
            link.toLowerCase()
        );

        const payload = {
            user_id: user.id,
            Draw_id: id,
            Verification_link: `[${lowercaseVerifiedLinks.join(", ")}]`,
        };
        console.log("Joining user with payload:", payload);

        fetch(`https://bonusforyou.org/api/user/joinDraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.status) {
                    console.log("Joined successfully");
                    setIsModalOpen(false);
                    setShowSuccessModal(true);
                    setIsWithinDateRange(false);
                    setHasJoined(true);
                    // Reset the verification process for future use.
                    setCurrentVerificationIndex(0);
                    setVerificationLink("");
                    setVerifiedLinks([]);
                    setTimeout(() => {
                        setShowSuccessModal(false);
                    }, 5000);
                } else {
                    console.error("Error joining draw:", data.message);
                    setIsModalOpen(false);
                    setShowErrorModal(true);
                    setErrorMessage(
                        data.message ||
                            "Failed to join event. Please try again."
                    );
                    setTimeout(() => {
                        setShowErrorModal(false);
                        setVerificationLink("");
                    }, 10000);
                }
            })
            .catch((error) => {
                console.error("Error joining draw:", error);
                setIsModalOpen(false);
                setShowErrorModal(true);
                setErrorMessage("Failed to join event. Please try again.");
                setTimeout(() => {
                    setShowErrorModal(false);
                    setVerificationLink("");
                }, 10000);
            });
    };

    // When the user clicks join, check available verification links.
    const handleJoinClick = () => {
        if (!rewardDetail) return;
        const availableLinks = getVerificationLinks();
        if (availableLinks.length > 0) {
            const currentLink = availableLinks[currentVerificationIndex];
            if (currentLink) {
                window.open(currentLink, "_blank");
                setIsModalOpen(true);
            }
        } else {
            joinUser([]);
        }
    };

    const handleModalSubmit = () => {
        if (!rewardDetail) return;
        const availableLinks = getVerificationLinks();
        const expectedLink = availableLinks[currentVerificationIndex];

        // Convert both links to lowercase for case-insensitive comparison
        if (
            verificationLink.trim().toLowerCase() !==
            expectedLink?.toLowerCase()
        ) {
            setShowErrorModal(true);
            setErrorMessage(
                "Verification link does not match. Please try again."
            );
            setTimeout(() => setShowErrorModal(false), 10000);
            return;
        }

        const newVerifiedLinks = [...verifiedLinks, verificationLink];
        setVerifiedLinks(newVerifiedLinks);

        if (currentVerificationIndex < availableLinks.length - 1) {
            const nextIndex = currentVerificationIndex + 1;
            setCurrentVerificationIndex(nextIndex);
            setVerificationLink("");
            const nextLink = availableLinks[nextIndex];
            if (nextLink) {
                window.open(nextLink, "_blank");
            }
        } else {
            joinUser(newVerifiedLinks);
        }
    };

    if (!rewardDetail) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Determine total steps from available verification links.
    const availableVerificationLinks = getVerificationLinks();

    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col w-full min-h-screen p-4">
                <img
                    src={rewardDetail.draw_image}
                    alt={rewardDetail.draw_name}
                    className="rounded-lg shadow-lg w-[90vw] max-h-[120px] mx-auto my-3 object-fill"
                />
                <h2 className="text-center text-black font-bold">
                    Event Title:
                </h2>
                <p className="text-center text-black border border-black p-2 rounded-lg">
                    {rewardDetail.draw_name}
                </p>
                <h2 className="text-center text-black font-bold">
                    Events Detail and Join Channel as Subscriber:
                </h2>
                <a
                    href={rewardDetail.prize_detail_link || ""}
                    className="text-center text-red-500 border border-black p-2 rounded-lg"
                >
                    {rewardDetail.prize_detail_link || ""}
                </a>
                <h2 className="text-center text-black font-bold">Prizes:</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center text-black p-2 rounded-lg border border-black">
                    {rewardDetail.Prize_list.map((prize, index) => (
                        <li
                            key={index}
                            className="flex justify-between items-center"
                        >
                            <div className="flex-1">{prize.no_win_prize}</div>
                            <div className="flex-1">{prize.no_of_prize}</div>
                            <div className="flex-1">{prize.prize}</div>
                        </li>
                    ))}
                </ul>
                {rewardDetail.Prize_list.some(
                    (prize) => Number(prize.e_no_of_prize || "0") !== 0
                ) && (
                    <>
                        <h2 className="text-center text-black font-bold">
                            Early Birds Prize:
                        </h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center text-black p-2 rounded-lg border border-black">
                            {rewardDetail.Prize_list.filter(
                                (prize) =>
                                    Number(prize.e_no_of_prize || "0") !== 0
                            ).map((prize, index) => (
                                <li
                                    key={index}
                                    className="flex justify-between items-center"
                                >
                                    <div className="flex-1">
                                        {prize.e_no_win_prize}
                                    </div>
                                    <div className="flex-1">
                                        {prize.e_no_of_prize}
                                    </div>
                                    <div className="flex-1">
                                        {prize.e_prize}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <h2 className="text-center text-black font-bold">
                    Event Brief:
                </h2>
                <p
                    className="text-center text-black border border-black p-2 rounded-lg min-h-10"
                    dangerouslySetInnerHTML={{
                        __html: rewardDetail.draw_detail || "",
                    }}
                />
                <h2 className="text-center text-black font-bold">
                    Draw to be performed on:
                </h2>
                <p className="text-center text-black border border-black p-2 rounded-lg text-lg">
                    {new Date(
                        rewardDetail.winner_declare_date
                    ).toLocaleDateString("en-IN", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </p>
                {!hasJoined && isWithinDateRange && (
                    <div className="flex justify-center items-center my-3">
                        <button
                            onClick={handleJoinClick}
                            className="bg-green-600 p-2 rounded-lg text-white font-semibold"
                        >
                            VIEW POST TO JOIN PROGRAM
                        </button>
                    </div>
                )}
                {isWithinDateRange && !hasJoined && (
                    <h3 className="text-black">
                        User Left to Join: {rewardDetail.join_user}
                    </h3>
                )}
                {!isWithinDateRange && countdown && !hasJoined && (
                    <h3 className="text-center text-black font-bold text-2xl mt-3">
                        {countdown}
                    </h3>
                )}
                {!hasJoined && (
                    <p className="text-center text-black text-sm p-4 rounded-lg">
                        View Events Post Detail, Join Channel and Copy Events
                        Post Link. Come back and paste the link here to verify
                        your join.
                    </p>
                )}
                <div
                    className="rounded-full w-12 h-12 bg-red-500 justify-center items-center flex mx-auto"
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        WebApp.showAlert(
                            "Event link has been copied successfully. Paste it to telegram to share it with your friends"
                        );
                    }}
                >
                    <img className="w-6 h-6" src="/share.png" alt="Share" />
                </div>
                <Footer />
                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-yellow-300 p-6 rounded-lg flex flex-col items-center">
                            <h2 className="text-center text-black font-bold mb-4">
                                Please input the verification link (Step{" "}
                                {currentVerificationIndex + 1} of{" "}
                                {availableVerificationLinks.length}):
                            </h2>
                            <input
                                type="text"
                                value={verificationLink}
                                onChange={(e) =>
                                    setVerificationLink(e.target.value)
                                }
                                className="w-full p-2 bg-yellow-300 border-2 border-black rounded mb-4"
                            />
                            <img
                                src={rewardDetail.draw_image}
                                alt={rewardDetail.draw_name}
                                className="rounded mb-4"
                            />
                            <button
                                onClick={handleModalSubmit}
                                className="bg-green-600 p-2 px-10 rounded-lg text-white font-semibold"
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                )}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-white p-6 rounded-lg flex flex-col items-center">
                            <h2 className="text-center text-black font-bold mb-4">
                                Joined Successfully!
                            </h2>
                            <img
                                src={rewardDetail.draw_image}
                                alt={rewardDetail.draw_name}
                                className="rounded mb-4"
                            />
                        </div>
                    </div>
                )}
                {showErrorModal && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-yellow-300 p-6 rounded-lg flex flex-col items-center">
                            <p className="text-center text-red-600 font-bold">
                                {errorMessage}
                            </p>
                            <img
                                src={rewardDetail.draw_image}
                                alt={rewardDetail.draw_name}
                                className="rounded mb-4"
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
