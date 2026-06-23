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

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

export function internalError(error: unknown) {
  console.error('[API Error]', error)
  const message = error instanceof Error ? error.message : String(error)
  const isDev = process.env.NODE_ENV === 'development'
  return NextResponse.json(
    { error: 'Erro interno do servidor', ...(isDev && { detail: message }) },
    { status: 500 }
  )
}
