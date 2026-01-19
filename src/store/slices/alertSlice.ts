import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppDispatch } from '../appStore'

export type AlertVariant = 'default' | 'destructive'

export type AlertItem = {
  id: string
  title: string
  description: string
  variant: AlertVariant
}

export type AlertState = {
  alerts: AlertItem[]
}

type EnqueueAlertOptions = {
  description: string
  title?: string
  variant?: AlertVariant
  durationMs?: number
}

const DEFAULT_DURATION = 3000

const alertSlice = createSlice({
  name: 'alert',
  initialState: { alerts: [] } as AlertState,
  reducers: {
    pushAlert: (state, action: PayloadAction<AlertItem>) => {
      state.alerts.push(action.payload)
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((alert) => alert.id !== action.payload)
    },
  },
})

export const { pushAlert, removeAlert } = alertSlice.actions

export const alertReducer = alertSlice.reducer

export const enqueueAlert =
  ({ description, title, variant = 'default', durationMs = DEFAULT_DURATION }: EnqueueAlertOptions) =>
  (dispatch: AppDispatch) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const resolvedTitle = title ?? (variant === 'destructive' ? '操作失败' : '提示')
    dispatch(
      pushAlert({
        id,
        title: resolvedTitle,
        description,
        variant,
      }),
    )
    if (durationMs > 0) {
      window.setTimeout(() => {
        dispatch(removeAlert(id))
      }, durationMs)
    }
  }
