import { describe, expect, it } from 'vitest'
import { buildClarifyResponsePayload } from './ChatBubble'

describe('buildClarifyResponsePayload', () => {
  it('collects answers for multiple items in order', () => {
    const tree = {
      root: 'clarify-chain',
      elements: {
        'clarify-chain': {
          key: 'clarify-chain',
          type: 'ClarifyChain',
          children: ['clarify-0', 'clarify-1', 'clarify-2'],
        },
        'clarify-0': {
          key: 'clarify-0',
          type: 'free_text',
          props: { question: '问题A' },
        },
        'clarify-1': {
          key: 'clarify-1',
          type: 'free_text',
          props: { question: '问题B' },
        },
        'clarify-2': {
          key: 'clarify-2',
          type: 'ranking',
          props: { question: '排序题', choices: ['一', '二', '三'] },
        },
      },
    }

    const response = buildClarifyResponsePayload(
      tree,
      {},
      { 'clarify-2': ['三', '二', '一'] },
      { 'clarify-0': '回答A', 'clarify-1': '回答B' },
    )

    expect(response.free_text).toEqual([
      { question: '问题A', answer: '回答A' },
      { question: '问题B', answer: '回答B' },
    ])
    expect(response.ranking).toEqual([{ question: '排序题', order: ['三', '二', '一'] }])
  })
})
