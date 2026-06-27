'use client'

import { useRef, useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import type { Product, ProductVariant, SizeLabel } from '@/features/products/types/product.types'
import { SIZES } from '@/features/products/types/product.types'

/* ── JsBarcode loader ──────────────────────────────────── */
type JsBarcodeLib = (el: SVGSVGElement, value: string, opts: object) => void

function loadJsBarcode(): Promise<JsBarcodeLib> {
  return new Promise((resolve) => {
    const w = window as Window & { JsBarcode?: JsBarcodeLib }
    if (w.JsBarcode) {
      resolve(w.JsBarcode)
      return
    }
    const existing = document.getElementById('jsbarcode-cdn') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(w.JsBarcode!))
      return
    }
    const s = document.createElement('script')
    s.id = 'jsbarcode-cdn'
    s.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js'
    s.onload = () => resolve(w.JsBarcode!)
    document.head.appendChild(s)
  })
}

/* ── Barcode preview (for modal only) ─────────────────── */
function BarcodePreview({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    loadJsBarcode().then((JsBarcode) => {
      if (!svgRef.current) return
      JsBarcode(svgRef.current, value, {
        format: 'EAN13',
        width: 1.6,
        height: 44,
        displayValue: true,
        fontSize: 10,
        margin: 0,
        background: 'transparent',
        lineColor: '#fff',
        font: 'monospace',
        textMargin: 2,
      })
    })
  }, [value])

  return <svg ref={svgRef} style={{ width: '100%' }} />
}

const CYAN = '#00b4d8'
const DARK = '#0d0d0d'

