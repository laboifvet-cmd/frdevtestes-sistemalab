// Depois do build: cria dist/artifact.html (sem <html>/<head>/<body>, formato que o link de teste espera).
import fs from 'fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const iBodyReal = html.lastIndexOf('<body>');
const iHead = html.indexOf('<head>') + 6, fHead = html.lastIndexOf('</head>', iBodyReal);
const head = html.slice(iHead, fHead)
  .replace(/<meta charset[^>]*>/, '').replace(/<meta name="viewport"[^>]*>/, '');
const iBody = iBodyReal + 6;
const body = html.slice(iBody, html.lastIndexOf('</body>'));
// o <title> precisa vir primeiro
const titulo = head.match(/<title>[\s\S]*?<\/title>/)[0];
const resto = head.replace(titulo, '');
fs.writeFileSync('dist/artifact.html', titulo + '\n' + resto.trim() + '\n' + body.trim() + '\n');
console.log('dist/artifact.html', (fs.statSync('dist/artifact.html').size / 1024).toFixed(0) + ' KB');
