
export default function PublicPageLayout({ children, title }: { children: React.ReactNode, title: string }) {
  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
        <h1 className="text-4xl font-bold mb-8">{title}</h1>
        {children}
    </div>
  );
}
