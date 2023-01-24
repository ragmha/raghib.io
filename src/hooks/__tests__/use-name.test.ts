import { renderHook } from '@testing-library/react'
import { useName } from '../use-name'

it('returns username ', () => {
  const { result } = renderHook(useName)

  expect(result.current).not.toEqual('John')
  expect(result.current).toEqual('Raghib')
})
