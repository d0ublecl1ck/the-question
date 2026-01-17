import { combineReducers } from '@reduxjs/toolkit'
import { baseApi } from './api/baseApi'

export const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
})
