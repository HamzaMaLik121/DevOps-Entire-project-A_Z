import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Navbar } from '@/components/Navbar'
import { Home, Products, ProductDetail, Cart, Checkout, Confirmation, Orders, Auth, Profile } from '@/pages'
import './index.css'

function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-10">
      <div className="mx-auto max-w-7xl px-6 text-center text-neutral-500">
        <p className="font-black tracking-tighter text-neutral-200">AnimeThreads</p>
        <p className="mt-2 text-sm">Original anime-inspired streetwear. Built for fans, by fans.</p>
      </div>
    </footer>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-right" richColors />
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
  </React.StrictMode>
)
