import type { ComponentType } from 'react'

export type PartCategory =
  | 'feedback'
  | 'overlay'
  | 'navigation'
  | 'input'
  | 'data-display'
  | 'layout'
  | 'action'

export type Part = {
  id: string
  name: string
  kana: string
  aliases: string[]
  category: PartCategory
  description: string
  Preview: ComponentType
}
