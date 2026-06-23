'use client'

import { useEffect, useRef } from 'react'
import type { Product } from '@/features/products/types/product.types'
import { formatCurrency } from '@/utils/formatCurrency'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    JsBarcode: any
  }
}

interface ProductTagProps {
  product: Product
}

function BarcodeRenderer({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const render = () => {
      if (window.JsBarcode && svgRef.current) {
        window.JsBarcode(svgRef.current, value, {
          format: 'EAN13',
          width: 1.5,
          height: 38,
          displayValue: true,
          fontSize: 9,
          margin: 0,
          background: 'transparent',
          lineColor: '#fff',
          fontOptions: '',
          font: 'monospace',
          textMargin: 2,
        })
      }
    }

    if (window.JsBarcode) {
      render()
    } else {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'
      script.onload = render
      document.head.appendChild(script)
    }
  }, [value])

  return <svg ref={svgRef} className="w-full" />
}

/* ── Tag Face (frente) ─────────────────────────────────── */
function TagFront() {
  return (
    <div
      className="tag-face relative flex h-full w-full flex-col items-center overflow-hidden rounded-[10px]"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 100%)' }}
    >
      {/* hole */}
      <div className="mt-3 h-4 w-4 rounded-full border-2 border-[#2a2a2a] bg-[#0d0d0d]" />

      {/* diagonal lines decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-0.5 w-40 origin-left bg-[#00b4d8]"
            style={{ top: `${10 + i * 12}%`, left: '-10%', transform: `rotate(-35deg)` }}
          />
        ))}
      </div>

      {/* B watermark */}
      <div className="pointer-events-none absolute top-6 right-1 text-[90px] leading-none font-black text-white opacity-[0.04] select-none">
        B
      </div>

      {/* Logo area */}
      <div className="mt-3 flex flex-col items-center">
        {/* B icon */}
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full border border-[#333]">
          <span className="text-2xl font-black text-white italic">B</span>
        </div>
        <p className="text-[11px] font-black tracking-[0.3em] text-white">BROTHERS</p>
        <div className="my-0.5 flex items-center gap-1">
          <div className="h-px w-5 bg-[#00b4d8]" />
          <p className="text-[7px] font-bold tracking-[0.5em] text-[#00b4d8]">OUTLET</p>
          <div className="h-px w-5 bg-[#00b4d8]" />
        </div>
      </div>

      {/* icons row */}
      <div className="my-2 flex w-full items-center justify-around gap-2 border-t border-b border-[#2a2a2a] px-2 py-2">
        {[
          { icon: '⚡', label: 'PERFORMANCE' },
          { icon: '✓', label: 'QUALIDADE' },
          { icon: '◈', label: 'ESTILO' },
        ].map(({ icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span className="text-sm text-[#00b4d8]">{icon}</span>
            <span className="text-[6px] font-bold tracking-wider text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* LIFESTYLE badge */}
      <div className="my-1 rounded border border-[#00b4d8] px-4 py-0.5">
        <span className="text-[8px] font-bold tracking-[0.4em] text-[#00b4d8]">LIFESTYLE</span>
      </div>

      {/* slogan */}
      <p className="mt-2 text-center text-[7px] font-light tracking-[0.2em] text-gray-400">
        VISTA SUA MELHOR VERSÃO.
      </p>
      <div className="mt-1 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-0.5 w-3 rounded-full bg-[#00b4d8] opacity-70" />
        ))}
      </div>
    </div>
  )
}

/* ── Tag Face (verso) ──────────────────────────────────── */
function TagBack({ product }: { product: Product }) {
  return (
    <div
      className="tag-face relative flex h-full w-full flex-col overflow-hidden rounded-[10px]"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #1a1a1a 100%)' }}
    >
      {/* hole */}
      <div className="mx-auto mt-3 h-4 w-4 rounded-full border-2 border-[#2a2a2a] bg-[#0d0d0d]" />

      {/* header */}
      <div className="mt-2 px-3 text-center">
        <p className="text-[7px] font-light tracking-wider text-gray-400">OBRIGADO POR ESCOLHER</p>
        <p className="text-[11px] font-black tracking-wider text-white">BROTHERS OUTLET!</p>
        <div className="mx-auto mt-1 h-px w-3/4 bg-[#00b4d8]" />
      </div>

      {/* benefits */}
      <div className="mt-2 space-y-1 px-3">
        {[
          { icon: '✓', text: 'PRODUTO SELECIONADO COM QUALIDADE' },
          { icon: '◎', text: 'CONFORTO PARA O DIA A DIA' },
          { icon: '◈', text: 'ESTILO PARA QUALQUER OCASIÃO' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#00b4d8]">{icon}</span>
            <span className="text-[6.5px] font-semibold tracking-wide text-gray-300">{text}</span>
          </div>
        ))}
      </div>

      <div className="mx-3 my-1.5 h-px bg-[#2a2a2a]" />

      {/* social */}
      <div className="px-3">
        <p className="mb-1 text-[6px] font-bold tracking-[0.3em] text-[#00b4d8]">
          SIGA-NOS NAS REDES SOCIAIS
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-gray-400">◎</span>
          <span className="text-[7px] text-gray-300">@Brothersoutlet_oficial</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-gray-400">◉</span>
          <span className="text-[7px] text-gray-300">BAÍA FORMOSA-RN</span>
        </div>
      </div>

      {/* product info box */}
      <div className="mx-3 mt-1.5 rounded border border-dashed border-[#333] bg-white p-1.5">
        <p className="truncate text-[7px] font-bold text-gray-800">{product.name}</p>
        <p className="text-[7px] text-gray-500">Cód: {product.barcode ?? '—'}</p>
        <p className="text-[8px] font-bold text-gray-800">{formatCurrency(product.price)}</p>
        {product.originalPrice && (
          <p className="text-[6.5px] text-gray-400 line-through">
            {formatCurrency(product.originalPrice)}
          </p>
        )}
      </div>

      {/* care icons */}
      <div className="mx-3 mt-1">
        <p className="mb-1 text-[6px] font-bold tracking-[0.3em] text-gray-500">CUIDADOS</p>
        <div className="flex items-center justify-between">
          {[
            { icon: '✋', label: 'LAVAR À MÃO' },
            { icon: '✗', label: 'SEM ALVEJANTE' },
            { icon: '◫', label: 'SECAR À SOMBRA' },
            { icon: '✗', label: 'SEM FERRO' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-gray-400">{icon}</span>
              <span className="text-center text-[5px] leading-tight text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* barcode */}
      {product.barcode && (
        <div className="mx-3 mt-1.5">
          <BarcodeRenderer value={product.barcode} />
        </div>
      )}

      {/* footer */}
      <div className="mt-auto flex items-center justify-between border-t border-[#00b4d8] bg-[#00b4d8]/10 px-3 py-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30">
          <span className="text-[9px] font-black text-white italic">B</span>
        </div>
        <div className="text-right">
          <p className="text-[7px] font-black tracking-wider text-white">BROTHERS</p>
          <p className="text-[5.5px] font-bold tracking-[0.3em] text-[#00b4d8]">OUTLET</p>
        </div>
      </div>
    </div>
  )
}

/* ── ProductTag (exported component) ──────────────────── */
export function ProductTag({ product }: ProductTagProps) {
  return (
    <div className="flex gap-4">
      {/* Frente */}
      <div>
        <p className="mb-1 text-center text-[10px] font-medium text-gray-500">Frente</p>
        <div style={{ width: 140, height: 240 }}>
          <TagFront />
        </div>
      </div>
      {/* Verso */}
      <div>
        <p className="mb-1 text-center text-[10px] font-medium text-gray-500">Verso</p>
        <div style={{ width: 140, height: 240 }}>
          <TagBack product={product} />
        </div>
      </div>
    </div>
  )
}

/* ── exportTagAsPDF ────────────────────────────────────── */
export async function exportTagAsPDF(product: Product) {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;display:flex;gap:16px;padding:16px;background:#f9fafb;'

  // Front
  const frontWrap = document.createElement('div')
  frontWrap.style.cssText = 'width:140px;height:240px;'
  frontWrap.innerHTML = document.querySelector('[data-tag-front]')?.innerHTML ?? ''

  // Back
  const backWrap = document.createElement('div')
  backWrap.style.cssText = 'width:140px;height:240px;'
  backWrap.innerHTML = document.querySelector('[data-tag-back]')?.innerHTML ?? ''

  // Use the live rendered element instead
  const tagEl = document.querySelector('[data-product-tag]') as HTMLElement
  if (!tagEl) return

  const canvas = await html2canvas(tagEl, {
    scale: 3,
    useCORS: true,
    backgroundColor: '#f9fafb',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [canvas.width / (3 * 3.78), canvas.height / (3 * 3.78)],
  })

  pdf.addImage(
    imgData,
    'PNG',
    0,
    0,
    pdf.internal.pageSize.getWidth(),
    pdf.internal.pageSize.getHeight()
  )
  pdf.save(`etiqueta-${product.barcode ?? product.id}.pdf`)
}
