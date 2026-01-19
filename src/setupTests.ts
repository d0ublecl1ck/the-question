import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'
import '@/lib/i18n'

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock

window.HTMLElement.prototype.scrollIntoView = function scrollIntoView() {}

vi.mock('@lobehub/icons', () => ({
  Minimax: {
    Combine: (props: { size?: number; type?: string }) => React.createElement('span', props),
  },
  OpenAI: {
    Combine: (props: { size?: number; type?: string }) => React.createElement('span', props),
  },
  ModelScope: {
    Combine: (props: { size?: number; type?: string }) => React.createElement('span', props),
  },
}))
