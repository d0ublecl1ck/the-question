import { combineReducers } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'
import { authReducer } from './slices/authSlice'
import { alertReducer } from './slices/alertSlice'

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  alert: alertReducer,
})
