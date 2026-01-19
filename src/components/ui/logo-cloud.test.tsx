import { render, screen } from '@testing-library/react'
import { LogoCloud } from '@/components/ui/logo-cloud'

describe('LogoCloud', () => {
  it('renders logo images and links when href is provided', () => {
    render(
      <LogoCloud
        logos={[
          { alt: 'Alpha', src: '/alpha.png', href: 'https://example.com/alpha' },
          { alt: 'Beta', src: '/beta.png' },
        ]}
      />
    )

    const alphaLinks = screen.getAllByRole('link', { name: 'Alpha' })
    expect(alphaLinks.length).toBeGreaterThan(0)
    for (const link of alphaLinks) {
      expect(link).toHaveAttribute('href', 'https://example.com/alpha')
    }
    expect(screen.getAllByRole('img', { name: 'Alpha' }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('img', { name: 'Beta' }).length).toBeGreaterThan(0)
  })
})
