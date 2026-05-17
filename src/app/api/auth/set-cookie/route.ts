import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { refresh_token, role } = await req.json()

  if (!refresh_token || !role) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('refresh_token', refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  res.cookies.set('role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
