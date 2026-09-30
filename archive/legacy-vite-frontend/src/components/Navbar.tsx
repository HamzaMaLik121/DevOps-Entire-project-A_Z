import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useState } from 'react'

export function Navbar() {
  const user = useStore((state) => state.user)
  const cart = useStore((state) => state.cart)
  const logout = useStore((state) => state.logout)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-black tracking-tighter text-gradient">
          AnimeThreads
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link to="/products" className="text-sm font-medium text-neutral-300 hover:text-white transition">Shop</Link>
          <Link to="/orders" className="text-sm font-medium text-neutral-300 hover:text-white transition">Orders</Link>
          {user ? (
            <>
              <Link to="/profile" className="text-sm font-medium text-neutral-300 hover:text-white transition">Profile</Link>
              <button onClick={() => { logout(); navigate('/') }} className="text-sm font-medium text-neutral-300 hover:text-white transition">Logout</button>
            </>
          ) : (
            <Link to="/auth" className="text-sm font-medium text-neutral-300 hover:text-white transition">Login</Link>
          )}
          <Link to="/cart" className="relative">
            <ShoppingBag className="h-6 w-6 text-neutral-200" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-800 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/products" onClick={() => setMobileOpen(false)} className="text-neutral-300">Shop</Link>
            <Link to="/orders" onClick={() => setMobileOpen(false)} className="text-neutral-300">Orders</Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-neutral-300">Profile</Link>
                <button onClick={() => { logout(); navigate('/'); setMobileOpen(false) }} className="text-left text-neutral-300">Logout</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-neutral-300">Login</Link>
            )}
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-neutral-300">Cart ({cartCount})</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
