import Header from "../components/Header";
import Footer from "../components/Footer";
// Added useRef, useCallback
import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import WebApp from "@twa-dev/sdk";
import { UserContext } from "../context/UserContext";
import { IndividualDraw } from "../types/type"; // Assuming this type is correct

export default function DrawEvent() {
    const { id } = useParams<{ id: string }>();
    const [rewardDetail, setRewardDetail] = useState<IndividualDraw | null>(
        null
    );
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [verificationLink, setVerificationLink] = useState("");
    const [verifiedLinks, setVerifiedLinks] = useState<string[]>([]);
    const [currentVerificationIndex, setCurrentVerificationIndex] = useState(0);
    const [isWithinDateRange, setIsWithinDateRange] = useState(false);
    const [countdown, setCountdown] = useState<string>("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [hasJoined, setHasJoined] = useState(false);

    // --- NEW: Added Loading State & Time Offset State ---
    const [isLoading, setIsLoading] = useState(true);
    const [timeOffset, setTimeOffset] = useState<number>(0);

    // --- NEW: Ref for the countdown interval ---
    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
        null
    );

    const userContext = useContext(UserContext);
    if (!userContext) {
        throw new Error("UserContext must be used within a UserProvider");
    }
    const { user } = userContext;

    // --- NEW: Time Logic Functions (Copied from RewardEvent) ---
    const getCurrentEstimatedUTCTime = () => Date.now() + timeOffset;

    const parseServerDateAsUTC = (dateStr: string): Date | null => {
        if (!dateStr || typeof dateStr !== "string") {
            console.warn("Invalid date string provided:", dateStr);
            return null;
        }
        let isoStr = dateStr.trim().replace(" ", "T");
        // Assuming server format is 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD HH:MM'
        if (isoStr.length === 16) {
            // 'YYYY-MM-DDTHH:MM'
            isoStr += ":00Z";
        } else if (isoStr.length === 19) {
            // 'YYYY-MM-DDTHH:MM:SS'
            // Check if it already ends with Z
            if (!isoStr.endsWith("Z")) {
                isoStr += "Z";
            }
        } else if (!isoStr.endsWith("Z")) {
            // Handle other potential formats or append Z as a fallback
            console.warn(
                "Unrecognized date format, attempting UTC conversion by appending Z:",
                dateStr,
                "->",
                isoStr + "Z"
            );
            isoStr += "Z";
        }

        const date = new Date(isoStr);
        if (isNaN(date.getTime())) {
            console.error(
                "Failed to parse date string as UTC:",
                dateStr,
                "->",
                isoStr
            );
            return null;
        }
        return date;
    };

    // --- NEW: Back Button Logic (Improved with useCallback) ---
    const handleBackButtonClick = useCallback(() => {
        window.history.back();
    }, []);

    useEffect(() => {
        WebApp.BackButton.show();
        WebApp.BackButton.onClick(handleBackButtonClick);

        return () => {
            // Ensure cleanup only happens if the button is still visible
            // (prevents errors if component unmounts quickly)
            if (WebApp.BackButton.isVisible) {
                WebApp.BackButton.hide();
                WebApp.BackButton.offClick(handleBackButtonClick);
            }
        };
    }, [handleBackButtonClick]);

    // --- REFACTORED: Main Data Fetching and Processing Effect ---
    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);
        // Reset states on ID change
        setRewardDetail(null);
        setIsWithinDateRange(false);
        setCountdown("");
        setHasJoined(false);
        setErrorMessage("");
        setCurrentVerificationIndex(0);
        setVerifiedLinks([]);
        setVerificationLink("");
        setIsModalOpen(false); // Close modal if open
        setShowSuccessModal(false);
        setShowErrorModal(false);

        // Clear any previous interval
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        const fetchAndProcessData = async () => {
            if (!id) {
                if (isMounted) {
                    setErrorMessage("Draw Event ID is missing.");
                    setIsLoading(false);
                }
                console.error("No ID provided for draw event.");
                return;
            }

            let apiUTCTimeMs: number | null = null;
            let fetchedRewardDetail: IndividualDraw | null = null;

            try {
                // 1. Fetch UTC Time
                console.log("Fetching UTC time...");
                const timeRes = await fetch(
                    "https://timeapi.io/api/Time/current/zone?timeZone=UTC"
                );
                if (!timeRes.ok)
                    throw new Error(`Time API error: ${timeRes.status}`);
                const timeData = await timeRes.json();
                const apiUTCStr = timeData.dateTime;
                const parsedApiUTCTime = new Date(apiUTCStr);

                if (isNaN(parsedApiUTCTime.getTime())) {
                    throw new Error("Failed to parse UTC time from API");
                }
                apiUTCTimeMs = parsedApiUTCTime.getTime();

                const offset = apiUTCTimeMs - Date.now();
                if (isMounted) setTimeOffset(offset);
                console.log("API UTC Time:", parsedApiUTCTime.toISOString());
                console.log("Calculated Time offset (ms):", offset);

                // 2. Fetch Draw Details
                console.log("Fetching draw details for id:", id);
                const rewardRes = await fetch(
                    `https://bonusforyou.org/api/user/drawlistsingle/${id}` // Correct API endpoint
                );
                if (!rewardRes.ok)
                    throw new Error(`Draw API error: ${rewardRes.status}`);
                const rewardJson = await rewardRes.json();

                if (!rewardJson.status || !rewardJson.data) {
                    throw new Error(
                        `Error fetching draw details: ${
                            rewardJson.message || "Data missing in response"
                        }`
                    );
                }
                fetchedRewardDetail = rewardJson.data as IndividualDraw;
                console.log("Draw details fetched:", fetchedRewardDetail);

                if (isMounted) {
                    setRewardDetail(fetchedRewardDetail);

                    // 3. Check Join Status (after getting details and user)
                    // Use user?.id which might be null initially, checkIfAlreadyJoined handles this
                    await checkIfAlreadyJoined(String(user?.id), id); // Pass potential undefined/null safely

                    // 4. Update Event Status using fetched dates and API time
                    // Ensure dates exist before calling
                    if (
                        fetchedRewardDetail.start_date &&
                        fetchedRewardDetail.end_date
                    ) {
                        updateEventStatus(
                            fetchedRewardDetail.start_date,
                            fetchedRewardDetail.end_date,
                            apiUTCTimeMs // Use the accurate time
                        );
                    } else {
                        console.error(
                            "Start or End date missing from fetched data."
                        );
                        // Decide how to handle missing dates - maybe set error state?
                        setIsWithinDateRange(false); // Default to not active if dates missing
                    }
                }
            } catch (error) {
                console.error("Error during data fetching:", error);
                if (isMounted) {
                    setErrorMessage(
                        error instanceof Error
                            ? error.message
                            : "An unknown error occurred while loading data."
                    );
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false); // Stop loading indicator
                }
            }
        };

        fetchAndProcessData();

        // Cleanup function
        return () => {
            isMounted = false;
            console.log("DrawEvent effect cleanup for ID:", id);
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
                console.log(
                    "Countdown interval cleared on main effect cleanup."
                );
            }
        };
        // Depend on id and user.id (user?.id ensures stability if user object changes refs but id remains same)
    }, [id, user?.id]);

    // --- NEW: updateEventStatus Function ---
    const updateEventStatus = (
        startDateStr: string,
        endDateStr: string,
        currentUTCTimeMs: number // Use the accurate time passed in
    ) => {
        const startDate = parseServerDateAsUTC(startDateStr);
        const endDate = parseServerDateAsUTC(endDateStr);

        // Clear any existing interval before setting a new status/countdown
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        setCountdown(""); // Reset countdown display initially

        if (!startDate || !endDate) {
            console.error(
                "Invalid start or end date provided. Cannot determine event status."
            );
            setIsWithinDateRange(false);
            // Potentially set an error message specific to date issues if needed
            // setErrorMessage("Event time configuration error.");
            return;
        }

        const startMs = startDate.getTime();
        const endMs = endDate.getTime();

        // Use the accurate currentUTCTimeMs for comparison
        const isNowWithinRange =
            currentUTCTimeMs >= startMs && currentUTCTimeMs <= endMs;
        const hasStarted = currentUTCTimeMs >= startMs;
        const hasEnded = currentUTCTimeMs > endMs;

        console.log(
            `Date Check: Now=${new Date(
                currentUTCTimeMs
            ).toISOString()}, Start=${startDate.toISOString()}, End=${endDate.toISOString()}`
        );
        console.log(
            `Status: Started=${hasStarted}, Ended=${hasEnded}, WithinRange=${isNowWithinRange}`
        );

        setIsWithinDateRange(isNowWithinRange); // Update state based on accurate comparison

        if (!hasStarted) {
            console.log("Draw Event hasn't started. Starting countdown.");
            // Start countdown based on the accurate start time
            calculateCountdown(startMs);
        } else {
            console.log(
                hasEnded ? "Draw Event has ended." : "Draw Event is active."
            );
            // No countdown needed if started (active or ended)
            // isWithinDateRange state correctly reflects active/inactive status
        }
    };

    // --- UPDATED: checkIfAlreadyJoined (handles missing IDs, uses no-store) ---
    const checkIfAlreadyJoined = async (
        userId: string | undefined,
        drawId: string
    ) => {
        // Check if userId is valid before fetching
        if (!userId || userId === "undefined" || userId === "null" || !drawId) {
            console.warn(
                "User ID or Draw ID is missing/invalid. Cannot check join status.",
                { userId, drawId }
            );
            setHasJoined(false); // Assume not joined if IDs are missing
            return;
        }

        console.log(`Checking join status for user ${userId}, draw ${drawId}`);
        try {
            const response = await fetch(
                `https://bonusforyou.org/api/user/CheckUserJoinDraw/${userId}/${drawId}`,
                { cache: "no-store" } // Ensure fresh status check
            );
            if (!response.ok) {
                console.error(
                    `Check join status HTTP error! Status: ${response.status}`
                );
                setHasJoined(false); // Assume not joined on HTTP error
                return;
            }
            const data = await response.json();
            console.log("CheckUserJoinDraw response:", data);
            const joined = data === 1; // Assuming 1 means joined
            setHasJoined(joined);
            console.log("Setting hasJoined state to:", joined);
        } catch (error) {
            console.error("Error checking join status:", error);
            setHasJoined(false); // Assume not joined on network/parse error
        }
    };

    // --- REFACTORED: calculateCountdown Function ---
    const calculateCountdown = (startUTCms: number) => {
        // Ensure no duplicate intervals are running
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null; // Clear ref immediately
        }

        console.log("Starting new countdown interval for Draw Event...");

        const updateTimer = () => {
            const nowEstimatedUTC = getCurrentEstimatedUTCTime(); // Use estimated time
            const timeDiff = startUTCms - nowEstimatedUTC;

            if (timeDiff <= 0) {
                // Time is up or passed
                setCountdown(""); // Clear countdown display
                if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                }
                // Event should now be active, update status
                // Checking dates again provides robustness if clock sync drifts significantly
                // or simply set the state directly if confident.
                if (rewardDetail?.start_date && rewardDetail?.end_date) {
                    updateEventStatus(
                        rewardDetail.start_date,
                        rewardDetail.end_date,
                        getCurrentEstimatedUTCTime()
                    );
                } else {
                    // Fallback if detail isn't available for some reason
                    setIsWithinDateRange(true);
                }
                console.log(
                    "Countdown finished via interval. Draw Event active/status re-evaluated."
                );
            } else {
                // Calculate remaining time
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
                const seconds = Math.floor((timeDiff / 1000) % 60);
                // Update countdown state string (using original format)
                setCountdown(`${days}D ${hours}H ${minutes}M ${seconds}S`);

                // Schedule the next update
                countdownIntervalRef.current = setTimeout(updateTimer, 1000);
            }
        };

        // Use setTimeout recursively instead of setInterval for potentially better accuracy
        // over long periods or when the tab is inactive (though browser behavior varies)
        countdownIntervalRef.current = setTimeout(updateTimer, 1000);

        // Original setInterval approach (keep if preferred):
        /*
        countdownIntervalRef.current = setInterval(() => {
             const nowEstimatedUTC = getCurrentEstimatedUTCTime();
             const timeDiff = startUTCms - nowEstimatedUTC;
             if (timeDiff <= 0) {
                 setCountdown("");
                 if (countdownIntervalRef.current) {
                     clearInterval(countdownIntervalRef.current);
                     countdownIntervalRef.current = null;
                 }
                 if (rewardDetail?.start_date && rewardDetail?.end_date) {
                      updateEventStatus(rewardDetail.start_date, rewardDetail.end_date, getCurrentEstimatedUTCTime());
                 } else {
                      setIsWithinDateRange(true);
                 }
                 console.log("Countdown finished via interval. Draw Event active/status re-evaluated.");
             } else {
                 const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                 const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
                 const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
                 const seconds = Math.floor((timeDiff / 1000) % 60);
                 setCountdown(`${days}D ${hours}H ${minutes}M ${seconds}S`);
             }
         }, 1000);
        */
    };

    // --- Verification & Joining Logic (Mostly unchanged from your original logic) ---
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
        // Ensure links are valid strings before filtering
        return links.filter(
            (link): link is string =>
                typeof link === "string" && link.trim().length > 0
        );
    };

    const joinUser = (verifiedLinksArray: string[]) => {
        // Ensure user and id are available
        if (!user?.id || !id) {
            console.error("Cannot join: User ID or Draw ID missing.");
            setErrorMessage("Cannot join: Missing required information.");
            setShowErrorModal(true);
            setTimeout(() => setShowErrorModal(false), 5000);
            return;
        }

        // *** IMPORTANT: Verify this payload format matches your API expectation ***
        // This uses the first verification link, same as your original code.
        // If the API needs all verified links, adjust this payload.
        const payload = {
            user_id: user.id,
            Draw_id: id,
            Verification_link: rewardDetail?.verifiaction_link_0, // Or format verifiedLinksArray if needed
        };
        console.log("Joining user with payload:", payload);

        fetch(`https://bonusforyou.org/api/user/joinDraw`, {
            // Correct API endpoint
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
                    setHasJoined(true); // Set hasJoined to true
                    // Reset verification state
                    setCurrentVerificationIndex(0);
                    setVerificationLink("");
                    setVerifiedLinks([]);
                    setTimeout(() => {
                        setShowSuccessModal(false);
                    }, 5000); // Keep timeout as originally set
                } else {
                    console.error("API Error joining draw:", data.message);
                    setIsModalOpen(false);
                    setShowErrorModal(true);
                    setErrorMessage(
                        data.message ||
                            "Failed to join event. Please try again."
                    );
                    // Do not reset verification link on error, allow user to retry/correct
                    setTimeout(() => {
                        setShowErrorModal(false);
                    }, 10000); // Keep timeout as originally set
                }
            })
            .catch((error) => {
                console.error("Network/Fetch Error joining draw:", error);
                setIsModalOpen(false);
                setShowErrorModal(true);
                setErrorMessage(
                    "Failed to join event. Network error or server issue."
                );
                setTimeout(() => {
                    setShowErrorModal(false);
                }, 10000); // Keep timeout as originally set
            });
    };

    const handleJoinClick = () => {
        if (!rewardDetail) return;
        const availableLinks = getVerificationLinks();
        if (availableLinks.length > 0) {
            // Ensure index is valid
            const index = Math.min(
                currentVerificationIndex,
                availableLinks.length - 1
            );
            const currentLink = availableLinks[index];
            if (currentLink) {
                // Use window.open as in the original code
                window.open(currentLink, "_blank");
                setIsModalOpen(true);
            } else {
                console.error(
                    "Could not get verification link at index",
                    index
                );
                // Potentially show an error to the user
                setErrorMessage(
                    "Configuration error: Cannot find verification link."
                );
                setShowErrorModal(true);
                setTimeout(() => setShowErrorModal(false), 5000);
            }
        } else {
            // If no verification links are defined, attempt direct join (same as original implicit behavior)
            console.log("No verification links found, attempting direct join.");
            joinUser([]);
        }
    };

    const handleModalSubmit = () => {
        if (!rewardDetail) return;
        const availableLinks = getVerificationLinks();

        // Ensure current index is valid for the available links
        if (currentVerificationIndex >= availableLinks.length) {
            console.error("Verification logic error: Index out of bounds.");
            setErrorMessage(
                "Internal error during verification. Please close and try again."
            );
            setShowErrorModal(true);
            setTimeout(() => setShowErrorModal(false), 5000);
            return;
        }

        const expectedLink = availableLinks[currentVerificationIndex];

        // Add basic validation for the input link format if desired (optional)
        // if (!verificationLink || !verificationLink.trim().startsWith("http")) { ... }

        // Case-insensitive comparison (recommended)
        if (
            verificationLink.trim().toLowerCase() !== expectedLink.toLowerCase()
        ) {
            setShowErrorModal(true);
            setErrorMessage(
                "Verification link does not match. Please try again."
            );
            // Keep modal open, keep link input
            setTimeout(() => setShowErrorModal(false), 10000); // Original timeout
            return; // Stop processing
        }

        // Link matched, add to verified list
        const newVerifiedLinks = [...verifiedLinks, verificationLink];
        setVerifiedLinks(newVerifiedLinks);

        // Check if more steps are needed
        if (currentVerificationIndex < availableLinks.length - 1) {
            const nextIndex = currentVerificationIndex + 1;
            setCurrentVerificationIndex(nextIndex);
            setVerificationLink(""); // Clear input for the next step
            const nextLink = availableLinks[nextIndex];
            if (nextLink) {
                window.open(nextLink, "_blank"); // Open next link using window.open
                // Keep modal open for next input
            }
        } else {
            // Last step completed, submit the join request
            joinUser(newVerifiedLinks);
        }
    };

    // --- RENDER LOGIC ---

    // Original Loading State (using isLoading flag now)
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                {/* This is the spinner div from your ORIGINAL code */}
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Handling error state AFTER loading (display message or fallback)
    // If rewardDetail is still null after loading, something went wrong.
    if (!rewardDetail && !isLoading) {
        // You can show a dedicated error UI or fallback to a simple message
        // Keeping the spinner might be confusing, better to show error
        return (
            <div className="bg-yellow-300 min-h-screen flex flex-col">
                <Header />
                <main className="flex-grow flex flex-col justify-center items-center p-4">
                    <p className="text-center text-red-600 font-bold text-lg bg-white p-4 rounded-lg shadow">
                        {errorMessage ||
                            "Error loading draw details. Please try again later."}
                    </p>
                    {/* Optional: Add a retry button */}
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 bg-blue-500 text-white p-2 rounded-lg"
                    >
                        Try Again
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    // If rewardDetail is somehow still null here (shouldn't happen with above checks), return null
    if (!rewardDetail) return null;

    // Determine total steps from available verification links.
    const availableVerificationLinks = getVerificationLinks();
    // NEW: Determine if event has ended based on accurate time
    const eventHasEnded =
        rewardDetail.end_date &&
        parseServerDateAsUTC(rewardDetail.end_date) &&
        getCurrentEstimatedUTCTime() >
            parseServerDateAsUTC(rewardDetail.end_date)!.getTime();

    // --- JSX Structure (Identical to your original DrawEvent) ---
    return (
        <div className="bg-yellow-300">
            <Header />
            <main className="bg-yellow-300 flex flex-col w-full min-h-screen p-4">
                {/* All img, h2, p, a, ul, li elements below are exactly as in your original code */}
                <img
                    src={rewardDetail.draw_image} // Assuming draw_image is always present after loading check
                    alt={rewardDetail.draw_name}
                    className="rounded-lg shadow-lg w-[90vw] max-h-[120px] mx-auto my-3 object-fill"
                    // Optional: Add onError handler for robustness if needed
                    // onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
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
                {/* Use target="_blank" for external links */}
                <a
                    href={rewardDetail.prize_detail_link || "#"} // Fallback href
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-red-500 border border-black p-2 rounded-lg"
                >
                    {/* Display fallback text if link is missing */}
                    {rewardDetail.prize_detail_link || "Link not available"}
                </a>
                <h2 className="text-center text-black font-bold">Prizes:</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-center text-black p-2 rounded-lg border border-black">
                    {rewardDetail.Prize_list.map((prize, index) => (
                        <li
                            key={index} // Using index as key (consider a unique prize ID if available)
                            className="flex justify-between items-center"
                        >
                            <div className="flex-1">{prize.no_win_prize}</div>
                            <div className="flex-1">{prize.no_of_prize}</div>
                            <div className="flex-1">{prize.prize}</div>
                        </li>
                    ))}
                    {/* Add a message if prize list is empty */}
                    {rewardDetail.Prize_list.length === 0 && (
                        <li className="col-span-full text-center text-gray-500">
                            No prize details available.
                        </li>
                    )}
                </ul>
                {/* Conditional rendering for Early Bird prizes (logic from original) */}
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
                                    key={`early-${index}`} // Unique key for early prizes
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
                {/* Using dangerouslySetInnerHTML as in original */}
                <p
                    className="text-center text-black border border-black p-2 rounded-lg min-h-10"
                    dangerouslySetInnerHTML={{
                        __html:
                            rewardDetail.draw_detail || "No details provided.", // Fallback text
                    }}
                />
                <h2 className="text-center text-black font-bold">
                    Draw to be performed on:
                </h2>
                {/* Date formatting as in original, ensure winner_declare_date is valid */}
                <p className="text-center text-black border border-black p-2 rounded-lg text-lg">
                    {rewardDetail.winner_declare_date
                        ? new Date(
                              rewardDetail.winner_declare_date
                          ).toLocaleDateString("en-IN", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                          })
                        : "Date not specified"}
                </p>

                {/* --- Conditional UI Blocks (Driven by updated state logic) --- */}

                {/* 'Already Joined' message */}
                {hasJoined && (
                    <div className="flex justify-center items-center my-3">
                        <p className="text-center text-green-700 font-bold bg-green-100 border border-green-300 p-2 rounded-lg">
                            ✅ You have already joined this event!
                        </p>
                    </div>
                )}

                {/* 'Join' button and 'Users Left' (Show only if NOT joined AND within date range) */}
                {!hasJoined && isWithinDateRange && (
                    <div className="flex flex-col items-center my-3">
                        {" "}
                        {/* Use flex-col to stack button and text */}
                        <button
                            onClick={handleJoinClick}
                            className="bg-green-600 p-2 rounded-lg text-white font-semibold"
                        >
                            {/* Adjust button text based on verification steps */}
                            {availableVerificationLinks.length > 0
                                ? `VIEW POST TO JOIN PROGRAM (${
                                      currentVerificationIndex + 1
                                  }/${availableVerificationLinks.length})`
                                : "VIEW POST TO JOIN PROGRAM"}
                        </button>
                        {/* 'Users Left' text, shown below button if applicable */}
                        {rewardDetail.join_user != null && ( // Check for null/undefined
                            <h3 className="text-black text-center mt-2">
                                {" "}
                                {/* Added margin-top */}
                                User Left to Join: {rewardDetail.join_user}
                            </h3>
                        )}
                    </div>
                )}

                {/* Countdown display (Show only if NOT joined AND NOT within date range AND countdown string exists) */}
                {!hasJoined && !isWithinDateRange && countdown && (
                    <h3 className="text-center text-black font-bold text-2xl mt-3">
                        {countdown}
                    </h3>
                )}

                {/* 'Event Ended' message (Show only if NOT joined AND NOT within range AND NO countdown AND eventHasEnded is true) */}
                {!hasJoined &&
                    !isWithinDateRange &&
                    !countdown &&
                    eventHasEnded && (
                        <div className="flex justify-center items-center my-3">
                            <p className="text-center text-red-700 font-bold bg-red-100 border border-red-300 p-2 rounded-lg">
                                ❌ This event has ended.
                            </p>
                        </div>
                    )}

                {/* Instructional text (Show only if NOT joined) */}
                {!hasJoined && (
                    <p className="text-center text-black text-sm p-4 rounded-lg">
                        {/* Text from original code */}
                        View Events Post Detail, Join Channel and Copy Events
                        Post Link. Come back and paste the link here to verify
                        your join.
                    </p>
                )}

                {/* Share Button (Using image path from your original code) */}
                <div
                    className="rounded-full w-12 h-12 bg-red-500 justify-center items-center flex mx-auto"
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        WebApp.showAlert(
                            "Event link has been copied successfully. Paste it to telegram to share it with your friends"
                        );
                    }}
                    // Add accessibility attributes
                    role="button"
                    tabIndex={0}
                    title="Copy event link"
                >
                    {/* Path from your DrawEvent */}
                    <img
                        className="w-6 h-6"
                        src="/bonus-monster/share.png"
                        alt="Share"
                    />
                </div>

                <Footer />

                {/* --- Modals (JSX structure identical to original) --- */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-yellow-300 p-6 rounded-lg flex flex-col items-center">
                            {/* Modal title includes step count */}
                            <h2 className="text-center text-black font-bold mb-4">
                                Please input the verification link (Step{" "}
                                {currentVerificationIndex + 1} of{" "}
                                {availableVerificationLinks.length || 1}):{" "}
                                {/* Added || 1 fallback */}
                            </h2>
                            <input
                                type="text" // Keep type="text" as original
                                value={verificationLink}
                                onChange={(e) =>
                                    setVerificationLink(e.target.value)
                                }
                                className="w-full p-2 bg-yellow-300 border-2 border-black rounded mb-4" // Classes from original
                                placeholder="Paste event post link here" // Add placeholder for usability
                            />
                            <img
                                src={rewardDetail.draw_image}
                                alt={rewardDetail.draw_name}
                                className="rounded mb-4" // Classes from original
                            />
                            {/* Added Cancel button for better UX, optional */}
                            <div className="flex w-full justify-center space-x-4">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-gray-500 p-2 px-8 rounded-lg text-white font-semibold" // Example styling, adjust if needed
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleModalSubmit}
                                    className="bg-green-600 p-2 px-10 rounded-lg text-white font-semibold" // Classes from original
                                    // Optionally disable if link is empty
                                    disabled={!verificationLink.trim()}
                                >
                                    Submit
                                </button>
                            </div>
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
                                className="rounded mb-4" // Classes from original
                            />
                        </div>
                    </div>
                )}

                {showErrorModal && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
                        <div className="bg-yellow-300 p-6 rounded-lg flex flex-col items-center">
                            <p className="text-center text-red-600 font-bold">
                                {errorMessage || "An error occurred."}{" "}
                                {/* Fallback error message */}
                            </p>
                            <img
                                src={rewardDetail.draw_image}
                                alt={rewardDetail.draw_name}
                                className="rounded mb-4" // Classes from original
                            />
                            {/* Add a close button to the error modal */}
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="bg-red-600 p-2 px-8 rounded-lg text-white font-semibold mt-2" // Example styling
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
