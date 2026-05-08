// Puzzle Game Controller Input
class PuzzleInput {
  static onInput = null;
  
  static render(container) {
    container.innerHTML = `
      <div class="d-pad">
        <button class="btn-up" onpointerdown="PuzzleInput.onInput?.('up', true)" onpointerup="PuzzleInput.onInput?.('up', false)">▲</button>
        <button class="btn-left" onpointerdown="PuzzleInput.onInput?.('left', true)" onpointerup="PuzzleInput.onInput?.('left', false)">◀</button>
        <button class="btn-down" onpointerdown="PuzzleInput.onInput?.('down', true)" onpointerup="PuzzleInput.onInput?.('down', false)">▼</button>
        <button class="btn-right" onpointerdown="PuzzleInput.onInput?.('right', true)" onpointerup="PuzzleInput.onInput?.('right', false)">▶</button>
      </div>
      <button class="action-btn" onpointerdown="PuzzleInput.onInput?.('select', true)" onpointerup="PuzzleInput.onInput?.('select', false)">SELECT</button>
      <button class="action-btn" onpointerdown="PuzzleInput.onInput?.('back', true)" onpointerup="PuzzleInput.onInput?.('back', false)">BACK</button>
    `;
  }
}
window.PuzzleInput = PuzzleInput;