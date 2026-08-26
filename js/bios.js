/* ===================== BIOS BOOT MENU ===================== */
(() => {
  const biosScreen = document.getElementById('bios-screen');
  const biosText = document.getElementById('bios-text');
  const bootMenu = document.getElementById('boot-menu');
  const items = [...bootMenu.querySelectorAll('.boot-menu-item')];
  const enabledItems = items.filter(i => !i.classList.contains('disabled'));

  const LINES = [
    "JB Portfolio BIOS v2.6, An Overachiever Ally",
    "Copyright (C) 2019-2026, sonny creative systems",
    "",
    "JB-WORKSTATION ACPI BIOS Revision 0001",
    "",
    "Main Processor : Vyvanse-Fueled Cortex @ 3.20GHz",
    "Memory Testing : 524,288K of Ideas OK",
    "",
    "IDE Channel 0 Device 0 : PORTFOLIO_2026 (40.0GB)",
    "IDE Channel 0 Device 1 : None",
    "IDE Channel 1 Device 0 : SIDE_PROJECTS (DVD-RW)",
    "IDE Channel 1 Device 1 : None",
    "",
    "Verifying Skillset Integrity ......",
    "Boot from Portfolio Drive..."
  ];

  let selectedIndex = 0;
  let lineIndex = 0;
  let typingTimer = null;
  let skippedTyping = false;
  let finished = false;

  function typeLines() {
    if (lineIndex >= LINES.length) {
      showMenu();
      return;
    }
    biosText.textContent += LINES[lineIndex] + '\n';
    lineIndex++;
    typingTimer = setTimeout(typeLines, skippedTyping ? 0 : 90);
  }

  function skipTyping() {
    if (bootMenu.classList.contains('hidden')) {
      clearTimeout(typingTimer);
      skippedTyping = true;
      biosText.textContent = LINES.join('\n') + '\n';
      lineIndex = LINES.length;
      showMenu();
    }
  }

  function showMenu() {
    bootMenu.classList.remove('hidden');
    updateSelection();
  }

  function updateSelection() {
    items.forEach(i => i.classList.remove('selected'));
    enabledItems[selectedIndex].classList.add('selected');
  }

  function moveSelection(dir) {
    selectedIndex = (selectedIndex + dir + enabledItems.length) % enabledItems.length;
    updateSelection();
  }

  function activateSelected() {
    const item = enabledItems[selectedIndex];
    const action = item.dataset.action;
    if (action === 'install') {
      item.textContent = 'installing swag... already at 100%.';
      setTimeout(proceed, 900);
    } else {
      proceed();
    }
  }

  function proceed() {
    if (finished) return;
    finished = true;
    window.removeEventListener('keydown', onKeyDown);
    biosScreen.classList.add('fade-out');
    setTimeout(() => {
      biosScreen.style.display = 'none';
      window.startWelcomeBoot();
    }, 400);
  }

  function onKeyDown(e) {
    if (finished) return;
    if (bootMenu.classList.contains('hidden')) {
      if (e.key !== 'Tab') skipTyping();
      return;
    }
    if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
    else if (e.key === 'Enter') { e.preventDefault(); activateSelected(); }
  }

  biosScreen.addEventListener('click', (e) => {
    if (finished) return;
    if (bootMenu.classList.contains('hidden')) {
      skipTyping();
      return;
    }
    const item = e.target.closest('.boot-menu-item');
    if (item && !item.classList.contains('disabled')) {
      selectedIndex = enabledItems.indexOf(item);
      updateSelection();
      activateSelected();
    }
  });

  window.addEventListener('keydown', onKeyDown);

  typeLines();
})();