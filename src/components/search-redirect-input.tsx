// src/components/search-redirect-input.tsx
'use client'

import { ArrowRight, Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'

interface SearchRedirectInputProps {
  placeholder?: string
  className?: string
}

export function SearchRedirectInput({
  placeholder = 'Yazılarda ara...',
  className,
}: SearchRedirectInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL'deki mevcut aramayı input'a doldur
  const [value, setValue] = useState(searchParams.get('search') || '')
  
  const hasValue = value.trim().length > 0

  const handleSubmit = useCallback(
    (nextValue: string) => {
      const trimmedValue = nextValue.trim()
      
      const params = new URLSearchParams(searchParams.toString())
      
      if (trimmedValue) {
        // Backend 'search' parametresini beklediği için key'i 'search' yapıyoruz
        params.set('search', trimmedValue) 
        params.set('page', '1') // Yeni aramada sayfa 1'e dön
      } else {
        params.delete('search')
      }

      // /posts sayfasına yönlendiriyoruz
      router.push(`/posts?${params.toString()}`)
    },
    [router, searchParams]
  )

  // URL dışarıdan değişirse inputu güncelle (örn: geri butonuna basınca)
  useEffect(() => {
    setValue(searchParams.get('search') || '')
  }, [searchParams])

  return (
    <InputGroup
      className={cn(
        '!bg-background h-10 w-full rounded-none border-0 shadow-none',
        className
      )}
    >
      <InputGroupAddon className='border-0 text-muted-foreground'>
        <Search className='size-4' />
      </InputGroupAddon>
      <InputGroupInput
        className='text-sm'
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            handleSubmit(event.currentTarget.value)
          }
        }}
        placeholder={placeholder}
        value={value}
      />
      <InputGroupAddon
        align='inline-end'
        className={cn(
          'transition-all duration-150 ease-out',
          hasValue
            ? 'scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        <InputGroupButton
          aria-label='Ara'
          className='group/button rounded-none'
          onClick={() => handleSubmit(value)}
          size='icon-sm'
          variant={'default'}
        >
          <ArrowRight className='size-3.5 transition-transform group-hover/button:-rotate-45' />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}