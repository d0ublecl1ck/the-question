import { expect, it } from 'vitest'
import i18n, { registerTranslations, setLanguage } from './i18n'

it('registers translations and switches language', async () => {
  registerTranslations('i18nTest', {
    zh: { greeting: '你好' },
    en: { greeting: 'Hello' },
  })

  expect(i18n.t('greeting', { ns: 'i18nTest' })).toBe('你好')

  await setLanguage('en')
  expect(i18n.t('greeting', { ns: 'i18nTest' })).toBe('Hello')

  await setLanguage('zh')
})
