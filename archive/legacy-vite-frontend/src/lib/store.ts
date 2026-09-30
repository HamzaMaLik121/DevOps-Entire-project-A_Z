import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: number
  name: string
  price: number
  imageUrl: string
  quantity: number
}

export interface User {
  id: number
  email: string
  name?: string
  token: string
}

interface StoreState {
  user: User | null
  cart: CartItem[]
  setUser: (user: User | null) => void
  logout: () => void
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      cart: [],
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      addToCart: (item) => {
        const cart = [...get().cart]
        const existing = cart.find((i) => i.productId === item.productId)
        if (existing) {
          existing.quantity += item.quantity || 1
        } else {
          cart.push({
            productId: item.productId,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl,
            quantity: item.quantity || 1
          })
        }
        set({ cart })
      },
      updateQuantity: (productId, quantity) => {
        const cart = get().cart
          .map((i) => (i.productId === productId ? { ...i, quantity } : i))
          .filter((i) => i.quantity > 0)
        set({ cart })
      },
      removeFromCart: (productId) => {
        set({ cart: get().cart.filter((i) => i.productId !== productId) })
      },
      clearCart: () => set({ cart: [] })
    }),
    { name: 'anime-threads-store' }
  )
)

export function useCartTotal() {
  return useStore((state) =>
    state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
}
