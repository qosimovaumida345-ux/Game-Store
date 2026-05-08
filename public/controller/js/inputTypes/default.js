// Sports Controller Input Type
const SportsInput = {
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
          <button class="btn-controller btn-a" data-key="kick">KICK</button>
          <button class="btn-controller btn-b" data-key="pass">PASS</button>
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
    });
  },
  
  onInput: null
};

window.SportsInput = SportsInput;

// Arcade Controller Input Type
const ArcadeInput = {
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
          <button class="btn-controller btn-a" data-key="action">A</button>
          <button class="btn-controller btn-b" data-key="menu">MENU</button>
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
    });
  },
  
  onInput: null
};

window.ArcadeInput = ArcadeInput;

// Puzzle Controller Input Type
const PuzzleInput = {
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
          <button class="btn-controller btn-a" data-key="select">SELECT</button>
          <button class="btn-controller btn-b" data-key="hint">HINT</button>
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
    });
  },
  
  onInput: null
};

window.PuzzleInput = PuzzleInput;

// Default Controller Input Type
const DefaultInput = {
  render(container) {
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; max-width: 350px;">
        <button class="btn-controller" data-key="up">▲ UP</button>
        <button class="btn-controller" data-key="down">▼ DOWN</button>
        <button class="btn-controller" data-key="left">◀ LEFT</button>
        <button class="btn-controller" data-key="right">▶ RIGHT</button>
      </div>
      <div class="action-buttons" style="margin-top: 20px;">
        <button class="btn-controller btn-a" data-key="a">A</button>
        <button class="btn-controller btn-b" data-key="b">B</button>
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
    });
  },
  
  onInput: null
};

window.DefaultInput = DefaultInput;