import React, { createContext, useState, ReactNode, useEffect } from "react";

interface UserData {
    id: number | null;
    name: string;
    telegramId: string;
    country: string;
    uniqueId: string;
}

interface UserContextType {
    user: UserData;
    setUser: (user: UserData) => void;
    isLoggedIn: boolean;
    setIsLoggedIn: (isLoggedIn: boolean) => void;
    hasAttemptedLogin: boolean;
    setHasAttemptedLogin: (attempted: boolean) => void;
}

const defaultUser: UserData = {
    id: null,
    name: "",
    telegramId: "",
    country: "",
    uniqueId: "",
};

const defaultContext: UserContextType = {
    user: defaultUser,
    setUser: () => {},
    isLoggedIn: false,
    setIsLoggedIn: () => {},
    hasAttemptedLogin: false,
    setHasAttemptedLogin: () => {},
};

export const UserContext = createContext<UserContextType>(defaultContext);

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserData>(() => {
        // Initialize from sessionStorage if available
        const savedUser = sessionStorage.getItem("bonusMonsterUser");
        return savedUser ? JSON.parse(savedUser) : defaultUser;
    });

    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
        // Initialize from sessionStorage if available
        const savedLoginState = sessionStorage.getItem("bonusMonsterLoggedIn");
        return savedLoginState === "true";
    });

    const [hasAttemptedLogin, setHasAttemptedLogin] = useState<boolean>(() => {
        // Check if we've already attempted login in this session
        const attempted = sessionStorage.getItem("bonusMonsterLoginAttempted");
        return attempted === "true";
    });

    // Save user data to sessionStorage whenever it changes
    useEffect(() => {
        if (user.id !== null) {
            sessionStorage.setItem("bonusMonsterUser", JSON.stringify(user));
        }
    }, [user]);

    // Save login state to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem("bonusMonsterLoggedIn", isLoggedIn.toString());
    }, [isLoggedIn]);

    // Save login attempt state to sessionStorage
    useEffect(() => {
        sessionStorage.setItem(
            "bonusMonsterLoginAttempted",
            hasAttemptedLogin.toString()
        );
    }, [hasAttemptedLogin]);

    return (
        <UserContext.Provider
            value={{
                user,
                setUser,
                isLoggedIn,
                setIsLoggedIn,
                hasAttemptedLogin,
                setHasAttemptedLogin,
            }}
        >
            {children}
        </UserContext.Provider>
    );
};
