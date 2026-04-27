import { memo, useEffect, useRef } from 'react';

function getAnimationConfig(width, isDarkTheme) {
  const isMobile = width < 768;

  if (!isDarkTheme) {
    return {
      isDarkTheme,
      isMobile,
      particles: isMobile ? 30 : 58,
      dust: isMobile ? 24 : 52,
      maxLineDistance: isMobile ? 70 : 96,
      maxLinesPerParticle: 2,
      dotMin: isMobile ? 0.55 : 0.72,
      dotMax: isMobile ? 1.2 : 1.45,
      speedMin: 0.018,
      speedMax: isMobile ? 0.05 : 0.075,
      lineOpacity: isMobile ? 0.028 : 0.045,
      glowOpacity: isMobile ? 0.16 : 0.24,
      mouseRadius: 0,
      mouseForce: 0,
      colors: ['13, 148, 136', '14, 165, 233', '59, 130, 246', '139, 92, 246', '16, 185, 129'],
      dustColor: '148, 163, 184',
      dustAlphaMin: 0.014,
      dustAlphaMax: 0.05,
      backgroundStops: [
        [0, '#eff5fb'],
        [0.4, '#f8fbff'],
        [0.72, '#eef4fb'],
        [1, '#e7eef7']
      ],
      upperGlow: {
        x: 0.22,
        y: 0.12,
        radius: 0.54,
        stops: ['rgba(16, 185, 129, 0.075)', 'rgba(56, 189, 248, 0.028)', 'rgba(0, 0, 0, 0)']
      },
      rightGlow: {
        x: 0.82,
        y: 0.24,
        driftX: 16,
        driftY: 14,
        radius: 0.48,
        stops: ['rgba(139, 92, 246, 0.05)', 'rgba(59, 130, 246, 0.022)', 'rgba(0, 0, 0, 0)']
      },
      lowerGlow: {
        x: 0.14,
        y: 0.9,
        radius: 0.42,
        stops: ['rgba(45, 212, 191, 0.045)', 'rgba(56, 189, 248, 0.018)', 'rgba(0, 0, 0, 0)']
      },
      vignette: {
        inner: 0.2,
        outer: 0.78,
        stops: ['rgba(255, 255, 255, 0)', 'rgba(203, 213, 225, 0.18)']
      },
      pulse: {
        centerY: 0.16,
        radius: 58,
        wobble: 6,
        spread: 2,
        stops: ['rgba(56, 189, 248, 0.022)', 'rgba(16, 185, 129, 0.012)', 'rgba(0, 0, 0, 0)']
      }
    };
  }

  return {
    isDarkTheme,
    isMobile,
    particles: isMobile ? 52 : 108,
    dust: isMobile ? 56 : 130,
    maxLineDistance: isMobile ? 84 : 118,
    maxLinesPerParticle: 2,
    dotMin: isMobile ? 0.7 : 0.85,
    dotMax: isMobile ? 1.55 : 1.85,
    speedMin: 0.035,
    speedMax: isMobile ? 0.09 : 0.14,
    lineOpacity: isMobile ? 0.085 : 0.12,
    glowOpacity: isMobile ? 0.46 : 0.58,
    mouseRadius: isMobile ? 0 : 72,
    mouseForce: 0.08,
    colors: ['0, 225, 201', '40, 181, 255', '82, 134, 255', '149, 107, 255', '38, 214, 154'],
    dustColor: '186, 225, 255',
    dustAlphaMin: 0.035,
    dustAlphaMax: 0.1,
    backgroundStops: [
      [0, '#07141d'],
      [0.35, '#081a28'],
      [0.68, '#0a1730'],
      [1, '#06111a']
    ],
    upperGlow: {
      x: 0.22,
      y: 0.14,
      radius: 0.62,
      stops: ['rgba(0, 214, 177, 0.11)', 'rgba(0, 138, 255, 0.055)', 'rgba(0, 0, 0, 0)']
    },
    rightGlow: {
      x: 0.82,
      y: 0.24,
      driftX: 24,
      driftY: 20,
      radius: 0.56,
      stops: ['rgba(132, 99, 255, 0.11)', 'rgba(0, 173, 255, 0.04)', 'rgba(0, 0, 0, 0)']
    },
    lowerGlow: {
      x: 0.16,
      y: 0.92,
      radius: 0.48,
      stops: ['rgba(24, 191, 130, 0.075)', 'rgba(0, 132, 255, 0.03)', 'rgba(0, 0, 0, 0)']
    },
    vignette: {
      inner: 0.18,
      outer: 0.8,
      stops: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.32)']
    },
    pulse: {
      centerY: 0.18,
      radius: 82,
      wobble: 10,
      spread: 2.4,
      stops: ['rgba(0, 214, 177, 0.055)', 'rgba(0, 164, 255, 0.025)', 'rgba(0, 0, 0, 0)']
    }
  };
}

function FintechCosmicBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext('2d', { alpha: false, desynchronized: true });

    if (!context) {
      return undefined;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = {
      x: 0,
      y: 0,
      active: false
    };
    const getIsDarkTheme = () => document.documentElement.classList.contains('dark');

    let width = 0;
    let height = 0;
    let dpr = 1;
    let centerX = 0;
    let centerY = 0;
    let time = 0;
    let animationFrameId = 0;
    let running = !document.hidden;
    let isDarkTheme = getIsDarkTheme();
    let config = getAnimationConfig(window.innerWidth, isDarkTheme);
    let particles = [];
    let dust = [];

    function rand(min, max) {
      return Math.random() * (max - min) + min;
    }

    class Particle {
      constructor() {
        this.x = rand(0, width);
        this.y = rand(0, height);
        this.r = rand(config.dotMin, config.dotMax);
        this.baseR = this.r;

        const angle = Math.random() * Math.PI * 2;
        const speed = rand(config.speedMin, config.speedMax);

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.phase = Math.random() * Math.PI * 2;
        this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
      }

      update() {
        this.x += this.vx + Math.sin(time * 0.003 + this.y * 0.0045) * 0.018;
        this.y += this.vy + Math.cos(time * 0.003 + this.x * 0.0045) * 0.018;

        if (this.x < this.r) {
          this.x = this.r;
          this.vx = Math.abs(this.vx);
        }

        if (this.x > width - this.r) {
          this.x = width - this.r;
          this.vx = -Math.abs(this.vx);
        }

        if (this.y < this.r) {
          this.y = this.r;
          this.vy = Math.abs(this.vy);
        }

        if (this.y > height - this.r) {
          this.y = height - this.r;
          this.vy = -Math.abs(this.vy);
        }

        if (pointer.active && config.mouseRadius > 0) {
          const dx = this.x - pointer.x;
          const dy = this.y - pointer.y;
          const distance = Math.hypot(dx, dy);

          if (distance > 0.01 && distance < config.mouseRadius) {
            const force = ((config.mouseRadius - distance) / config.mouseRadius) * config.mouseForce;
            this.x += (dx / distance) * force;
            this.y += (dy / distance) * force;
          }
        }

        this.phase += 0.012;
        this.r = this.baseR + Math.sin(this.phase) * 0.12;
      }

      draw() {
        context.beginPath();
        context.shadowBlur = 10;
        context.shadowColor = `rgba(${this.color}, ${config.glowOpacity})`;
        context.fillStyle = `rgba(${this.color}, 0.72)`;
        context.arc(this.x, this.y, Math.max(0.45, this.r), 0, Math.PI * 2);
        context.fill();
        context.shadowBlur = 0;
      }
    }

    class DustParticle {
      constructor() {
        this.x = rand(0, width);
        this.y = rand(0, height);
        this.r = rand(0.2, 0.65);
        this.alpha = rand(config.dustAlphaMin, config.dustAlphaMax);
        this.phase = Math.random() * Math.PI * 2;
        this.speed = rand(0.0015, 0.0055);
      }

      update() {
        this.phase += this.speed;
      }

      draw() {
        const alpha = Math.max(0.015, this.alpha + Math.sin(this.phase) * 0.025);
        context.beginPath();
        context.fillStyle = `rgba(${config.dustColor}, ${alpha})`;
        context.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        context.fill();
      }
    }

    function createParticles() {
      const areaLimit = Math.floor((width * height) / 11000);
      const count = Math.min(config.particles, Math.max(28, areaLimit));

      particles = Array.from({ length: count }, () => new Particle());
    }

    function createDust() {
      const areaLimit = Math.floor((width * height) / 9500);
      const count = Math.min(config.dust, Math.max(24, areaLimit));

      dust = Array.from({ length: count }, () => new DustParticle());
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      centerX = width / 2;
      centerY = height / 2;
      config = getAnimationConfig(width, isDarkTheme);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      createParticles();
      createDust();
    }

    function drawBackground() {
      const backgroundGradient = context.createLinearGradient(0, 0, width, height);
      for (const [stop, color] of config.backgroundStops) {
        backgroundGradient.addColorStop(stop, color);
      }

      context.fillStyle = backgroundGradient;
      context.fillRect(0, 0, width, height);

      const upperGlow = context.createRadialGradient(
        width * config.upperGlow.x,
        height * config.upperGlow.y,
        0,
        width * config.upperGlow.x,
        height * config.upperGlow.y,
        Math.max(width, height) * config.upperGlow.radius
      );
      upperGlow.addColorStop(0, config.upperGlow.stops[0]);
      upperGlow.addColorStop(0.45, config.upperGlow.stops[1]);
      upperGlow.addColorStop(1, config.upperGlow.stops[2]);

      context.fillStyle = upperGlow;
      context.fillRect(0, 0, width, height);

      const rightGlowX = width * config.rightGlow.x + Math.sin(time * 0.0015) * config.rightGlow.driftX;
      const rightGlowY = height * config.rightGlow.y + Math.cos(time * 0.0012) * config.rightGlow.driftY;
      const rightGlow = context.createRadialGradient(
        rightGlowX,
        rightGlowY,
        0,
        rightGlowX,
        rightGlowY,
        Math.max(width, height) * config.rightGlow.radius
      );

      rightGlow.addColorStop(0, config.rightGlow.stops[0]);
      rightGlow.addColorStop(0.45, config.rightGlow.stops[1]);
      rightGlow.addColorStop(1, config.rightGlow.stops[2]);

      context.fillStyle = rightGlow;
      context.fillRect(0, 0, width, height);

      const lowerGlow = context.createRadialGradient(
        width * config.lowerGlow.x,
        height * config.lowerGlow.y,
        0,
        width * config.lowerGlow.x,
        height * config.lowerGlow.y,
        Math.max(width, height) * config.lowerGlow.radius
      );

      lowerGlow.addColorStop(0, config.lowerGlow.stops[0]);
      lowerGlow.addColorStop(0.5, config.lowerGlow.stops[1]);
      lowerGlow.addColorStop(1, config.lowerGlow.stops[2]);

      context.fillStyle = lowerGlow;
      context.fillRect(0, 0, width, height);

      const vignette = context.createRadialGradient(
        centerX,
        centerY,
        Math.min(width, height) * config.vignette.inner,
        centerX,
        centerY,
        Math.max(width, height) * config.vignette.outer
      );
      vignette.addColorStop(0, config.vignette.stops[0]);
      vignette.addColorStop(1, config.vignette.stops[1]);

      context.fillStyle = vignette;
      context.fillRect(0, 0, width, height);
    }

    function drawPulse() {
      context.save();
      context.globalCompositeOperation = 'lighter';

      const pulseRadius = config.pulse.radius + Math.sin(time * 0.012) * config.pulse.wobble;
      const pulse = context.createRadialGradient(
        centerX,
        height * config.pulse.centerY,
        0,
        centerX,
        height * config.pulse.centerY,
        pulseRadius * config.pulse.spread
      );

      pulse.addColorStop(0, config.pulse.stops[0]);
      pulse.addColorStop(0.45, config.pulse.stops[1]);
      pulse.addColorStop(1, config.pulse.stops[2]);

      context.fillStyle = pulse;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    function connectParticles() {
      context.save();
      context.globalCompositeOperation = 'lighter';

      const connectionCounts = new Array(particles.length).fill(0);

      for (let i = 0; i < particles.length; i += 1) {
        const nearby = [];

        for (let j = i + 1; j < particles.length; j += 1) {
          if (connectionCounts[i] >= config.maxLinesPerParticle || connectionCounts[j] >= config.maxLinesPerParticle) {
            continue;
          }

          const distance = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);

          if (distance < config.maxLineDistance) {
            nearby.push({ index: j, distance });
          }
        }

        nearby.sort((left, right) => left.distance - right.distance);

        for (let k = 0; k < nearby.length; k += 1) {
          if (connectionCounts[i] >= config.maxLinesPerParticle) {
            break;
          }

          const { index, distance } = nearby[k];

          if (connectionCounts[index] >= config.maxLinesPerParticle) {
            continue;
          }

          const opacity = (1 - distance / config.maxLineDistance) * config.lineOpacity;
          const gradient = context.createLinearGradient(particles[i].x, particles[i].y, particles[index].x, particles[index].y);

          gradient.addColorStop(0, `rgba(0, 225, 201, ${opacity})`);
          gradient.addColorStop(0.52, `rgba(48, 165, 255, ${opacity * 0.92})`);
          gradient.addColorStop(1, `rgba(149, 107, 255, ${opacity * 0.84})`);

          context.beginPath();
          context.strokeStyle = gradient;
          context.lineWidth = config.isMobile ? 0.55 : 0.72;
          context.moveTo(particles[i].x, particles[i].y);
          context.lineTo(particles[index].x, particles[index].y);
          context.stroke();

          connectionCounts[i] += 1;
          connectionCounts[index] += 1;
        }
      }

      context.restore();
    }

    function renderFrame() {
      drawBackground();

      for (const dustParticle of dust) {
        dustParticle.update();
        dustParticle.draw();
      }

      drawPulse();

      for (const particle of particles) {
        particle.update();
        particle.draw();
      }

      connectParticles();
    }

    function stopAnimation() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    }

    function animate() {
      if (!running) {
        animationFrameId = 0;
        return;
      }

      time += 1;
      renderFrame();
      animationFrameId = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (animationFrameId || !running || prefersReducedMotion.matches) {
        return;
      }

      animationFrameId = window.requestAnimationFrame(animate);
    }

    function handleResize() {
      resize();
      renderFrame();
      startAnimation();
    }

    function handlePointerMove(event) {
      if (config.isMobile) {
        return;
      }

      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    }

    function handlePointerExit() {
      pointer.active = false;
    }

    function handleVisibilityChange() {
      running = !document.hidden;

      if (!running) {
        stopAnimation();
        return;
      }

      renderFrame();
      startAnimation();
    }

    function handleMotionPreferenceChange() {
      stopAnimation();
      renderFrame();
      startAnimation();
    }

    function handleThemeChange() {
      const nextIsDarkTheme = getIsDarkTheme();

      if (nextIsDarkTheme === isDarkTheme) {
        return;
      }

      isDarkTheme = nextIsDarkTheme;
      resize();
      renderFrame();
      startAnimation();
    }

    const themeObserver = new MutationObserver(handleThemeChange);

    resize();
    renderFrame();
    startAnimation();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointercancel', handlePointerExit);
    window.addEventListener('blur', handlePointerExit);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    prefersReducedMotion.addEventListener('change', handleMotionPreferenceChange);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      stopAnimation();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointercancel', handlePointerExit);
      window.removeEventListener('blur', handlePointerExit);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      prefersReducedMotion.removeEventListener('change', handleMotionPreferenceChange);
      themeObserver.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="fintech-cosmic-background" aria-hidden="true" />;
}

export default memo(FintechCosmicBackground);
