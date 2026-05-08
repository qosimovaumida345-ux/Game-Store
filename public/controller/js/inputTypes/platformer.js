// Platformer Controller Input Type
const PlatformerInput = {
  render(container) {
    container.innerHTML = `
      <div class="dpad-container">
        <div class="dpad">
          <button class="btn-controller up" data-key="up">▲</button>
          <button class="btn-controller left" data-key="left">◀</button>
          <div class="center"></div>
          <button class="btn-controller right" data-key="right">▶</button>
          <button class="btn-controller down" data-key="down">▼</button>
        </div>
        <div class="action-buttons">
          <button class="btn-controller btn-a" data-key="jump">A</button>
          <button class="btn-controller btn-b" data-key="action">B</button>
        </div>
      </div>
    `;
    this.attachEvents(container);
  },
  
  attachEvents(container) {
    const buttons = container.querySelectorAll('.btn-controller');
    buttons.forEach(btn => {
      const key = btn.dataset.key;
      if (!key) return;
      
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('active');
        this.onInput(key, true);
      }, { passive: false });
      
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        this.onInput(key, false);
      }, { passive: false });
      
      btn.addEventListener('mousedown', () => this.onInput(key, true));
      btn.addEventListener('mouseup', () => this.onInput(key, false));
      btn.addEventListener('mouseleave', () => this.onInput(key, false));
    });
  },
  
  onInput: null
};

window.PlatformerInput = PlatformerInput;