// Достаёт каталог магазина из dist/app.js (строки с товарами) и пишет catalog.json для сервера консультанта.
import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8').split('\n');
const start = src.findIndex((l) => l.startsWith('const teaRows'));
const end = src.findIndex((l) => l.startsWith('const baseProducts'));
const head = src.slice(1, 6).join('\n'); // $, esc, photo, images
const body = src.slice(start, end + 1).join('\n');
const products = new Function(`${head}\n${body}\nreturn baseProducts;`)();
const keep = ['id', 'name', 'category', 'type', 'origin', 'notes', 'price', 'taste', 'intensity', 'acidity', 'roast', 'method', 'weight', 'stock', 'ingredients', 'caffeine', 'temperature', 'time'];
const out = products.map((p) => Object.fromEntries(keep.filter((k) => p[k] !== undefined).map((k) => [k, p[k]])));
writeFileSync(new URL('./catalog.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(out.length, 'товаров;', out.filter((p) => p.category === 'Подарки').length, 'наборов');
console.log(JSON.stringify(out[44]), JSON.stringify(out[0]));
