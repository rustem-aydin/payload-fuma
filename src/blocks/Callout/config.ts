// src/blocks/Callout/config.ts
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Block } from 'payload'

export const Callout: Block = {
  slug: 'callout',
  interfaceName: 'CalloutBlock',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Bilgi (Mavi)', value: 'info' },
        { label: 'Uyarı (Sarı)', value: 'warn' },
        { label: 'Hata (Kırmızı)', value: 'error' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      label: 'Başlık (İsteğe bağlı)',
    },
   {
      name: 'content',
      type: 'richText',
      required: true,
      // KRİTİK EKSİK BURASI:
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          // Blok içindeki RichText genelde sade olur, 
          // istersen burayı boş bırakabilir veya kısıtlayabilirsin.
        ],
      }),
    },
  ],
}