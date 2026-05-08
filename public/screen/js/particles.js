// Particle background animation
(function() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('particles-bg');
  if (!container) return;
  
  container.appendChild(canvas);
  canvas.style.cssText = 'width:100%;height:100%;position:absolute;top:0;left:0;';
  
  let w, h;
  const particles = [];
  const connections = [];
  const PARTICLE_COUNT = 60;
  const CONNECTION_DIST = 150;
  
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  
  function init() {
    resize();
    window.addEventListener('resize', resize);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.5 ? 260 : 190 // purple or cyan
      });
    }
    
    animate();
  }
  
  function animate() {
    ctx.clearRect(0, 0, w, h);
    
    // Update & draw particles
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity})`;
      ctx.fill();
      
      // Connections
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < CONNECTION_DIST) {
          const opacity = (1 - dist / CONNECTION_DIST) * 0.15;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `hsla(260, 60%, 50%, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    });
    
    requestAnimationFrame(animate);
  }
  
  init();
})();
