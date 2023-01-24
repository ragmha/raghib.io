/** Simple React hook example */

import { useEffect, useState } from 'react'

export const useName = (): string => {
  const [name, setName] = useState('')

  useEffect(() => setName('Raghib'), [])

  return name
}
