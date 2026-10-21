/* Анимации магазина: появление карточек, «полёт» товара в корзину, подпрыгивание счётчика. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- карточки появляются по очереди, когда доходят до экрана ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        io.unobserve(el);
        el.classList.add('in');
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const prepare = (root) => {
      let i = 0;
      root.querySelectorAll('.product:not([data-m])').forEach((el) => {
        el.dataset.m = '1';
        const r = el.getBoundingClientRect();
        // карточки, которые уже видны при отрисовке, тоже появляются каскадом
        el.style.setProperty('--i', String(i++ % 6));
        el.classList.add('pre');
        io.observe(el);
        void r;
      });
    };
    const main = $('#main') || document.body;
    new MutationObserver(() => prepare(main)).observe(main, { childList: true, subtree: true });
    prepare(main);
  }

  /* ---------- корзина: запоминаем, на какую кнопку нажали ---------- */
  let last = null, cardImg = null;
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    const a = b.dataset.action;
    if (a === 'quick') {
      cardImg = (b.closest('.product') || b.parentElement).querySelector('img');
    } else if (a === 'quick-add') {
      last = { rect: b.getBoundingClientRect(), img: cardImg };
    } else if (a === 'add-detail') {
      last = { rect: b.getBoundingClientRect(), img: document.querySelector('#gallery-main, #gallery-main img, .product-page img, main img') };
    }
  }, true);

  const cartBtn = () => $('.header-actions [data-action="cart"]');
  function fly() {
    const target = cartBtn();
    if (!last || !target) return;
    const from = last.rect, to = target.getBoundingClientRect();
    const size = 54;
    const dot = document.createElement('div');
    dot.className = 'fly';
    if (last.img && last.img.currentSrc) dot.style.backgroundImage = `url("${last.img.currentSrc}")`;
    document.body.append(dot);
    const x0 = from.left + from.width / 2 - size / 2, y0 = from.top + from.height / 2 - size / 2;
    const x1 = to.left + to.width / 2 - size / 2, y1 = to.top + to.height / 2 - size / 2;
    const midX = (x0 + x1) / 2, midY = Math.min(y0, y1) - 90;
    const anim = dot.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
      { transform: `translate(${midX}px, ${midY}px) scale(.8)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.25)`, opacity: 0.2 }
    ], { duration: 720, easing: 'cubic-bezier(.4,.1,.3,1)' });
    anim.onfinish = () => { dot.remove(); bump(); };
    last = null;
  }
  function bump() {
    const t = cartBtn();
    if (!t) return;
    t.classList.remove('bump');
    void t.offsetWidth;
    t.classList.add('bump');
  }

  /* app.js вызывает counts() после каждого изменения корзины: ловим рост числа */
  const wrap = () => {
    if (typeof window.counts !== 'function' || window.counts.__wrapped) return false;
    const orig = window.counts;
    let prev = Number(($('#cart-count') || {}).textContent) || 0;
    const wrapped = function () {
      const r = orig.apply(this, arguments);
      const now = Number(($('#cart-count') || {}).textContent) || 0;
      if (now > prev) fly();
      prev = now;
      return r;
    };
    wrapped.__wrapped = true;
    window.counts = wrapped;
    return true;
  };
  if (!wrap()) addEventListener('load', wrap);
})();