/* ── build self-contained print HTML ──────────────────── */
function buildPrintHtml(product: Product, barcodeSvgStr: string) {
  const diagonalLines = `<svg width="100%" height="100%" viewBox="0 0 160 300" preserveAspectRatio="none"
    style="position:absolute;top:0;left:0;pointer-events:none;">
    ${Array.from(
      { length: 8 },
      (_, i) => `
      <line x1="-40" y1="${30 + i * 38}" x2="200" y2="${30 + i * 38 - 80}"
        stroke="${CYAN}" stroke-width="1.5" stroke-opacity="0.18"/>`
    ).join('')}
  </svg>`

  const watermarkB = `<div style="position:absolute;top:6px;right:-8px;font-size:140px;font-weight:900;
    font-style:italic;color:white;opacity:0.04;line-height:1;pointer-events:none;user-select:none;">B</div>`

  const tagBase = `background:linear-gradient(158deg,${DARK} 0%,#1a1a1a 55%,#111 100%);
    -webkit-print-color-adjust:exact;print-color-adjust:exact;`

  const hole = `<div style="display:flex;justify-content:center;padding-top:10px;position:relative;">
    <div style="width:14px;height:14px;border-radius:50%;border:2px solid #2a2a2a;background:#090909;box-shadow:inset 0 1px 3px rgba(0,0,0,.9);"></div>
  </div>`

  const front = `
  <div style="width:58mm;height:100mm;border-radius:7mm;overflow:hidden;position:relative;flex-shrink:0;${tagBase}">
    ${diagonalLines}${watermarkB}
    ${hole}
    <div style="position:relative;display:flex;flex-direction:column;align-items:center;margin-top:10px;">
      <div style="width:52px;height:52px;border-radius:50%;border:1.5px solid #333;background:#111;
        display:flex;align-items:center;justify-content:center;box-shadow:0 2px 14px rgba(0,0,0,.7);">
        <span style="font-size:26px;font-weight:900;font-style:italic;color:#fff;letter-spacing:-1px;">B</span>
      </div>
      <p style="margin-top:8px;font-size:14px;font-weight:900;letter-spacing:.38em;color:#fff;font-family:Arial Black,Arial,sans-serif;">BROTHERS</p>
      <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
        <div style="height:1px;width:20px;background:${CYAN};"></div>
        <p style="font-size:7.5px;font-weight:700;letter-spacing:.55em;color:${CYAN};font-family:Arial,sans-serif;">OUTLET</p>
        <div style="height:1px;width:20px;background:${CYAN};"></div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-around;align-items:center;
      border-top:1px solid #1e1e1e;border-bottom:1px solid #1e1e1e;
      padding:8px 8px;margin:12px 0;position:relative;">
      ${[
        { icon: '⚡', label: 'PERFORMANCE' },
        { icon: '✓', label: 'QUALIDADE' },
        { icon: '◈', label: 'ESTILO' },
      ]
        .map(
          (item, i) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;${i < 2 ? `border-right:1px solid #222;padding-right:10px;` : ''}">
          <span style="font-size:13px;color:${CYAN};">${item.icon}</span>
          <span style="font-size:5.5px;font-weight:700;letter-spacing:.12em;color:#555;font-family:Arial,sans-serif;">${item.label}</span>
        </div>`
        )
        .join('')}
    </div>
    <div style="display:flex;justify-content:center;position:relative;">
      <div style="border:1.5px solid ${CYAN};border-radius:3px;padding:4px 16px;">
        <span style="font-size:9px;font-weight:700;letter-spacing:.55em;color:${CYAN};font-family:Arial,sans-serif;">LIFESTYLE</span>
      </div>
    </div>
    <p style="position:relative;text-align:center;font-size:7.5px;font-weight:300;
      letter-spacing:.22em;color:#4a4a4a;font-family:Arial,sans-serif;margin-top:12px;">VISTA SUA MELHOR VERSÃO.</p>
    <div style="position:relative;display:flex;justify-content:center;gap:5px;margin-top:6px;">
      ${[0, 1, 2].map(() => `<div style="height:2px;width:14px;border-radius:2px;background:${CYAN};opacity:.75;"></div>`).join('')}
    </div>
  </div>`

  const back = `
  <div style="width:58mm;height:100mm;border-radius:7mm;overflow:hidden;position:relative;flex-shrink:0;
    display:flex;flex-direction:column;${tagBase}">
    ${hole}
    <div style="text-align:center;padding:7px 12px 0;">
      <p style="font-size:7px;color:#777;letter-spacing:.18em;font-family:Arial,sans-serif;">OBRIGADO POR ESCOLHER</p>
      <p style="font-size:12px;font-weight:900;color:#fff;letter-spacing:.1em;font-family:Arial Black,Arial,sans-serif;line-height:1.2;">BROTHERS OUTLET!</p>
      <div style="height:1.5px;background:${CYAN};margin:5px auto 0;width:72%;"></div>
    </div>
    <div style="padding:6px 10px 0;display:flex;flex-direction:column;gap:4px;">
      ${[
        { icon: '✓', text: 'PRODUTO SELECIONADO COM QUALIDADE' },
        { icon: '◎', text: 'CONFORTO PARA O DIA A DIA' },
        { icon: '◈', text: 'ESTILO PARA QUALQUER OCASIÃO' },
      ]
        .map(
          (b) => `<div style="display:flex;align-items:center;gap:5px;">
          <span style="font-size:10px;color:${CYAN};flex-shrink:0;">${b.icon}</span>
          <span style="font-size:6.5px;font-weight:600;color:#ccc;letter-spacing:.04em;font-family:Arial,sans-serif;">${b.text}</span>
        </div>`
        )
        .join('')}
    </div>
    <div style="height:1px;background:#1e1e1e;margin:5px 10px;"></div>
    <div style="padding:0 10px;">
      <p style="font-size:6px;font-weight:700;letter-spacing:.28em;color:${CYAN};margin-bottom:3px;font-family:Arial,sans-serif;">SIGA-NOS NAS REDES SOCIAIS</p>
      <p style="font-size:7px;color:#bbb;font-family:Arial,sans-serif;">⊙ @Brothersoutlet_oficial</p>
      <p style="font-size:7px;color:#bbb;font-family:Arial,sans-serif;margin-top:1px;">◉ BAÍA FORMOSA-RN</p>
    </div>
    <div style="height:1px;background:#1e1e1e;margin:5px 10px;"></div>
    <div style="padding:0 8px;">
      <p style="font-size:5.5px;font-weight:700;letter-spacing:.25em;color:#444;margin-bottom:3px;font-family:Arial,sans-serif;">CUIDADOS</p>
      <div style="display:flex;justify-content:space-between;">
        ${['LAVAR À MÃO', 'SEM ALVEJANTE', 'SECAR À SOMBRA', 'SEM FERRO']
          .map(
            (label) => `
          <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
            <div style="width:17px;height:17px;border:1.5px solid #3a3a3a;border-radius:3px;"></div>
            <span style="font-size:4.5px;color:#444;text-align:center;font-family:Arial,sans-serif;max-width:20px;line-height:1.2;">${label}</span>
          </div>`
          )
          .join('')}
      </div>
    </div>
    <!-- barcode: black on white for scanning -->
    <div style="flex:1;display:flex;align-items:flex-end;padding:4px 8px 0;">
      <div style="background:#fff;border-radius:4px;padding:5px 4px 2px;width:100%;">
        ${barcodeSvgStr}
      </div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:5px 10px;border-top:1.5px solid ${CYAN};background:rgba(0,180,216,.10);">
      <div style="width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(255,255,255,.2);
        display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;font-style:italic;color:#fff;font-family:Arial,sans-serif;">B</div>
      <div style="text-align:right;">
        <p style="font-size:7.5px;font-weight:900;color:#fff;letter-spacing:.18em;font-family:Arial Black,Arial,sans-serif;">BROTHERS</p>
        <p style="font-size:5.5px;font-weight:700;color:${CYAN};letter-spacing:.35em;font-family:Arial,sans-serif;">OUTLET</p>
      </div>
    </div>
  </div>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Etiqueta — ${product.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
    @page{size:128mm 108mm landscape;margin:4mm;}
    body{font-family:Arial,sans-serif;background:#d1d5db;display:flex;justify-content:center;
      align-items:center;gap:8mm;padding:4mm;min-height:100vh;}
    @media print{body{background:#d1d5db;min-height:unset;}}
  </style>
</head>
<body>${front}${back}</body>
</html>`
}

