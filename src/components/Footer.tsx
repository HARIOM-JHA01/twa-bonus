import { useEffect } from "react";

// type AdvertiseBanner = {
//     id: number;
//     image: string;
//     link: string;
//     status: string;
//     start_date: string;
//     end_date: string;
//     created_at: string;
//     updated_at: string;
// };

const Footer = () => {
    // const [randomBanner, setRandomBanner] = useState<AdvertiseBanner | null>(
    //     null
    // );

    useEffect(() => {
        // COMMENTED OUT: Advertisement banner fetching
        /*
        fetch("https://bonusforyou.org/api/advertiseBanner")
            .then((res) => res.json())
            .then((data) => {
                if (data.status && data.data.length > 0) {
                    const randomIndex = Math.floor(
                        Math.random() * data.data.length
                    );
                    setRandomBanner(data.data[randomIndex]);
                }
            })
            .catch((error) =>
                console.error("Error fetching advertise banners:", error)
            );
        */
    }, []);

    return (
        <section className="flex flex-col gap-4 items-center pb-5">
            {/* COMMENTED OUT: Advertisement banner display */}
            {/*
            {randomBanner && (
                <a
                    href={randomBanner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img
                        src={randomBanner.image}
                        alt={`Advertisement ${randomBanner.id}`}
                        className="rounded-lg shadow-lg w-[90vw] h-[120px] mx-auto"
                    />
                </a>
            )}
            */}
        </section>
    );
};

export default Footer;
