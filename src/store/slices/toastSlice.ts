import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppDispatch } from '../appStore'

export type ToastItem = {
  id: string
  message: string
}

export type ToastState = {
  toasts: ToastItem[]
}

const DEFAULT_DURATION = 3000

const toastSlice = createSlice({
  name: 'toast',
  initialState: { toasts: [] } as ToastState,
  reducers: {
    pushToast: (state, action: PayloadAction<ToastItem>) => {
      state.toasts.push(action.payload)
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload)
    },
  },
})

export const { pushToast, removeToast } = toastSlice.actions

export const toastReducer = toastSlice.reducer

export const enqueueToast = (message: string, durationMs = DEFAULT_DURATION) => (dispatch: AppDispatch) => {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  dispatch(pushToast({ id, message }))
  window.setTimeout(() => {
    dispatch(removeToast(id))
  }, durationMs)
}
