'use client'

import { ArrowRight, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 1. URL'den değeri al (başlangıç için)
  const initialSearch = searchParams.get('search') || ''
  const [value, setValue] = useState(initialSearch)
  
  const hasValue = value.trim().length > 0

  // 2. Arama Fonksiyonu (Sadece tetiklendiğinde çalışır)
  const handleSubmit = () => {
    const trimmedValue = value.trim()
    const params = new URLSearchParams(searchParams.toString())

    if (trimmedValue) {
      params.set('search', trimmedValue)
      params.set('page', '1') // Yeni aramada sayfa 1'e dön
    } else {
      params.delete('search')
    }

    // Router push işlemini SADECE burada yapıyoruz (useEffect içinde değil!)
    router.push(`/posts?${params.toString()}`)
  }

  // 3. Enter tuşu kontrolü
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  // 4. URL değişirse (örn: geri butonu) inputu güncelle
  useEffect(() => {
    setValue(searchParams.get('search') || '')
  }, [searchParams])

  return (
    <div className="flex w-full max-w-sm items-center border border-border bg-background">
      {/* Sol İkon */}
      <div className="flex h-10 w-10 items-center justify-center text-muted-foreground">
        <Search className="size-4" />
      </div>

      {/* Input Alanı */}
      <input
        className="flex h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        placeholder="Yazılarda ara..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {/* Sağ Buton (Animasyonlu) */}
      <div
        className={cn(
          "flex items-center justify-center transition-all duration-200 ease-out",
          hasValue ? "w-10 opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none"
        )}
      >
        <button
          onClick={handleSubmit}
          className="group flex h-10 w-10 items-center justify-center hover:bg-muted"
          aria-label="Ara"
        >
          <ArrowRight className="size-4 transition-transform group-hover:-rotate-45" />
        </button>
      </div>
    </div>
  )
}