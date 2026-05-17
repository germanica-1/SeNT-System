import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";

export default function SplashScreen() {
    const navigate = useNavigate();
    const { user, loading } = useAuth();

    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (loading) return;

            // start fade-out first
            setExiting(true);

            // wait for fade-out animation before navigating
            setTimeout(() => {
                if (user) {
                    navigate("/dashboard", { replace: true });
                } else {
                    navigate("/login", { replace: true });
                }
            }, 700); // fade duration

        }, 3500);

        return () => clearTimeout(timer);
    }, [user, loading, navigate]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFE500]"
            initial={{ opacity: 1 }}
            animate={{ opacity: exiting ? 0 : 1 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
        >
            <motion.div
                className="flex flex-col items-center gap-8 px-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 1.2,
                    ease: [0.43, 0.13, 0.23, 0.96],
                    delay: 0.2,
                }}
            >
                {/* Logo */}
                <motion.div
                    className="relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 1.4,
                        ease: [0.34, 1.56, 0.64, 1],
                        delay: 0.4,
                    }}
                >
                    <motion.img
                        src="/splash.png"
                        alt="Logo"
                        className="w-64 md:w-80 lg:w-96 h-auto drop-shadow-2xl"
                        initial={{ filter: "blur(10px)" }}
                        animate={{ filter: "blur(0px)" }}
                        transition={{
                            duration: 1,
                            ease: [0.43, 0.13, 0.23, 0.96],
                            delay: 0.6,
                        }}
                    />

                    <motion.div
                        className="absolute inset-0 bg-white/30 rounded-3xl blur-3xl -z-10"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 0.4 }}
                        transition={{
                            duration: 1.5,
                            ease: "easeOut",
                            delay: 0.8,
                        }}
                    />
                </motion.div>

                {/* Text */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.8,
                        delay: 1.2,
                    }}
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-[#0066CC]">
                        STI College
                    </h1>
                    <p className="text-xl md:text-2xl text-[#0066CC]/80 mt-2">
                        Muñoz-EDSA
                    </p>
                </motion.div>

                {/* Loader */}
                <motion.div
                    className="flex gap-2 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full bg-[#0066CC]"
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </motion.div>
    );
}