import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function unauthorized() {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}

export function notFound(message = 'Recurso não encontrado') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function forbidden(message = 'Acesso negado') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function tooManyRequests(retryAfterSeconds = 60) {
  return NextResponse.json(
    { error: 'Muitas requisições. Tente novamente em instantes.' },
    {
      status: 429,
      headers: { 'Retry-After': String(retryAfterSeconds) },
    }
  )
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

export function internalError(error: unknown) {
  const isDev = process.env.NODE_ENV === 'development'
  if (isDev) {
    // Full detail in development
    console.error('[API Error]', error)
  } else {
    // In production: log only error type + message, never stack trace or raw objects
    const type = error instanceof Error ? error.constructor.name : typeof error
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[API Error] ${type}: ${message}`)
  }
  const message = error instanceof Error ? error.message : String(error)
  return NextResponse.json(
    { error: 'Erro interno do servidor', ...(isDev && { detail: message }) },
    { status: 500 }
  )
}
