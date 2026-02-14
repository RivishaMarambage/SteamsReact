'use client';

import { MessageCircle, ShoppingCart, ArrowUp } from "lucide-react";

export default function MenuFloatingButtons() {
    return (
        <>
            <div className="fixed bottom-6 left-6 z-50">
                <button className="bg-[#25D366] text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform duration-300">
                    <MessageCircle className="w-8 h-8 fill-current" />
                </button>
            </div>

            <div className="fixed bottom-28 left-6 z-50 flex flex-col gap-4">

                <button
                    className="bg-[#e67e22] text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform duration-300"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <ArrowUp className="w-6 h-6" />
                </button>
            </div>
        </>
    );
}
