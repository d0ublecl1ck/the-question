import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import App from '@/App'
import { store } from '@/store/appStore'

test('renders app with redux provider', () => {
  const { getAllByText } = render(
    <Provider store={store}>
      <App />
    </Provider>,
  )
  expect(getAllByText('WenDui').length).toBeGreaterThan(0)
})
