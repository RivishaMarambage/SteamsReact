'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface GoldDustCursorProps {
    className?: string;
}

const GoldDustCursor: React.FC<GoldDustCursorProps> = ({ className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<any[]>([]);
    const cursor = useRef({ x: -100, y: -100 });
    const lastEmit = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const onMouseMove = (e: MouseEvent) => {
            cursor.current.x = e.clientX;
            cursor.current.y = e.clientY;
        };
        
        const createParticle = () => {
            const size = Math.random() * 2.5 + 1;
            const life = Math.random() * 50 + 30; // Increased life
            const angle = Math.random() * Math.PI * 2;
            // Eject particles with less velocity
            const speed = Math.random() * 1.5;
            
            // New color logic to approximate the user's gradient
            // linear-gradient(90deg, #bf953f 0%, #fcf6ba 45%, #b38728 100%);
            // #bf953f -> hsl(45, 53%, 49%)
            // #fcf6ba -> hsl(56, 88%, 85%)
            // #b38728 -> hsl(45, 65%, 43%)
            const hue = Math.random() * 11 + 45; // 45-56
            const saturation = Math.random() * 35 + 53; // 53-88
            const lightness = Math.random() * 42 + 43; // 43-85
            const alpha = Math.random() * 0.5 + 0.5;
            
            particles.current.push({
                x: cursor.current.x,
                y: cursor.current.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (Math.random() * 0.5), // slight upward drift
                size: size,
                life: life,
                initialLife: life,
                color: `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`
            });
        };

        const animate = (timestamp: number) => {
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Throttle particle creation
                if (timestamp - lastEmit.current > 16) { // roughly 60fps
                    if (cursor.current.x > 0 || cursor.current.y > 0) {
                        createParticle();
                    }
                    lastEmit.current = timestamp;
                }

                for (let i = particles.current.length - 1; i >= 0; i--) {
                    const p = particles.current[i];
                    p.vy += 0.02; // Slower gravity
                    p.vx *= 0.98; // Friction
                    p.vy *= 0.98;
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 1;
                    
                    if (p.life <= 0) {
                        particles.current.splice(i, 1);
                        continue;
                    }

                    const opacity = p.life / p.initialLife;
                    ctx.globalAlpha = opacity;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    // Particles shrink over time
                    ctx.arc(p.x, p.y, p.size * opacity, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
            
            animationFrameId = requestAnimationFrame(animate);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', onMouseMove);
        
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className={cn("fixed top-0 left-0 pointer-events-none z-50", className)} />;
};

export default GoldDustCursor;
