import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import React from "react";

const Header = React.memo(() => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useNavigate();
    const { i18n } = useTranslation();
    const { t } = useTranslation();
    
    // Move images to constants to prevent recreation on every render
    const logoImage = "/bonus-monster/bonus-logo.png";
    const privacyImage = "/bonus-monster/privacy.png";
    const languageImage = "/bonus-monster/hnkf.png";

    const handleToggleLanguage = useCallback(() => {
        const newLanguage = i18n.language === "en" ? "zh" : "en";
        i18n.changeLanguage(newLanguage);
    }, [i18n]);

    const handleNavigation = useCallback((path: string) => {
        setDropdownOpen(false);
        router(path);
    }, [router]);

    const handleDropdownToggle = useCallback(() => {
        setDropdownOpen(prev => !prev);
    }, []);

    const handleLogoClick = useCallback(() => {
        router("/");
    }, [router]);

    return (
        <header className="flex justify-between pt-3 pl-3 pr-2 bg-gray-700 pb-3  relative z-50">
            <img
                src={logoImage}
                alt="Bonus For You Logo"
                width={"32px"}
                height={"30px"}
                className="flex-shrink-0 mr-14"
                onClick={handleLogoClick}
            />
            <h1
                onClick={handleLogoClick}
                className="text-white text-2xl mr-8 cursor-pointer text-overflow-ellipsis whitespace-nowrap overflow-hidden"
            >
                {t("common.appName")}
            </h1>

            <div className="relative flex gap-2">
                <img
                    src={languageImage}
                    alt="Toggle Language"
                    width={"30px"}
                    height={"30px"}
                    onClick={handleToggleLanguage}
                    className="cursor-pointer"
                />
                <img
                    src={privacyImage}
                    alt="Privacy and More Options"
                    width={"30px"}
                    height={"30px"}
                    onClick={handleDropdownToggle}
                    className="cursor-pointer"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                />
                {dropdownOpen && (
                    <div
                        className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-[60]"
                        role="menu"
                        style={{ top: "100%", right: 0 }}
                    >
                        <ul>
                            <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                role="menuitem"
                                onClick={() => handleNavigation("/participated")}
                            >
                                Participated
                            </li>
                            <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                role="menuitem"
                                onClick={() => handleNavigation("/merchant")}
                            >
                                Merchant
                            </li>
                            <li
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                role="menuitem"
                                onClick={() => handleNavigation("/privacy")}
                            >
                                Privacy Policy
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </header>
    );
});

Header.displayName = 'Header';

export default Header;
