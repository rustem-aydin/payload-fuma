import type { LinkItemType } from 'fumadocs-ui/layouts/shared'
import { Icons } from '@/components/icons/icons'

export const linkItems: LinkItemType[] = [
  {
    text: 'About',
    icon: <Icons.user />,
    url: '/about',
  },
  {
    text: 'Posts',
    icon: <Icons.posts />,
    url: '/posts',
    active: 'nested-url',
  },
]
