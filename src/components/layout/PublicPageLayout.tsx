
import PublicHeader from "./PublicHeader";
import Footer from "./Footer";

export default function PublicPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-dvh">
            <PublicHeader />
            <main className="flex-1 pt-16">
                <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}