/* ── ProductTagModal ───────────────────────────────────── */
interface ProductTagModalProps {
  product: Product
  onClose: () => void
}

export function ProductTagModal({ product, onClose }: ProductTagModalProps) {
  const previewBarcodeSvgRef = useRef<SVGSVGElement>(null)
  const [exporting, setExporting] = useState(false)
  const [barcodeReady, setBarcodeReady] = useState(false)

  // ── Variant selection for stock deduction ───────────────
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedSize, setSelectedSize] = useState<SizeLabel | ''>('')

  useEffect(() => {
    fetch(`/api/products/${product.id}/variants`)
      .then((r) => r.json())
      .then((d) => {
        const list: ProductVariant[] = Array.isArray(d) ? d : (d.data ?? [])
        setVariants(list)
        if (list.length > 0) setSelectedVariant(list[0])
      })
      .catch(() => {})
  }, [product.id])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setSelectedSize('')
  }, [selectedVariant?.id])

  const availableSizes = selectedVariant
    ? SIZES.filter((s) => (selectedVariant.sizes.find((sz) => sz.size === s)?.stock ?? 0) > 0)
    : []

  function stockFor(size: SizeLabel) {
    return selectedVariant?.sizes.find((sz) => sz.size === size)?.stock ?? 0
  }

  const activeBarcode = selectedVariant?.barcode ?? null

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!activeBarcode) {
      setBarcodeReady(false)
      return
    }
    loadJsBarcode().then((JsBarcode) => {
      if (!previewBarcodeSvgRef.current) return
      JsBarcode(previewBarcodeSvgRef.current, activeBarcode, {
        format: 'EAN13',
        width: 1.6,
        height: 44,
        displayValue: true,
        fontSize: 10,
        margin: 0,
        background: 'transparent',
        lineColor: '#fff',
        font: 'monospace',
        textMargin: 2,
      })
      setBarcodeReady(true)
    })
  }, [activeBarcode])

  function handleExport() {
    if (!activeBarcode) return
    setExporting(true)

    loadJsBarcode().then((JsBarcode) => {
      // Render barcode into a detached SVG for the print HTML
      const printSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      JsBarcode(printSvg, activeBarcode, {
        format: 'EAN13',
        width: 1.8,
        height: 48,
        displayValue: true,
        fontSize: 11,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000',
        font: 'monospace',
        textMargin: 2,
      })
      printSvg.setAttribute('style', 'width:100%;display:block;')
      const barcodeSvgStr = new XMLSerializer().serializeToString(printSvg)

      const html = buildPrintHtml(product, barcodeSvgStr)

      const printWin = window.open('', '_blank', 'width=700,height=500')
      if (!printWin) {
        alert('Pop-up bloqueado. Permita pop-ups neste site para exportar.')
        setExporting(false)
        return
      }

      printWin.document.open()
      printWin.document.write(html)
      printWin.document.close()

      setTimeout(() => {
        printWin.focus()
        printWin.print()
        setExporting(false)
      }, 600)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Etiqueta do Produto</h2>
            <p className="mt-0.5 max-w-xs truncate text-xs text-gray-400">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Seleção de cor/tamanho para baixa de estoque ── */}
        {variants.length > 0 && (
          <div className="space-y-3 border-b border-gray-100 bg-gray-50/60 px-6 py-4">
            <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Selecione para dar baixa no estoque ao imprimir
            </p>

            {/* Cores */}
            <div className="space-y-1.5">
              <p className="text-xs text-gray-400">Cor</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    title={v.colorName}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-[#4A6CF7] bg-[#4A6CF7]/10 text-[#4A6CF7]'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="h-3 w-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: v.colorHex ?? '#888' }}
                    />
                    {v.colorName}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamanhos */}
            {selectedVariant && (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-400">Tamanho</p>
                {availableSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                          selectedSize === s
                            ? 'border-[#4A6CF7] bg-[#4A6CF7] text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {s}
                        <span className="ml-1 opacity-60">({stockFor(s)})</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-red-400">Sem estoque disponível para esta cor</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* preview */}
        <div className="flex-1 overflow-auto p-6">
          {activeBarcode ? (
            <>
              <p className="mb-4 text-center text-xs text-gray-400">
                Cód. de barras ({selectedVariant?.colorName}):{' '}
                <span className="font-mono font-semibold text-gray-600">{activeBarcode}</span>
              </p>

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-200 p-5">
                {/* ── FRENTE ── */}
                <div className="flex flex-col items-center gap-1.5 justify-self-center">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    Frente
                  </span>
                  <div
                    style={{
                      width: 145,
                      height: 250,
                      borderRadius: 18,
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'linear-gradient(158deg,#0d0d0d 0%,#1a1a1a 55%,#111 100%)',
                      flexShrink: 0,
                    }}
                  >
                    {/* diagonal lines */}
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 160 300"
                      preserveAspectRatio="none"
                      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                    >
                      {Array.from({ length: 8 }, (_, i) => (
                        <line
                          key={i}
                          x1="-40"
                          y1={30 + i * 38}
                          x2="200"
                          y2={30 + i * 38 - 80}
                          stroke="#00b4d8"
                          strokeWidth="1.2"
                          strokeOpacity="0.18"
                        />
                      ))}
                    </svg>
                    {/* watermark */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: -6,
                        fontSize: 120,
                        fontWeight: 900,
                        fontStyle: 'italic',
                        color: '#fff',
                        opacity: 0.04,
                        lineHeight: 1,
                        userSelect: 'none',
                        pointerEvents: 'none',
                      }}
                    >
                      B
                    </div>
                    {/* hole */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        paddingTop: 10,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid #2a2a2a',
                          background: '#0a0a0a',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,.8)',
                        }}
                      />
                    </div>
                    {/* logo */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: 10,
                        position: 'relative',
                      }}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: '50%',
                          border: '1.5px solid #333',
                          background: '#111',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 12px rgba(0,0,0,.6)',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 26,
                            fontWeight: 900,
                            fontStyle: 'italic',
                            color: '#fff',
                          }}
                        >
                          B
                        </span>
                      </div>
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          fontWeight: 900,
                          letterSpacing: '.38em',
                          color: '#fff',
                        }}
                      >
                        BROTHERS
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <div style={{ height: 1, width: 18, background: '#00b4d8' }} />
                        <p
                          style={{
                            fontSize: 7,
                            fontWeight: 700,
                            letterSpacing: '.55em',
                            color: '#00b4d8',
                          }}
                        >
                          OUTLET
                        </p>
                        <div style={{ height: 1, width: 18, background: '#00b4d8' }} />
                      </div>
                    </div>
                    {/* icons */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-around',
                        alignItems: 'center',
                        borderTop: '1px solid #222',
                        borderBottom: '1px solid #222',
                        padding: '7px 8px',
                        margin: '10px 0',
                        position: 'relative',
                      }}
                    >
                      {[
                        { icon: '⚡', label: 'PERFORMANCE' },
                        { icon: '✓', label: 'QUALIDADE' },
                        { icon: '◈', label: 'ESTILO' },
                      ].map((item, i) => (
                        <div
                          key={item.label}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                            borderRight: i < 2 ? '1px solid #222' : 'none',
                            paddingRight: i < 2 ? 8 : 0,
                          }}
                        >
                          <span style={{ fontSize: 12, color: '#00b4d8' }}>{item.icon}</span>
                          <span
                            style={{
                              fontSize: 5.5,
                              fontWeight: 700,
                              letterSpacing: '.12em',
                              color: '#666',
                            }}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* lifestyle */}
                    <div
                      style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}
                    >
                      <div
                        style={{
                          border: '1.5px solid #00b4d8',
                          borderRadius: 3,
                          padding: '4px 14px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 8.5,
                            fontWeight: 700,
                            letterSpacing: '.55em',
                            color: '#00b4d8',
                          }}
                        >
                          LIFESTYLE
                        </span>
                      </div>
                    </div>
                    {/* slogan */}
                    <p
                      style={{
                        textAlign: 'center',
                        fontSize: 7,
                        fontWeight: 300,
                        letterSpacing: '.22em',
                        color: '#555',
                        marginTop: 10,
                        position: 'relative',
                      }}
                    >
                      VISTA SUA MELHOR VERSÃO.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 4,
                        marginTop: 5,
                        position: 'relative',
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          style={{
                            height: 2,
                            width: 14,
                            borderRadius: 2,
                            background: '#00b4d8',
                            opacity: 0.7,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── VERSO ── */}
                <div className="flex flex-col items-center gap-1.5 justify-self-center">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    Verso
                  </span>
                  <div
                    style={{
                      width: 145,
                      height: 250,
                      borderRadius: 18,
                      overflow: 'hidden',
                      position: 'relative',
                      background: 'linear-gradient(158deg,#0d0d0d 0%,#1a1a1a 55%,#111 100%)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* hole */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          border: '2px solid #2a2a2a',
                          background: '#0a0a0a',
                        }}
                      />
                    </div>
                    {/* header */}
                    <div style={{ textAlign: 'center', padding: '8px 10px 0' }}>
                      <p style={{ fontSize: 7, color: '#888', letterSpacing: '.18em' }}>
                        OBRIGADO POR ESCOLHER
                      </p>
                      <p
                        style={{
                          fontSize: 11.5,
                          fontWeight: 900,
                          color: '#fff',
                          letterSpacing: '.1em',
                          lineHeight: 1.2,
                        }}
                      >
                        BROTHERS OUTLET!
                      </p>
                      <div
                        style={{
                          height: 1.5,
                          background: '#00b4d8',
                          margin: '4px auto 0',
                          width: '75%',
                        }}
                      />
                    </div>
                    {/* benefits */}
                    <div
                      style={{
                        padding: '5px 10px 0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      {[
                        { icon: '✓', text: 'PRODUTO SELECIONADO COM QUALIDADE' },
                        { icon: '◎', text: 'CONFORTO PARA O DIA A DIA' },
                        { icon: '◈', text: 'ESTILO PARA QUALQUER OCASIÃO' },
                      ].map((b) => (
                        <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 9, color: '#00b4d8', flexShrink: 0 }}>
                            {b.icon}
                          </span>
                          <span
                            style={{
                              fontSize: 6,
                              fontWeight: 600,
                              color: '#ccc',
                              letterSpacing: '.04em',
                            }}
                          >
                            {b.text}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ height: 1, background: '#222', margin: '4px 10px' }} />
                    {/* social */}
                    <div style={{ padding: '0 10px' }}>
                      <p
                        style={{
                          fontSize: 5.5,
                          fontWeight: 700,
                          letterSpacing: '.28em',
                          color: '#00b4d8',
                          marginBottom: 2,
                        }}
                      >
                        SIGA-NOS NAS REDES SOCIAIS
                      </p>
                      <p style={{ fontSize: 6.5, color: '#ccc' }}>⊙ @Brothersoutlet_oficial</p>
                      <p style={{ fontSize: 6.5, color: '#ccc', marginTop: 1 }}>
                        ◉ BAÍA FORMOSA-RN
                      </p>
                    </div>
                    {/* care */}
                    <div style={{ padding: '0 8px' }}>
                      <p
                        style={{
                          fontSize: 5.5,
                          fontWeight: 700,
                          letterSpacing: '.2em',
                          color: '#555',
                          marginBottom: 2,
                        }}
                      >
                        CUIDADOS
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        {['LAVAR À MÃO', 'SEM ALVEJANTE', 'SECAR À SOMBRA', 'SEM FERRO'].map(
                          (label) => (
                            <div
                              key={label}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <div
                                style={{
                                  width: 14,
                                  height: 14,
                                  border: '1px solid #444',
                                  borderRadius: 2,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 4.5,
                                  color: '#555',
                                  textAlign: 'center',
                                  maxWidth: 20,
                                  lineHeight: 1.2,
                                }}
                              >
                                {label}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                    {/* barcode preview */}
                    <div
                      style={{
                        padding: '2px 6px 0',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'flex-end',
                      }}
                    >
                      <svg ref={previewBarcodeSvgRef} style={{ width: '100%' }} />
                    </div>
                    {/* footer */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 10px',
                        borderTop: '1.5px solid #00b4d8',
                        background: 'rgba(0,180,216,.12)',
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '1.5px solid rgba(255,255,255,.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 900,
                          fontStyle: 'italic',
                          color: '#fff',
                        }}
                      >
                        B
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p
                          style={{
                            fontSize: 7,
                            fontWeight: 900,
                            color: '#fff',
                            letterSpacing: '.18em',
                          }}
                        >
                          BROTHERS
                        </p>
                        <p
                          style={{
                            fontSize: 5.5,
                            fontWeight: 700,
                            color: '#00b4d8',
                            letterSpacing: '.35em',
                          }}
                        >
                          OUTLET
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-center text-[11px] text-gray-400">
                Imprima, recorte e coloque na peça · Barras em preto no PDF para escaneamento
              </p>
            </>
          ) : (
            <div className="flex h-40 items-center justify-center text-center text-sm text-gray-400">
              {variants.length === 0
                ? 'Carregando variantes...'
                : 'Selecione uma cor para ver o código de barras.'}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Fechar
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || !activeBarcode || !barcodeReady}
            className="flex items-center gap-2 rounded-lg bg-[#4A6CF7] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3a5ce6] disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {exporting ? 'Abrindo...' : 'Imprimir / Salvar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
