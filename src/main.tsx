import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App"; // Ensure the path is correct
import WebApp from "@twa-dev/sdk";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from './context/UserContext'; // Ensure the path is correct
import {
    Profile,
    Privacy,
    Participated,
    Merchant,
    DrawEvent,
    RewardEvent,
    AvailableEvents,
    OngoingEvents,
    ParticipatedEvents,
    PrizeIWon,
    ParticipatedDrawEvent,
    ParticipatedRewardEvent,
    PrizeIWonDraw,
    PrizeIWonReward
} from "./pages/index"; // Ensure the path is correct
import './i18n'; // Import the i18n configuration

const Root = () => {
    useEffect(() => {
        WebApp.ready();
    }, []);

    return (
    
        <BrowserRouter basename="/bonus-monster">

            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/available-rewards" element={<AvailableEvents />} />
                <Route path="/ongoing-rewards" element={<OngoingEvents />} />
                <Route path="/participated-rewards" element={<ParticipatedEvents />} />
                <Route path="/prize-i-won" element={<PrizeIWon />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/participated" element={<Participated />} />
                <Route path="/merchant" element={<Merchant />} />
                <Route path="/draw-event/:id" element={<DrawEvent />} />
                <Route path="/reward-event/:id" element={<RewardEvent />} />
                <Route path="/participated-draw-event/:id" element={<ParticipatedDrawEvent />} />
                <Route path="/participated-reward-event/:id" element={<ParticipatedRewardEvent />} />
                <Route path="/prize-i-won-draw/:id" element={<PrizeIWonDraw />} />
                <Route path="/prize-i-won-reward/:id" element={<PrizeIWonReward />} />
            </Routes>
        </BrowserRouter>
    );
};

createRoot(document.getElementById("root")!).render(
    <UserProvider>
        <Root />
    </UserProvider>
);
