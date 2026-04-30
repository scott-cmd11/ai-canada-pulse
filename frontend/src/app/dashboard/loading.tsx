import Header from "@/components/Header"
import { SkeletonBar, SkeletonStoryFeed } from "@/components/Skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}>
      <Header />
      <main id="main-content" className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8 lg:py-5">
        <div className="space-y-3">
          <SkeletonBar width="12rem" height="14px" />
          <SkeletonBar width="min(42rem, 90vw)" height="56px" />
          <SkeletonBar width="min(30rem, 80vw)" height="18px" />
        </div>
        <section className="saas-card rounded-2xl p-5 sm:p-6">
          <SkeletonBar width="14rem" height="14px" />
          <div className="mt-5">
            <SkeletonStoryFeed count={4} />
          </div>
        </section>
      </main>
    </div>
  )
}
