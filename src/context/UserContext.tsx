import React, { createContext, useState, ReactNode } from "react";

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
};

export const UserContext = createContext<UserContextType>(defaultContext);

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<UserData>(defaultUser);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    return (
        <UserContext.Provider
            value={{ user, setUser, isLoggedIn, setIsLoggedIn }}
        >
            {children}
        </UserContext.Provider>
    );
};
