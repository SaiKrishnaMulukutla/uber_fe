import { NextResponse } from 'next/server'

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('refresh_token')
  res.cookies.delete('role')
  return res
}
