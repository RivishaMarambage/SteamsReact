
import Footer from "./Footer";
import PublicHeader from "./PublicHeader";

export default function PublicPageLayout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <PublicHeader />
      <main className="flex-1 bg-background py-12">
        <div className="container mx-auto px-4 md:px-6 mt-16">
           <h1 className="text-4xl font-bold font-headline mb-8">{title}</h1>
           {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}