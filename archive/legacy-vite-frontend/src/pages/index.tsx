import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package, CreditCard, User, LogOut } from 'lucide-react'
import api from '@/lib/api'
import { useStore, useCartTotal } from '@/lib/store'
import { Button, Card, Input } from '@/components/ui'

interface Product {
  id: number
  name: string
  description: string
  price: number
  category: string
  imageUrl: string
  sku: string
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`
}

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-600/30 border-t-violet-500" />
    </div>
  )
}

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/products?limit=4')
      .then((res) => {
        console.log('Featured products loaded:', res.data)
        setFeatured(res.data.items)
      })
      .catch((err) => {
        console.error('Featured products API error:', err)
        toast.error('Could not load featured products')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-900 via-neutral-900 to-neutral-950 px-8 py-20 md:px-16">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            Wear your <span className="text-gradient">anime energy</span>.
          </h1>
          <p className="mt-6 text-lg text-neutral-300">
            Original streetwear inspired by shonen battles, samurai legends and dark fantasy worlds.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/products">
              <Button>Shop Now</Button>
            </Link>
            <Link to="/products?category=Hoodies">
              <Button variant="secondary">Hoodies</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-8 text-2xl font-bold">Featured Drops</h2>
        {loading ? (
          <Loading />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const addToCart = useStore((state) => state.addToCart)
  return (
    <Card className="group flex flex-col overflow-hidden p-0 transition hover:-translate-y-1 hover:border-violet-500/40">
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-neutral-900">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-bold uppercase tracking-wider text-violet-400">{product.category}</span>
        <Link to={`/products/${product.id}`}>
          <h3 className="mt-2 text-lg font-bold leading-tight group-hover:text-violet-400 transition">{product.name}</h3>
        </Link>
        <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xl font-black">{formatPrice(product.price)}</span>
          <Button
            onClick={() => {
              addToCart({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl })
              toast.success(`${product.name} added to cart`)
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function Products() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const category = params.get('category') || ''
  const search = params.get('search') || ''

  useEffect(() => {
    api
      .get('/products/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Failed to load categories:', err))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get('/products', { params: { category, search } })
      .then((res) => {
        console.log('Products loaded:', res.data)
        setProducts(res.data.items)
      })
      .catch((err) => {
        console.error('Products API error:', err)
        const msg = err.response?.data?.error || err.message || 'Unknown error'
        setError(`Could not load products: ${msg}`)
        toast.error('Could not load products')
      })
      .finally(() => setLoading(false))
  }, [category, search])

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-black md:text-4xl">All Drops</h1>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setParams({ category, search: e.target.value })}
            placeholder="Search products..."
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setParams({})}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${!category ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setParams({ category: c })}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${category === c ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          <p className="font-semibold">Unable to load products</p>
          <p className="text-sm">{error}</p>
          <p className="mt-2 text-xs text-neutral-400">
            API base URL: {import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8000 (fallback)'}
          </p>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : products.length === 0 && !error ? (
        <div className="mt-12 text-center text-neutral-400">No products found.</div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const addToCart = useStore((state) => state.addToCart)

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => toast.error('Could not load product'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Loading />
  if (!product) return <div className="p-12 text-center">Product not found.</div>

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <span className="text-sm font-bold uppercase tracking-widest text-violet-400">{product.category}</span>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">{product.name}</h1>
          <p className="mt-6 text-lg leading-relaxed text-neutral-300">{product.description}</p>
          <div className="mt-8 text-3xl font-black">{formatPrice(product.price)}</div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-neutral-700 bg-neutral-900">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 text-neutral-300 hover:text-white">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-4 py-3 text-neutral-300 hover:text-white">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={() => {
                addToCart({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: qty })
                toast.success(`${product.name} added to cart`)
              }}
              className="flex-1"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Cart() {
  const cart = useStore((state) => state.cart)
  const updateQuantity = useStore((state) => state.updateQuantity)
  const removeFromCart = useStore((state) => state.removeFromCart)
  const total = useCartTotal()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-neutral-600" />
        <h2 className="mt-6 text-2xl font-bold">Your cart is empty</h2>
        <p className="mt-2 text-neutral-400">Discover something legendary in the shop.</p>
        <Link to="/products" className="mt-6">
          <Button>Shop Now</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-black">Your Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.productId} className="flex gap-4">
              <img src={item.imageUrl} alt={item.name} className="h-24 w-24 rounded-lg object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-sm text-neutral-400">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-md border border-neutral-700">
                    <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} className="px-3 py-1 hover:text-violet-400">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1 hover:text-violet-400">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="text-neutral-400 hover:text-rose-500">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="self-end font-bold">{formatPrice(item.price * item.quantity)}</div>
            </Card>
          ))}
        </div>
        <div>
          <Card>
            <h2 className="text-xl font-bold">Order Summary</h2>
            <div className="mt-4 flex justify-between text-neutral-300">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="mt-2 flex justify-between text-neutral-300">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-neutral-700 pt-4 text-xl font-black">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Button onClick={() => navigate('/checkout')} className="mt-6 w-full">
              Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function Checkout() {
  const user = useStore((state) => state.user)
  const cart = useStore((state) => state.cart)
  const clearCart = useStore((state) => state.clearCart)
  const total = useCartTotal()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [address, setAddress] = useState({ street: '', city: '', zip: '', country: 'US' })
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' })

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="text-2xl font-bold">Please log in to checkout</h2>
        <p className="mt-2 text-neutral-400">Your cart is waiting.</p>
        <Button onClick={() => navigate('/auth')} className="mt-6">Login or Signup</Button>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <Button onClick={() => navigate('/products')} className="mt-6">Continue Shopping</Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.street || !card.number) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const orderRes = await api.post('/orders', { items: cart, total })
      const orderId = orderRes.data.id
      await api.post('/payments/process', { orderId, paymentMethod: 'mock-card', amount: total })
      clearCart()
      navigate(`/confirmation?orderId=${orderId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Checkout failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-3xl font-black">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="mb-4 text-lg font-bold">Shipping Address</h2>
            <Input placeholder="Street" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <Input placeholder="ZIP" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
              <Input placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            </div>
          </Card>
          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><CreditCard className="h-5 w-5" /> Mock Payment</h2>
            <Input placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
              <Input placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
            </div>
          </Card>
          <Button loading={loading} className="w-full" type="submit">Place Order</Button>
        </form>
        <Card className="h-fit">
          <h2 className="text-lg font-bold">In Your Cart</h2>
          <div className="mt-4 space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-neutral-300">{item.name} x{item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-neutral-700 pt-4 text-xl font-black">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

export function Confirmation() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-600/20 text-violet-400">
        <Package className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-3xl font-black md:text-4xl">Order Confirmed</h1>
      <p className="mt-4 text-neutral-300">
        Thank you for your order{orderId ? ` #${orderId}` : ''}. Your anime streetwear is being prepared.
      </p>
      <div className="mt-8 flex gap-4">
        <Link to="/orders">
          <Button variant="secondary">View Orders</Button>
        </Link>
        <Link to="/products">
          <Button>Keep Shopping</Button>
        </Link>
      </div>
    </div>
  )
}

export function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = useStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    api
      .get('/orders')
      .then((res) => setOrders(res.data))
      .catch(() => toast.error('Could not load orders'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="text-2xl font-bold">Please log in</h2>
        <Button onClick={() => navigate('/auth')} className="mt-6">Login</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-black">Order History</h1>
      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <p className="mt-8 text-neutral-400">No orders yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-neutral-400">Order #{order.id}</p>
                  <p className="text-lg font-bold">{formatPrice(order.total)}</p>
                </div>
                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs font-bold uppercase text-neutral-300">
                  {order.status}
                </span>
              </div>
              <div className="mt-4 space-y-1 border-t border-neutral-800 pt-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm text-neutral-300">
                    <span>{item.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function Auth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const setUser = useStore((state) => state.setUser)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/signup'
      const payload = mode === 'login' ? { email, password } : { email, password, name }
      const res = await api.post(url, payload)
      setUser(res.data.user)
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card>
        <h1 className="text-2xl font-black">{mode === 'login' ? 'Welcome Back' : 'Join AnimeThreads'}</h1>
        <p className="mt-2 text-neutral-400">
          {mode === 'login' ? 'Sign in to continue.' : 'Create an account to start collecting.'}
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button loading={loading} className="w-full" type="submit">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-400">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="font-bold text-violet-400 hover:underline">
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </Card>
    </div>
  )
}

export function Profile() {
  const user = useStore((state) => state.user)
  const logout = useStore((state) => state.logout)
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="text-2xl font-bold">Please log in</h2>
        <Button onClick={() => navigate('/auth')} className="mt-6">Login</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-600/20 text-violet-400">
          <User className="h-10 w-10" />
        </div>
        <h1 className="mt-4 text-2xl font-black">{user.name || 'Collector'}</h1>
        <p className="text-neutral-400">{user.email}</p>
        <Button
          variant="secondary"
          onClick={() => {
            logout()
            navigate('/')
            toast.success('Logged out')
          }}
          className="mt-6 w-full"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </Card>
    </div>
  )
}
