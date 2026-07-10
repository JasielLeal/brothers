'use client'

import { useRef, useEffect, useState } from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import type { Product, ProductVariant, SizeLabel } from '@/features/products/types/product.types'
import { SIZE_SETS } from '@/features/products/types/product.types'

const TAG_BG = '#0a0a0a'

/* ── build self-contained print HTML ──────────────────── */
function buildPrintHtml(product: Product, barcodeSvgStr: string) {
  const logoSrc = `${window.location.origin}/logo.png`
  const qrSrc = `${window.location.origin}/qrcode.png`

  const tagBase = `background:${TAG_BG};-webkit-print-color-adjust:exact;print-color-adjust:exact;`

  const hole = `<div style="display:flex;justify-content:center;padding-top:12px;">
    <div style="width:14px;height:14px;border-radius:50%;background:#fff;"></div>
  </div>`

  const website = `<p style="text-align:center;font-size:7px;font-weight:700;letter-spacing:.12em;color:#fff;font-family:Arial,sans-serif;padding-bottom:14px;">WWW.BROTHERSOUTLET.COM.BR</p>`

  const front = `
  <div style="width:58mm;height:100mm;border-radius:7mm;overflow:hidden;position:relative;flex-shrink:0;
    display:flex;flex-direction:column;${tagBase}">
    ${hole}
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;">
      <img src="${logoSrc}" alt="Brothers" style="width:68px;height:68px;object-fit:contain;" />
      <p style="font-size:14px;font-weight:800;letter-spacing:.02em;color:#fff;font-family:Arial,sans-serif;">BROTHERS OUTLET</p>
    </div>
    ${website}
  </div>`

  const back = `
  <div style="width:58mm;height:100mm;border-radius:7mm;overflow:hidden;position:relative;flex-shrink:0;
    display:flex;flex-direction:column;${tagBase}">
    ${hole}
    <div style="text-align:center;padding-top:14px;">
      <p style="font-size:8px;color:#fff;font-family:Arial,sans-serif;">Obrigado por escolher</p>
      <p style="margin-top:2px;font-size:12px;font-weight:800;letter-spacing:.02em;color:#fff;font-family:Arial,sans-serif;">BROTHERS OUTLET</p>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;">
      <div style="background:#fff;border-radius:6px;padding:6px;line-height:0;">
        <img src="${qrSrc}" alt="QR Code" style="width:70px;height:70px;display:block;" />
      </div>
      <p style="font-size:7.5px;color:#fff;font-family:Arial,sans-serif;">@brothersoutlet_oficial</p>
      <div style="background:#fff;border-radius:6px;padding:5px 6px 2px;width:78%;display:flex;justify-content:center;">
        ${barcodeSvgStr}
      </div>
    </div>
    ${website}
  </div>`

  // Tile front/back cards (not paired — any front matches any back for the
  // same barcode) to fill exactly one A4 sheet: 3 columns × 2 rows of
  // 58×100mm tags fit an A4 portrait page with an 8mm margin.
  const tiles = Array.from({ length: 3 }, () => front + back).join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Etiqueta — ${product.name}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
    @page{size:A4 portrait;margin:8mm;}
    body{font-family:Arial,sans-serif;background:#d1d5db;padding:6mm;}
    .sheet{display:flex;flex-wrap:wrap;justify-content:flex-start;align-content:flex-start;gap:4mm;}
    .sheet > div{page-break-inside:avoid;break-inside:avoid;}
    @media print{body{background:#fff;}}
  </style>
</head>
<body><div class="sheet">${tiles}</div></body>
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

  const isUniqueSize = product.category.sizeSet === 'UNIQUE'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSize(isUniqueSize ? SIZE_SETS.UNIQUE[0] : '')
  }, [selectedVariant?.id, isUniqueSize])

  const availableSizes = selectedVariant
    ? SIZE_SETS[product.category.sizeSet].filter(
        (s) => (selectedVariant.sizes.find((sz) => sz.size === s)?.stock ?? 0) > 0
      )
    : []

  function stockFor(size: SizeLabel) {
    return selectedVariant?.sizes.find((sz) => sz.size === size)?.stock ?? 0
  }

  const activeBarcode = selectedVariant?.barcode ?? null

  useEffect(() => {
    if (!activeBarcode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBarcodeReady(false)
      return
    }
    if (!previewBarcodeSvgRef.current) return
    try {
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
    } catch {
      setBarcodeReady(false)
    }
  }, [activeBarcode])

  function handleExport() {
    if (!activeBarcode) return
    setExporting(true)

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
            {selectedVariant && !isUniqueSize && (
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
                      background: '#0a0a0a',
                      display: 'flex',
                      flexDirection: 'column',
                      flexShrink: 0,
                    }}
                  >
                    {/* hole */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                      <div
                        style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff' }}
                      />
                    </div>
                    {/* logo */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                      }}
                    >
                      <img
                        src="/logo.png"
                        alt="Brothers"
                        style={{ width: 64, height: 64, objectFit: 'contain' }}
                      />
                      <p style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>
                        BROTHERS OUTLET
                      </p>
                    </div>
                    <p
                      style={{
                        textAlign: 'center',
                        fontSize: 6.5,
                        fontWeight: 700,
                        letterSpacing: '.12em',
                        color: '#fff',
                        paddingBottom: 14,
                      }}
                    >
                      WWW.BROTHERSOUTLET.COM.BR
                    </p>
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
                      background: '#0a0a0a',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* hole */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                      <div
                        style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff' }}
                      />
                    </div>
                    {/* header */}
                    <div style={{ textAlign: 'center', paddingTop: 14 }}>
                      <p style={{ fontSize: 7.5, color: '#fff' }}>Obrigado por escolher</p>
                      <p style={{ marginTop: 2, fontSize: 11, fontWeight: 800, color: '#fff' }}>
                        BROTHERS OUTLET
                      </p>
                    </div>
                    {/* qr + barcode */}
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: 6,
                          padding: 6,
                          lineHeight: 0,
                        }}
                      >
                        <img
                          src="/qrcode.png"
                          alt="QR Code"
                          style={{ width: 64, height: 64, display: 'block' }}
                        />
                      </div>
                      <p style={{ fontSize: 7, color: '#fff' }}>@brothersoutlet_oficial</p>
                      <div
                        style={{
                          background: '#fff',
                          borderRadius: 6,
                          padding: '4px 6px 2px',
                          width: '78%',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        <svg ref={previewBarcodeSvgRef} style={{ width: '100%' }} />
                      </div>
                    </div>
                    <p
                      style={{
                        textAlign: 'center',
                        fontSize: 6.5,
                        fontWeight: 700,
                        letterSpacing: '.12em',
                        color: '#fff',
                        paddingBottom: 14,
                      }}
                    >
                      WWW.BROTHERSOUTLET.COM.BR
                    </p>
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
