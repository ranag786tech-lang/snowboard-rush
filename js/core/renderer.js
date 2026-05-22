drawPlayer: function(ctx, G) {
    const p = G.player;
    if (!p) return;
    ctx.save();
    const cx = p.x + p.width/2;
    const cy = p.y + p.height/2;
    ctx.translate(cx, cy);

    if (p.crashed) {
        // Crashed pose: board sideways, rider tumbled
        ctx.rotate(1.2); // tilted over
        ctx.fillStyle = '#5c3a20';
        ctx.fillRect(-p.width/2 - 10, -5, p.width + 20, 8);
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(-p.width/2 - 5, -4, p.width + 10, 4);
        // Legs in air
        ctx.fillStyle = '#1a3350';
        ctx.fillRect(-10, -20, 6, 15);
        ctx.fillRect(2, -22, 6, 15);
        // Body crumpled
        ctx.fillStyle = '#2a5f8a';
        ctx.fillRect(-12, -10, 20, 16);
        // Head
        ctx.fillStyle = '#f7d9aa';
        ctx.beginPath();
        ctx.arc(4, -16, 8, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
        return;
    }

    const tilt = p.grounded ? 0 : -0.12;
    ctx.rotate(p.rotation + tilt);
    const sx = p.grounded ? 1 : 1.04;
    const sy = p.grounded ? 1 : 0.90;
    ctx.scale(sx, sy);
    ctx.translate(-cx, -cy);

    const px = p.x, py = p.y, pw = p.width, ph = p.height;
    // Board
    ctx.fillStyle = '#5c3a20';
    ctx.fillRect(px - 5, py + ph - 8, pw + 10, 8);
    ctx.fillStyle = '#8b5a2b';
    ctx.fillRect(px - 2, py + ph - 6, pw + 4, 4);
    // Legs
    ctx.fillStyle = '#1a3350';
    ctx.fillRect(px + 6, py + 26, 8, 18);
    ctx.fillRect(px + 16, py + 26, 8, 18);
    // Body
    ctx.fillStyle = '#2a5f8a';
    ctx.fillRect(px + 4, py + 8, 20, 20);
    // Arms — grab pose
    const isGrabbing = TrickSystem.isGrabbing && TrickSystem.isGrabbing();
    ctx.fillStyle = '#1a3350';
    if (isGrabbing) {
        ctx.beginPath();
        ctx.moveTo(px + 4, py + 18);
        ctx.lineTo(px + pw/2, py + ph - 4);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1a3350';
        ctx.stroke();
        ctx.lineWidth = 1;
    } else {
        ctx.fillRect(px - 3, py + 12, 8, 6);
        ctx.fillRect(px + 23, py + 12, 8, 6);
    }
    // Head
    ctx.fillStyle = '#f7d9aa';
    ctx.beginPath();
    ctx.arc(px + 14, py + 4, 10, 0, Math.PI*2);
    ctx.fill();
    // Goggles
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(px + 5, py - 1, 18, 5);
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(px + 7, py, 7, 3);
    ctx.fillRect(px + 16, py, 7, 3);
    // Beanie
    ctx.fillStyle = '#d94040';
    ctx.beginPath();
    ctx.ellipse(px + 14, py - 1, 11, 7, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(px + 7, py - 9, 14, 6);

    if (G.boostActive) {
        ctx.shadowColor = '#00c8ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = 'rgba(0,200,255,0.25)';
        ctx.fillRect(px - 6, py - 4, pw + 12, ph + 8);
        ctx.shadowBlur = 0;
    }
    ctx.restore();
}
