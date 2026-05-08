// Arcade Game Controller Input
class ArcadeInput {
  static onInput = null;
  
  static render(container) {
    container.innerHTML = `
      <div class="d-pad">
        <button class="btn-up" onpointerdown="ArcadeInput.onInput?.('up', true)" onpointerup="ArcadeInput.onInput?.('up', false)">▲</button>
        <button class="btn-left" onpointerdown="ArcadeInput.onInput?.('left', true)" onpointerup="ArcadeInput.onInput?.('left', false)">◀</button>
        <button class="btn-down" onpointerdown="ArcadeInput.onInput?.('down', true)" onpointerup="ArcadeInput.onInput?.('down', false)">▼</button>
        <button class="btn-right" onpointerdown="ArcadeInput.onInput?.('right', true)" onpointerup="ArcadeInput.onInput?.('right', false)">▶</button>
      </div>
      <button class="action-btn a-btn" onpointerdown="ArcadeInput.onInput?.('a', true)" onpointerup="ArcadeInput.onInput?.('a', false)">A</button>
      <button class="action-btn b-btn" onpointerdown="ArcadeInput.onInput?.('b', true)" onpointerup="ArcadeInput.onInput?.('b', false)">B</button>
    `;
  }
}
window.ArcadeInput = ArcadeInput;