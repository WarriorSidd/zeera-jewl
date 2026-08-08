'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getStoredUser } from './lib/api'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const user = getStoredUser()
    if (user) {
      router.replace('/production')
    } else {
      router.replace('/login')
    }
  }, [router])

  return null
}
