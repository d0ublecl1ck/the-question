import { beforeEach, expect, it } from 'vitest'
import { store } from '@/store/appStore'
import { enqueueAlert, removeAlert } from '@/store/slices/alertSlice'

beforeEach(() => {
  const alerts = store.getState().alert.alerts
  alerts.forEach((alert) => {
    store.dispatch(removeAlert(alert.id))
  })
})

it('enqueues alert with defaults', () => {
  const initialCount = store.getState().alert.alerts.length
  store.dispatch(enqueueAlert({ description: '测试提示', durationMs: 0 }))
  const alerts = store.getState().alert.alerts
  expect(alerts.length).toBe(initialCount + 1)
  const latest = alerts[alerts.length - 1]
  expect(latest?.description).toBe('测试提示')
  expect(latest?.title).toBe('提示')
  expect(latest?.variant).toBe('default')
})
