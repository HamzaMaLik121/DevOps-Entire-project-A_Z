'use client'

import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/Navbar'
import {
  Home,
  Products,
  ProductDetail,
  Cart,
  Checkout,
  Confirmation,
  Orders,
  Auth,
  Profile
} from '@/client-pages'
import { useStore } from '@/lib/store'

function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-700/80 bg-ink-900/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-aka-deep font-mincho text-base font-black text-white">
              侍
            </span>
            <span className="font-mincho text-lg font-black text-stone-50">
              Anime<span className="text-kin">Threads</span>
            </span>
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-400">
            Bushido-inspired streetwear for those who live by the code. Built for fans, by fans.
          </p>
        </div>
        <div className="text-sm text-stone-400">
          <p className="font-black uppercase tracking-widest text-stone-200">Shop</p>
          <ul className="mt-4 space-y-2">
            <li><Link to="/products" className="transition hover:text-kin-light">All Drops</Link></li>
            <li><Link to="/products?category=T-Shirts" className="transition hover:text-kin-light">T-Shirts</Link></li>
            <li><Link to="/products?category=Hoodies" className="transition hover:text-kin-light">Hoodies</Link></li>
            <li><Link to="/orders" className="transition hover:text-kin-light">Order History</Link></li>
          </ul>
        </div>
        <div className="text-sm text-stone-400">
          <p className="font-black uppercase tracking-widest text-stone-200">The Code</p>
          <ul className="mt-4 space-y-2 font-mincho text-kin-light/80">
            <li>義 — Righteousness</li>
            <li>勇 — Courage</li>
            <li>仁 — Compassion</li>
            <li>礼 — Respect</li>
            <li>誠 — Honesty</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800 py-5 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} AnimeThreads. All rights reserved.
      </div>
    </footer>
  )
}

export function ClientApp() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Rehydrate the Zustand persisted store on the client.
    void useStore.persist.rehydrate()
  }, [])

  if (!mounted) {
    return <div className="min-h-screen bg-ink-950" />
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: '#1A1816',
            border: '1px solid #443F39',
            color: '#F5F5F4',
          },
        }}
      />
      <Navbar />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}
