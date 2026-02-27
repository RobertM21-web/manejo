// Guarda/restaura el estado de los <details> por página
const keyBase = 'perfil-details:' + location.pathname;

document.querySelectorAll('details.card').forEach((det, idx) => {
    const key = `${keyBase}:${idx}`;
  // restaurar
    const saved = localStorage.getItem(key);
    if (saved !== null) det.open = saved === '1';

    det.addEventListener('toggle', () => {
    localStorage.setItem(key, det.open ? '1' : '0');
    });
});
