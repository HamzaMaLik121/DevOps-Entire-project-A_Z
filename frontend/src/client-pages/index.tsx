import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Search, ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package, CreditCard,
  User, LogOut, Shield, Swords, Sparkles, Truck, Check,
} from 'lucide-react'
import api from '@/lib/api'
import { useStore, useCartTotal } from '@/lib/store'
import { Button, Card, Input, Badge, SectionHeading } from '@/components/ui'

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
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-aka-dark/40 border-t-aka-bright" />
    </div>
  )
}

/* ---------------------------------- Home ---------------------------------- */

const BUSHIDO_VALUES = [
  { kanji: '義', name: 'Righteousness', desc: 'Decide with a clear conscience.' },
  { kanji: '勇', name: 'Courage', desc: 'Wear what you believe in.' },
  { kanji: '仁', name: 'Compassion', desc: 'Crafted with care for all.' },
  { kanji: '礼', name: 'Respect', desc: 'Honor in every stitch.' },
  { kanji: '誠', name: 'Honesty', desc: 'No fakes. Ever.' },
]

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/products?limit=4')
      .then((res) => setFeatured(res.data.items))
      .catch(() => toast.error('Could not load featured products'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="sun-disc absolute -right-40 -top-40 h-[34rem] w-[34rem] rounded-full" />
        <span className="kanji-watermark right-4 top-8 hidden text-[22rem] leading-none md:block">侍</span>

        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 md:pb-28 md:pt-32">
          <div className="max-w-3xl animate-fade-up">
            <Badge>新 drop · Bushido Collection</Badge>
            <h1 className="mt-6 font-mincho text-5xl font-black leading-[1.05] text-stone-50 md:text-7xl">
              Forge your <span className="text-gradient">legend</span>.
              <br />
              Wear the <span className="text-gradient-red">way</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone-400">
              Premium anime streetwear cut with the spirit of the samurai — shonen battles,
              dark fantasy and the warrior's code, printed on heavyweight cotton.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg">
                  Enter the Shop <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products?category=T-Shirts">
                <Button size="lg" variant="secondary">
                  Browse Tees
                </Button>
              </Link>
            </div>
          </div>

          {/* trust strip */}
          <div className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-ink-700/80 pt-8 text-sm text-stone-400">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-kin" /> Free shipping</span>
            <span className="flex items-center gap-2"><Shield className="h-4 w-4 text-kin" /> 30-day returns</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-kin" /> Fan-made designs</span>
          </div>
        </div>

        {/* kanji marquee */}
        <div className="overflow-hidden border-y border-ink-800 bg-ink-900/60 py-3">
          <div className="flex w-max animate-marquee gap-12 whitespace-nowrap font-mincho text-sm tracking-[0.4em] text-kin/70">
            {Array.from({ length: 2 }).map((_, half) => (
              <span key={half} className="flex gap-12">
                {['武士道 THE WAY OF THE WARRIOR', '侍 SAMURAI SPIRIT', '武 BUSHIDO DROP 001', '誠 HONESTY IN EVERY STITCH', '刃 WEAR THE BLADE'].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- Featured ------------------------------ */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between">
          <SectionHeading kicker="精選 · Curated" title="Featured Drops" />
          <Link to="/products" className="group flex items-center gap-1 text-sm font-bold text-kin-light hover:text-kin">
            View all <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------------------- Values -------------------------------- */}
      <section className="border-y border-ink-800 bg-ink-900/40">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeading kicker="武士道 · The Code" title="Five Virtues, One Wardrobe" className="text-center" />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {BUSHIDO_VALUES.map((v) => (
              <div key={v.kanji} className="group text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-kin/25 bg-ink-850 font-mincho text-4xl font-black text-kin-light shadow-lg shadow-black/40 transition group-hover:border-kin/60 group-hover:shadow-kin/10">
                  {v.kanji}
                </div>
                <h3 className="mt-4 font-bold text-stone-100">{v.name}</h3>
                <p className="mt-1 text-sm text-stone-400">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------ ProductCard -------------------------------- */

function ProductCard({ product }: { product: Product }) {
  const addToCart = useStore((state) => state.addToCart)
  return (
    <Card className="group flex flex-col overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-kin/40 hover:shadow-2xl">
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-ink-850">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3">
          <Badge>{product.category}</Badge>
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-mincho text-lg font-bold leading-snug text-stone-50 transition group-hover:text-kin-light">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1.5 line-clamp-2 text-sm text-stone-400">{product.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-xl font-black text-stone-50">{formatPrice(product.price)}</span>
          <Button
            size="sm"
            variant="gold"
            onClick={() => {
              addToCart({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl })
              toast.success(`${product.name} added to cart`)
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------- Products --------------------------------- */

export function Products() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState(params.get('search') || '')
  const category = params.get('category') || ''

  useEffect(() => {
    api
      .get('/products/categories')
      .then((res) => setCategories(res.data))
      .catch(() => {})
  }, [])

  // Debounced search -> URL params
  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams()
      if (category) next.set('category', category)
      if (searchInput.trim()) next.set('search', searchInput.trim())
      setParams(next)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api
      .get('/products', { params: { category: params.get('category') || '', search: params.get('search') || '' } })
      .then((res) => setProducts(res.data.items))
      .catch((err) => {
        const msg = err.response?.data?.error || err.message || 'Unknown error'
        setError(`Could not load products: ${msg}`)
      })
      .finally(() => setLoading(false))
  }, [params])

  const setCategory = (c: string) => {
    const next = new URLSearchParams()
    if (c) next.set('category', c)
    if (searchInput.trim()) next.set('search', searchInput.trim())
    setParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <SectionHeading kicker="全製品 · Collection" title="All Drops" />

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search the armory..."
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition ${
              !category ? 'bg-aka-deep text-white shadow-lg shadow-aka-dark/40' : 'bg-ink-800 text-stone-300 hover:bg-ink-700 hover:text-kin-light'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider transition ${
                category === c ? 'bg-aka-deep text-white shadow-lg shadow-aka-dark/40' : 'bg-ink-800 text-stone-300 hover:bg-ink-700 hover:text-kin-light'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          <p className="font-bold">Unable to load products</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : products.length === 0 && !error ? (
        <div className="mt-16 text-center">
          <Swords className="mx-auto h-12 w-12 text-ink-600" />
          <p className="mt-4 text-stone-400">No artifacts found. Adjust your search.</p>
        </div>
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

/* ------------------------------ ProductDetail ------------------------------ */

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
  if (!product) return <div className="p-12 text-center text-stone-400">This artifact does not exist.</div>

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-10 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-850 shadow-2xl">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          <span className="absolute left-4 top-4">
            <Badge>{product.category}</Badge>
          </span>
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="font-mincho text-4xl font-black leading-tight text-stone-50 md:text-5xl">{product.name}</h1>
          <p className="mt-6 text-lg leading-relaxed text-stone-300">{product.description}</p>

          <div className="mt-8 flex items-baseline gap-3">
            <span className="text-4xl font-black text-kin-light">{formatPrice(product.price)}</span>
            <span className="text-sm text-stone-500">SKU {product.sku}</span>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-ink-600 bg-ink-850">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-3 text-stone-300 transition hover:text-kin-light">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-black">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-4 py-3 text-stone-300 transition hover:text-kin-light">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                addToCart({ productId: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, quantity: qty })
                toast.success(`${product.name} added to cart`)
              }}
            >
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </Button>
          </div>

          <ul className="mt-10 space-y-3 border-t border-ink-700 pt-6 text-sm text-stone-400">
            <li className="flex items-center gap-3"><Check className="h-4 w-4 text-kin" /> Heavyweight 240 GSM cotton — built to last</li>
            <li className="flex items-center gap-3"><Check className="h-4 w-4 text-kin" /> High-density print, machine washable</li>
            <li className="flex items-center gap-3"><Check className="h-4 w-4 text-kin" /> Ships within 48h · free over $50</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- Cart ----------------------------------- */

export function Cart() {
  const cart = useStore((state) => state.cart)
  const updateQuantity = useStore((state) => state.updateQuantity)
  const removeFromCart = useStore((state) => state.removeFromCart)
  const total = useCartTotal()
  const navigate = useNavigate()

  if (cart.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-28 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-ink-600 bg-ink-850">
          <ShoppingBag className="h-10 w-10 text-stone-500" />
        </div>
        <h2 className="mt-6 font-mincho text-3xl font-black text-stone-100">Your quiver is empty</h2>
        <p className="mt-2 text-stone-400">Discover something legendary in the shop.</p>
        <Link to="/products" className="mt-8">
          <Button size="lg">Shop the Drop <ArrowRight className="h-4 w-4" /></Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <SectionHeading kicker="買い物 · Cart" title="Your Arsenal" />
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cart.map((item) => (
            <Card key={item.productId} className="flex gap-4 p-4">
              <img src={item.imageUrl} alt={item.name} className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-stone-100">{item.name}</h3>
                  <p className="text-sm text-stone-400">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-md border border-ink-600">
                    <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} className="px-3 py-1 text-stone-300 hover:text-kin-light">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-3 py-1 text-stone-300 hover:text-kin-light">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="text-stone-500 transition hover:text-aka-bright">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="self-end font-black text-stone-50">{formatPrice(item.price * item.quantity)}</div>
            </Card>
          ))}
        </div>

        <div>
          <Card className="h-fit p-6">
            <h2 className="font-mincho text-xl font-black text-stone-50">Order Summary</h2>
            <div className="mt-5 space-y-2 text-stone-300">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span className="text-kin-light">Free</span></div>
            </div>
            <div className="mt-5 flex justify-between border-t border-ink-700 pt-5 text-xl font-black text-stone-50">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <Button onClick={() => navigate('/checkout')} size="lg" className="mt-6 w-full">
              Proceed to Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------- Checkout ---------------------------------- */

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
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <Shield className="mx-auto h-12 w-12 text-kin" />
        <h2 className="mt-6 font-mincho text-3xl font-black text-stone-100">Identify yourself, warrior</h2>
        <p className="mt-2 text-stone-400">Log in to complete your checkout. Your cart is safe.</p>
        <Button onClick={() => navigate('/auth')} size="lg" className="mt-8">Login / Signup</Button>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <h2 className="font-mincho text-3xl font-black text-stone-100">Your cart is empty</h2>
        <Button onClick={() => navigate('/products')} size="lg" className="mt-8">Continue Shopping</Button>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address.street || !card.number) {
      toast.error('Please fill in the address and card fields')
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
      <SectionHeading kicker="決済 · Checkout" title="Seal the Deal" />
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-4 lg:col-span-2">
          <Card className="p-6">
            <h2 className="font-mincho text-lg font-black text-stone-50">Shipping Address</h2>
            <div className="mt-4">
              <Input placeholder="Street address" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              <Input placeholder="ZIP" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />
              <Input placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-mincho text-lg font-black text-stone-50">
              <CreditCard className="h-5 w-5 text-kin" /> Mock Payment
            </h2>
            <div className="mt-4">
              <Input placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
              <Input placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
            </div>
            <p className="mt-3 text-xs text-stone-500">Demo store — no real charge is made.</p>
          </Card>
          <Button loading={loading} size="lg" className="w-full" type="submit">
            Place Order — {formatPrice(total)}
          </Button>
        </form>

        <Card className="h-fit p-6">
          <h2 className="font-mincho text-lg font-black text-stone-50">In Your Arsenal</h2>
          <div className="mt-4 space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm text-stone-300">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t border-ink-700 pt-4 text-xl font-black text-stone-50">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ------------------------------- Confirmation ------------------------------- */

export function Confirmation() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-28 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-kin/30 bg-kin/10 text-kin-light shadow-lg shadow-kin/10">
        <Package className="h-10 w-10" />
      </div>
      <h1 className="mt-8 font-mincho text-4xl font-black text-stone-50 md:text-5xl">Order Confirmed</h1>
      <p className="mt-4 text-lg text-stone-300">
        {orderId ? `Order #${orderId}` : 'Your order'} is forged and ready. A notification has been dispatched — your armor ships soon.
      </p>
      <div className="mt-10 flex gap-4">
        <Link to="/orders"><Button variant="secondary" size="lg">View Orders</Button></Link>
        <Link to="/products"><Button size="lg">Keep Shopping</Button></Link>
      </div>
    </div>
  )
}

/* ---------------------------------- Orders ---------------------------------- */

export function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const user = useStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    api
      .get('/orders')
      .then((res) => setOrders(res.data))
      .catch(() => toast.error('Could not load orders'))
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <h2 className="font-mincho text-3xl font-black text-stone-100">Please log in</h2>
        <p className="mt-2 text-stone-400">Your order history awaits.</p>
        <Button onClick={() => navigate('/auth')} size="lg" className="mt-8">Login</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <SectionHeading kicker="履歴 · History" title="Your Orders" />
      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <p className="mt-10 text-stone-400">No orders yet. The shop awaits.</p>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-stone-400">Order #{order.id}</p>
                  <p className="text-lg font-black text-stone-50">{formatPrice(order.total)}</p>
                </div>
                <span className="rounded-full border border-kin/30 bg-kin/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-kin-light">
                  {order.status}
                </span>
              </div>
              <div className="mt-4 space-y-1 border-t border-ink-700 pt-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm text-stone-300">
                    <span>{item.name} × {item.quantity}</span>
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

/* ----------------------------------- Auth ----------------------------------- */

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
      // Persist BOTH user and token — the axios interceptor reads state.user.token
      setUser({ ...res.data.user, token: res.data.token })
      toast.success(mode === 'login' ? 'Welcome back, warrior' : 'Account forged — welcome')
      navigate('/')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
      {/* Left: kanji showcase */}
      <div className="relative hidden overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 md:block">
        <div className="sun-disc absolute -bottom-24 -right-24 h-80 w-80 rounded-full" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <span className="font-mincho text-[11rem] font-black leading-none text-kin/90">武</span>
          <div>
            <p className="font-mincho text-2xl font-black leading-relaxed text-stone-200">
              "The warrior who wears his convictions
              <br />
              never fights alone."
            </p>
            <p className="mt-4 text-sm uppercase tracking-[0.3em] text-stone-500">Bushido Codex, Vol. I</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <Card className="p-8 md:p-10">
        <h1 className="font-mincho text-3xl font-black text-stone-50">
          {mode === 'login' ? 'Welcome Back' : 'Join the Dojo'}
        </h1>
        <p className="mt-2 text-stone-400">
          {mode === 'login' ? 'Sign in to continue your journey.' : 'Create an account and start your collection.'}
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-stone-400">Name</label>
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-stone-400">Email</label>
            <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-stone-400">Password</label>
            <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <Button loading={loading} size="lg" className="w-full" type="submit">
            {mode === 'login' ? 'Sign In' : 'Forge Account'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-stone-400">
          {mode === 'login' ? "Don't have an account?" : 'Already sworn in?'}{' '}
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="font-black text-kin-light hover:text-kin hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </Card>
    </div>
  )
}

/* ---------------------------------- Profile ---------------------------------- */

export function Profile() {
  const user = useStore((state) => state.user)
  const logout = useStore((state) => state.logout)
  const navigate = useNavigate()

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-28 text-center">
        <h2 className="font-mincho text-3xl font-black text-stone-100">Please log in</h2>
        <Button onClick={() => navigate('/auth')} size="lg" className="mt-8">Login</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-kin/30 bg-kin/10 text-kin-light">
          <User className="h-9 w-9" />
        </div>
        <h1 className="mt-5 font-mincho text-2xl font-black text-stone-50">{user.name || 'Warrior'}</h1>
        <p className="text-stone-400">{user.email}</p>
        <Button
          variant="secondary"
          onClick={() => {
            logout()
            navigate('/')
            toast.success('Logged out — walk with honor')
          }}
          className="mt-8 w-full"
        >
          <LogOut className="h-4 w-4" /> Logout
        </Button>
      </Card>
    </div>
  )
}
