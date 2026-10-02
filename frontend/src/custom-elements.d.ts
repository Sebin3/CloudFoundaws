import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'md-icon': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        filled?: boolean | ''
      }
    }
  }
}
