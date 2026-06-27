import { Outlet } from 'react-router-dom'
import { Navigation } from '@/sections/Navigation'
import { Footer } from '@/sections/Footer'

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col font-sans antialiased text-foreground bg-background dark">
      <Navigation />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}