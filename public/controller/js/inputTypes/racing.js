// Racing Controller Input Type
const RacingInput = {
  render(container) {
    container.innerHTML = `
      <div class="joystick-container">
        <div class="joystick-area" id="joystick-area">
          <div class="joystick-knob" id="joystick-knob"></div>
        </div>
      </div>
      <div class="action-buttons">
        <button class="btn-controller btn-a" data-key="brake">BRAKE</button>
        <button class="btn-controller btn-b" data-key="nitro">NITRO</button>
      </div>
    `;
    this.attachJoystickEvents(container);
    this.attachButtonEvents(container);
  },
  
  joystickArea: null,
  knob: null,
  active: false,
  
  attachJoystickEvents(container) {
    this.joystickArea = container.querySelector('#joystick-area');
    this.knob = container.querySelector('#joystick-knob');
    
    const start = (e) => {
      e.preventDefault();
      this.active = true;
    };
    
    const move = (e) => {
      if (!this.active) return;
      e.preventDefault();
      
      const touch = e.touches ? e.touches[0] : e;
      const rect = this.joystickArea.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      
      const maxDist = 60;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }
      
      this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      
      this.onInput('joystick', { x: dx / maxDist, y: dy / maxDist });
    };
    
    const end = (e) => {
      e.preventDefault();
      this.active = false;
      this.knob.style.transform = 'translate(-50%, -50%)';
      this.onInput('joystick', { x: 0, y: 0 });
    };
    
    this.joystickArea.addEventListener('touchstart', start, { passive: false });
    this.joystickArea.addEventListener('mousedown', start);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('mousemove', move);
    document.addEventListener('touchend', end, { passive: false });
    document.addEventListener('mouseup', end);
  },
  
  attachButtonEvents(container) {
    const buttons = container.querySelectorAll('.btn-controller');
    buttons.forEach(btn => {
      const key = btn.dataset.key;
      
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

window.RacingInput = RacingInput;