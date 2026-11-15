// Gera o PDF a partir das folhas A4 desenhadas na tela (uma imagem nítida por página).
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { salvarArquivo } from './util.js';

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function gerarPdf(elemento, nomeArquivo) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const caixa = document.createElement('div');
  caixa.className = 'pdf-fora-da-tela';
  document.body.appendChild(caixa);
  const raiz = createRoot(caixa);
  try {
    flushSync(() => raiz.render(elemento));
    await document.fonts?.ready;
    // espera as imagens e o paginador terminar de medir
    await Promise.all([...caixa.querySelectorAll('img')].map((im) => (im.complete ? 0 : new Promise((r) => ((im.onload = r), (im.onerror = r))))));
    await espera(120);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await espera(60);
    const paginas = [...caixa.querySelectorAll('.papel-paginas > .papel-pagina')];
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < paginas.length; i++) {
      const canvas = await html2canvas(paginas[i], { scale: 2.2, backgroundColor: '#ffffff', useCORS: true, logging: false });
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, W, H, undefined, 'FAST');
    }
    const blob = pdf.output('blob');
    return await salvarArquivo(nomeArquivo, blob);
  } finally {
    raiz.unmount();
    caixa.remove();
  }
}
