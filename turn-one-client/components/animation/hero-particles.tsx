'use client';

import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

export function NumberOneOutline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- CONFIGURARE GENERALĂ ---
    const CONFIG = {
      color: '225, 29, 72', // Culoarea (format RGB)
      speed: 0.0005,         // VITEZA: Mai mic = mai lent (0.001 e foarte lent și smooth)
      sizePercent: 0.5,    // Cât din ecran ocupă cifra (0.35 = 35%)
      trailLength: 0.3,     // Lungimea cozii
      glowIntensity: 20,    // Intensitatea strălucirii
    };

    // Funcție pentru redimensionare
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // --- DEFINIREA FORMEI PERFECTE ---
    // Definim un "1" de tip Slab Serif (cu bază) folosind coordonate relative la un grid 100x200
    // Asta asigură proporții tipografice corecte.
    const getPerfectShape = (cw: number, ch: number): Point[] => {
      // 1. Calculăm scara bazată pe cea mai mică latură a ecranului (responsive)
      const size = Math.min(cw, ch) * CONFIG.sizePercent;
      
      // Dimensiuni relative (Grid logic: Lățime totală ref 80, Înălțime ref 100)
      const stemW = 16;      // Grosimea piciorului
      const baseW = 60;      // Lățimea bazei
      const baseH = 12;      // Înălțimea bazei
      const beakH = 25;      // Înălțimea ciocului de sus
      const totalH = 100;    // Înălțimea totală

      // Puncte brute (centrate pe 0,0 logic)
      // Desenăm conturul în sensul acelor de ceasornic
      const rawPoints = [
        // Colț dreapta jos al bazei
        { x: baseW / 2, y: totalH / 2 },
        // Colț stânga jos al bazei
        { x: -baseW / 2, y: totalH / 2 },
        // Stânga sus al bazei
        { x: -baseW / 2, y: totalH / 2 - baseH },
        // Îmbinare bază-picior (stânga)
        { x: -stemW / 2, y: totalH / 2 - baseH },
        // Sub cioc (stânga sus pe picior)
        { x: -stemW / 2, y: -totalH / 2 + beakH -5},
        // Vârful ciocului (mult în stânga)
        { x: -stemW / 2 - 20, y: -totalH / 2 + 20}, 
        // Partea de sus a ciocului (colț stânga extrem sus)
        { x: -stemW / 2 - 20, y: -totalH / 2 }, // Vârf ascuțit sus
        // Vârf dreapta sus (capul cifrei)
        { x: stemW / 2, y: -totalH / 2 },
        // Dreapta jos pe picior (până la bază)
        { x: stemW / 2, y: totalH / 2 - baseH },
        // Îmbinare picior-bază (dreapta)
        { x: baseW / 2, y: totalH / 2 - baseH },
      ];

      // Convertim coordonatele relative în pixeli reali și centrăm pe ecran
      const centerX = cw / 2;
      const centerY = ch / 2;
      // Factor de scalare de la unitățile noastre (aprox 100px) la mărimea dorită
      const scaleFactor = size / 100; 

      return rawPoints.map(p => ({
        x: centerX + p.x * scaleFactor,
        y: centerY + p.y * scaleFactor
      }));
    };

    // Funcții utilitare matematice
    const dist = (p1: Point, p2: Point) => Math.hypot(p2.x - p1.x, p2.y - p1.y);

    // Interpolare poziție pe perimetru
    const getPointOnPath = (points: Point[], progress: number): Point => {
      // Calculăm lungimea totală
      let totalLength = 0;
      const segmentLengths: number[] = [];
      
      for (let i = 0; i < points.length; i++) {
        const nextI = (i + 1) % points.length;
        const d = dist(points[i], points[nextI]);
        segmentLengths.push(d);
        totalLength += d;
      }

      let currentDist = progress * totalLength;
      
      for (let i = 0; i < points.length; i++) {
        if (currentDist <= segmentLengths[i]) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          const ratio = currentDist / segmentLengths[i];
          return {
            x: p1.x + (p2.x - p1.x) * ratio,
            y: p1.y + (p2.y - p1.y) * ratio
          };
        }
        currentDist -= segmentLengths[i];
      }
      return points[0];
    };

    // State animație
    let progress = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Obținem punctele (recalculate mereu pt responsivitate perfectă)
      const points = getPerfectShape(canvas.width, canvas.height);

      // 1. Desenăm fundalul conturului (șters, subtil)
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p, i) => i > 0 && ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.strokeStyle = `rgba(${CONFIG.color}, 0.1)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Desenăm Coada (Trail)
      // Folosim mai multe segmente mici pt gradient
      const trailSegments = 100; 
      
      ctx.lineJoin = 'round';
      ctx.lineCap = 'butt'; // Important pentru continuitate între segmente colorate diferit

      for (let i = 0; i < trailSegments; i++) {
        // Calculăm procentul de început și sfârșit al ACESTUI segment mic
        const tHead = i / trailSegments;       // 0 = chiar la cap
        const tTail = (i + 1) / trailSegments; // Spre coadă

        // Calculăm poziția exactă pe perimetru (0.0 la 1.0)
        let pHead = progress - (tHead * CONFIG.trailLength);
        let pTail = progress - (tTail * CONFIG.trailLength);

        // Corecție pentru când trecem de 0 (wrap around)
        if (pHead < 0) pHead += 1;
        if (pTail < 0) pTail += 1;

        // Obținem coordonatele
        const p1 = getPointOnPath(points, pHead);
        const p2 = getPointOnPath(points, pTail);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        // Culoarea: Opacitate maximă la cap (i=0), zero la coadă
        // Folosim un mic boost la alpha pentru a părea solidă
        const alpha = Math.max(0, 1 - (i / trailSegments));
        
        ctx.strokeStyle = `rgba(${CONFIG.color}, ${alpha})`;
        ctx.lineWidth = 3; 

        // Glow doar în prima jumătate a cozii pentru efect de neon
        if (i < 20) {
           ctx.shadowBlur = CONFIG.glowIntensity;
           ctx.shadowColor = `rgba(${CONFIG.color}, 1)`;
        } else {
           ctx.shadowBlur = 0;
        }

        ctx.stroke();
      }
      // 3. Desenăm Capul (Punctul luminos)
    //   const headPos = getPointOnPath(points, progress);
    //   ctx.shadowBlur = CONFIG.glowIntensity + 10;
    //   ctx.shadowColor = '#ffffff';
      
    //   ctx.beginPath();
    //   ctx.arc(headPos.x, headPos.y, 4, 0, Math.PI * 2);
    //   ctx.fillStyle = '#ffffff';
    //   ctx.fill();

      // Reset
      ctx.shadowBlur = 0;

      // Actualizare progres
      progress += CONFIG.speed;
      if (progress >= 1) progress = 0;

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}