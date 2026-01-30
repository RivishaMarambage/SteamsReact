'use client';

import PublicPageLayout from "@/components/layout/PublicPageLayout";
import UpdatesTimeline from "@/components/updates/UpdatesTimeline";

export default function UpdatesPage() {
  // We pass an empty title or handle the layout such that the timeline's internal header takes precedence visually, 
  // or we could refactor PublicPageLayout. For now, let's just render the timeline.
  // Actually, PublicPageLayout renders a container with top padding. 
  // UpdatesTimeline is full-screen immersive. 

  // Let's modify this page to NOT use PublicPageLayout's standard container for the 'hero' part, 
  // but we still want the Header and Footer.
  // However, UpdatesTimeline includes its own 'immersive' feel. 
  // Let's use PublicPageLayout but maybe we need a 'fullWidth' prop or just use Header/Footer directly here.

  // Looking at PublicPageLayout.tsx:
  // it has <main className="flex-1 bg-background py-12"><div className="container...">{children}</div></main>
  // This will constrain our beautiful full-width timeline.

  // Better approach: Use Header and Footer directly here for full control, like the landing page.

  return (
    <div className="flex flex-col min-h-dvh bg-[#1a110a]">
      {/* We need the header. We can import PublicHeader. */}
      {/* But wait, I can just import PublicHeader and Footer directly. */}
      <UpdatesLayoutWrapper />
    </div>
  );
}

import PublicHeader from "@/components/layout/PublicHeader";
import Footer from "@/components/layout/Footer";

function UpdatesLayoutWrapper() {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        <UpdatesTimeline />
      </main>
      <Footer />
    </>
  )
}
