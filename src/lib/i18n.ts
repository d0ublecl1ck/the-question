import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

type ResourceMap = Record<string, Record<string, unknown>>

type SupportedLanguage = 'zh' | 'en'

const STORAGE_KEY = 'wendui-language'
const FALLBACK_LANGUAGE: SupportedLanguage = 'zh'
const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['zh', 'en']
const registeredNamespaces = new Set<string>()

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return FALLBACK_LANGUAGE
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored && isSupportedLanguage(stored)) return stored
  return FALLBACK_LANGUAGE
}

const commonResources = {
  zh: {
    common: {
      actions: {
        save: '保存',
        saving: '保存中...',
        cancel: '取消',
        delete: '删除',
        edit: '编辑',
        view: '查看',
        viewDetails: '查看详情',
      },
      status: {
        loading: '正在加载中...',
        loadingShort: '加载中...',
        loadFailed: '加载失败，请稍后重试',
        emptySkills: '暂无技能',
        emptyTags: '暂无标签',
      },
      filters: {
        allTags: '全部标签',
        selectedTags: '已选 {{count}} 个标签',
      },
      auth: {
        loginRequired: '本功能登录才可以使用',
      },
      language: {
        label: '语言',
        description: '切换界面语言。',
        options: {
          zh: '简体中文',
          en: 'English',
        },
      },
    },
  },
  en: {
    common: {
      actions: {
        save: 'Save',
        saving: 'Saving...',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        viewDetails: 'View details',
      },
      status: {
        loading: 'Loading...',
        loadingShort: 'Loading...',
        loadFailed: 'Failed to load. Please try again.',
        emptySkills: 'No skills yet.',
        emptyTags: 'No tags yet.',
      },
      filters: {
        allTags: 'All tags',
        selectedTags: '{{count}} tags selected',
      },
      auth: {
        loginRequired: 'Please log in to use this feature.',
      },
      language: {
        label: 'Language',
        description: 'Switch the interface language.',
        options: {
          zh: '简体中文',
          en: 'English',
        },
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources: commonResources,
  lng: getInitialLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
  initImmediate: false,
})

export const registerTranslations = (namespace: string, resources: ResourceMap) => {
  if (registeredNamespaces.has(namespace)) return
  Object.entries(resources).forEach(([language, resource]) => {
    if (!isSupportedLanguage(language)) return
    i18n.addResourceBundle(language, namespace, resource, true, true)
  })
  registeredNamespaces.add(namespace)
}

export const setLanguage = (language: string) => {
  if (!isSupportedLanguage(language)) return Promise.resolve()
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, language)
  }
  return i18n.changeLanguage(language)
}

export const getLanguage = () => i18n.language

export const supportedLanguages = SUPPORTED_LANGUAGES

export default i18n
