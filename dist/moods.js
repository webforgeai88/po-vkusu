/* Подборки по настроению: переключение вкладок на главной. */
document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-mood]');
  if (!tab || typeof moodSets === 'undefined') return;
  const set = moodSets[Number(tab.dataset.mood)];
  const grid = document.getElementById('mood-grid');
  if (!set || !grid) return;
  document.querySelectorAll('[data-mood]').forEach((b) => {
    const on = b === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  const text = document.getElementById('mood-text');
  if (text) text.textContent = set.text;
  grid.classList.add('swap');
  setTimeout(() => {
    grid.innerHTML = moodCards(set);
    requestAnimationFrame(() => grid.classList.remove('swap'));
  }, 180);
});
