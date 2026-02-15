'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { useCopyToClipboard } from 'usehooks-ts'
import { useLivePreview } from '@payloadcms/live-preview-react' // Live Preview kancası
import {
  UploadIcon as ShareIcon,
  type UploadIconHandle as ShareIconHandle,
} from '@/components/icons/animated/upload'
import { Icons } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Tipler
import type { Post } from '@/payload-types'
import { Header } from './_components/header'
import RichText from '@/components/RichText'
import { Section } from '@/components/section'

/**
 * MASTER CLIENT COMPONENT: 
 * Bu bileşen tüm sayfanın "canlı" kalmasını sağlar.
 */
export const PostPageClient = ({
  initialPost,
  serverURL,
}: {
  initialPost: Post
  serverURL: string
}) => {
  // Payload Admin panelindeki her tuş vuruşunu yakalar:
  const { data } = useLivePreview<Post>({
    initialData: initialPost,
    serverURL: serverURL,
    depth: 2,
  })

  return (
    <>
      {/* Header artık admin panelinde yazılan başlığı anlık yansıtır */}
      <Header page={data} />

      <Section className='h-full' sectionClassName='flex flex-1'>
        <article className='flex min-h-full flex-col lg:flex-row'>
          <div className='flex flex-1 flex-col gap-4'>
            <div className='prose min-w-0 flex-1 px-4 py-8'>
              {/* İçerik (Lexical) artık yazarken anlık güncellenir */}
              <RichText data={data.content} enableGutter={false} />
            </div>
          </div>

          <div className='flex flex-col gap-4 p-4 text-sm lg:sticky lg:top-[4rem] lg:h-[calc(100vh-4rem)] lg:w-[250px] lg:self-start lg:overflow-y-auto lg:border-border lg:border-l lg:border-dashed'>
            <div>
              <p className='mb-1 text-fd-muted-foreground text-sm'>Author</p>
              <p className='font-medium'>{data.populatedAuthors?.[0]?.name || 'Unknown'}</p>
            </div>
            
            {/* Senin mevcut Share butonun */}
            <Share url={`/posts/${data.slug}`} />
          </div>
        </article>
      </Section>
    </>
  )
}

/**
 * SHARE COMPONENT (Senin mevcut kodun)
 */
export function Share({
  url,
  label = 'Share Post',
}: {
  url: string
  label?: string
}): React.ReactElement {
  const iconRef = useRef<ShareIconHandle>(null)
  const [_, copyToClipboard] = useCopyToClipboard()

  const onClick = async (): Promise<void> => {
    await copyToClipboard(`${window.location.origin}${url}`)
    toast.success('Copied to clipboard!', {
      icon: <Icons.copied className='size-4' />,
      description: 'The post link has been copied to your clipboard.',
    })
  }

  return (
    <Button
      className={cn('group gap-2')}
      onClick={onClick}
      onMouseEnter={() => iconRef.current?.startAnimation?.()}
      onMouseLeave={() => iconRef.current?.stopAnimation?.()}
      variant={'secondary'}
    >
      <ShareIcon className='size-4 hover:bg-transparent' ref={iconRef} />
      {label}
    </Button>
  )
}