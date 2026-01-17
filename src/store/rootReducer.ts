import { combineReducers } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'
import { authReducer } from './slices/authSlice'
import { toastReducer } from './slices/toastSlice'

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  toast: toastReducer,
})
