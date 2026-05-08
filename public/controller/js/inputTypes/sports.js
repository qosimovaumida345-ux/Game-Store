// Sports Game Controller Input
class SportsInput {
  static onInput = null;
  
  static render(container) {
    container.innerHTML = `
      <div class="d-pad">
        <button class="btn-up" onpointerdown="SportsInput.onInput?.('up', true)" onpointerup="SportsInput.onInput?.('up', false)">▲</button>
        <button class="btn-left" onpointerdown="SportsInput.onInput?.('left', true)" onpointerup="SportsInput.onInput?.('left', false)">◀</button>
        <button class="btn-down" onpointerdown="SportsInput.onInput?.('down', true)" onpointerup="SportsInput.onInput?.('down', false)">▼</button>
        <button class="btn-right" onpointerdown="SportsInput.onInput?.('right', true)" onpointerup="SportsInput.onInput?.('right', false)">▶</button>
      </div>
      <button class="action-btn kick" onpointerdown="SportsInput.onInput?.('kick', true)" onpointerup="SportsInput.onInput?.('kick', false)">KICK</button>
      <button class="action-btn" onpointerdown="SportsInput.onInput?.('jump', true)" onpointerup="SportsInput.onInput?.('jump', false)">JUMP</button>
    `;
  }
}
window.SportsInput = SportsInput;