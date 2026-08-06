'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard')
  }, [router])
  return (
    <div className="d-flex align-items-center justify-content-center w-100" style={{ minHeight: '60vh' }}>
      <div className="text-center">
<h2 className="mb-3">zjewl · Atelier of Fine Jewellery</h2>
        <div className="skeleton w-100 mx-auto" style={{ height: 8, width: 220 }} />
      </div>
    </div>
  )
}
