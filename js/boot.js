/* ===================== BOOT SEQUENCE ===================== */
window.startWelcomeBoot = function () {
  const bootScreen = document.getElementById('boot-screen');
  const desktop = document.getElementById('desktop');
  bootScreen.hidden = false;
  let started = false;

  function bootToDesktop() {
    if (started) return;
    started = true;
    bootScreen.classList.add('fade-out');
    setTimeout(() => {
      bootScreen.style.display = 'none';
      desktop.hidden = false;
      DesktopInit();
    }, 600);
  }

  const AUTO_BOOT_MS = 2600;
  const autoTimer = setTimeout(bootToDesktop, AUTO_BOOT_MS);

  bootScreen.addEventListener('click', () => {
    clearTimeout(autoTimer);
    bootToDesktop();
  });
  window.addEventListener('keydown', () => {
    clearTimeout(autoTimer);
    bootToDesktop();
  }, { once: true });
};