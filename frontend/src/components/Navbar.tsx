import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X, User as UserIcon } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useState } from 'react'

const links = [
  { to: '/products', label: 'Shop' },
  { to: '/orders', label: 'Orders' },
]

export function Navbar() {
  const user = useStore((state) => state.user)
  const cart = useStore((state) => state.cart)
  const logout = useStore((state) => state.logout)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <nav className="sticky top-0 z-40 border-b border-ink-700/80 bg-ink-950/85 backdrop-blur-md">
      {/* announcement strip */}
      <div className="border-b border-ink-800/80 bg-aka-dark/20">
        <p className="mx-auto max-w-7xl px-6 py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.25em] text-kin-light/90">
          武士道 — Free shipping on all scrolls · New Bushido drop live
        </p>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-aka-deep font-mincho text-lg font-black text-white shadow-lg shadow-aka-dark/50 transition group-hover:shadow-aka/40">
            侍
          </span>
          <span className="font-mincho text-xl font-black tracking-tight text-stone-50">
            Anime<span className="text-kin">Threads</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-semibold text-stone-300 transition hover:text-kin-light"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-sm font-semibold text-stone-300 transition hover:text-kin-light"
              >
                <UserIcon className="h-4 w-4" />
                {user.name || 'Profile'}
              </Link>
              <button
                onClick={() => {
                  logout()
                  navigate('/')
                }}
                className="text-sm font-semibold text-stone-400 transition hover:text-aka-bright"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="text-sm font-semibold text-stone-300 transition hover:text-kin-light"
            >
              Login
            </Link>
          )}
          <Link to="/cart" className="relative rounded-lg p-1 transition hover:bg-ink-800">
            <ShoppingBag className="h-6 w-6 text-stone-200" />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-aka text-[11px] font-black text-white shadow shadow-aka-dark/60">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        <button className="rounded-lg p-1.5 hover:bg-ink-800 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-ink-800 bg-ink-950 px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="text-stone-300">
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-stone-300">
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout()
                    navigate('/')
                    setMobileOpen(false)
                  }}
                  className="text-left text-stone-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-stone-300">
                Login
              </Link>
            )}
            <Link to="/cart" onClick={() => setMobileOpen(false)} className="text-stone-300">
              Cart ({cartCount})
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
