// Shooter Game Controller Input
class ShooterInput {
  static onInput = null;
  
  static render(container) {
    container.innerHTML = `
      <div class="d-pad">
        <button class="btn-up" onpointerdown="ShooterInput.onInput?.('up', true)" onpointerup="ShooterInput.onInput?.('up', false)">▲</button>
        <button class="btn-left" onpointerdown="ShooterInput.onInput?.('left', true)" onpointerup="ShooterInput.onInput?.('left', false)">◀</button>
        <button class="btn-down" onpointerdown="ShooterInput.onInput?.('down', true)" onpointerup="ShooterInput.onInput?.('down', false)">▼</button>
        <button class="btn-right" onpointerdown="ShooterInput.onInput?.('right', true)" onpointerup="ShooterInput.onInput?.('right', false)">▶</button>
      </div>
      <button class="action-btn fire" onpointerdown="ShooterInput.onInput?.('fire', true)" onpointerup="ShooterInput.onInput?.('fire', false)">FIRE</button>
      <button class="action-btn" onpointerdown="ShooterInput.onInput?.('aim', true)" onpointerup="ShooterInput.onInput?.('aim', false)">AIM</button>
    `;
  }
}
window.ShooterInput = ShooterInput;