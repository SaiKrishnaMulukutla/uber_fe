import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export async function GET(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value
  const role = req.cookies.get('role')?.value

  if (!refreshToken || !role) {
    return NextResponse.json({ error: 'no refresh token' }, { status: 401 })
  }

  const endpoint =
    role === 'driver'
      ? `${API_URL}/drivers/refresh`
      : `${API_URL}/users/refresh`

  const upstream = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!upstream.ok) {
    const res = NextResponse.json({ error: 'refresh failed' }, { status: 401 })
    res.cookies.delete('refresh_token')
    res.cookies.delete('role')
    return res
  }

  const data = await upstream.json()

  // Rotate the cookie with the new refresh token
  const res = NextResponse.json({ accessToken: data.access_token })
  res.cookies.set('refresh_token', data.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
