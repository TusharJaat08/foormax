// ============================================
// FOORMAX — Main JavaScript
// Interactive Ocean 3D Scene + Interactions
// ============================================

import * as THREE from 'three';

// ─── INTERACTIVE OCEAN 3D SCENE ────────────────────────
function initHeroOcean() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0025);

  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.set(0, 30, 120);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x0a0a1a, 1);

  // --- Sky gradient via a large sphere ---
  const skyGeo = new THREE.SphereGeometry(800, 32, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x000011) },
      bottomColor: { value: new THREE.Color(0x0a1628) },
      offset: { value: 100 },
      exponent: { value: 0.5 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // --- Ocean plane with animated vertex displacement ---
  const oceanSegments = 200;
  const oceanSize = 600;
  const oceanGeo = new THREE.PlaneGeometry(oceanSize, oceanSize, oceanSegments, oceanSegments);
  oceanGeo.rotateX(-Math.PI / 2);

  const oceanMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uDeepColor: { value: new THREE.Color(0x020810) },
      uSurfaceColor: { value: new THREE.Color(0x0a2848) },
      uHighlightColor: { value: new THREE.Color(0x1a5080) },
      uFogColor: { value: new THREE.Color(0x0a0a1a) },
      uFogNear: { value: 50 },
      uFogFar: { value: 400 },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      varying float vElevation;
      varying vec3 vWorldPos;

      // Simplex-like noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec3 pos = position;
        float t = uTime * 0.3;

        // Multiple wave layers
        float wave1 = snoise(vec3(pos.x * 0.015, pos.z * 0.015, t)) * 4.0;
        float wave2 = snoise(vec3(pos.x * 0.03, pos.z * 0.03, t * 1.5)) * 2.0;
        float wave3 = snoise(vec3(pos.x * 0.06, pos.z * 0.06, t * 2.0)) * 0.8;
        float wave4 = snoise(vec3(pos.x * 0.12, pos.z * 0.12, t * 3.0)) * 0.3;

        // Mouse ripple interaction
        float dist = length(pos.xz - uMouse * 150.0);
        float ripple = sin(dist * 0.1 - uTime * 3.0) * exp(-dist * 0.015) * 3.0;

        float elevation = wave1 + wave2 + wave3 + wave4 + ripple;
        pos.y += elevation;

        vElevation = elevation;
        vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uDeepColor;
      uniform vec3 uSurfaceColor;
      uniform vec3 uHighlightColor;
      uniform vec3 uFogColor;
      uniform float uFogNear;
      uniform float uFogFar;
      varying float vElevation;
      varying vec3 vWorldPos;

      void main() {
        // Color based on wave height
        float mixStrength = (vElevation + 4.0) / 10.0;
        vec3 color = mix(uDeepColor, uSurfaceColor, mixStrength);

        // Add highlights on peaks
        float highlight = smoothstep(2.5, 5.0, vElevation);
        color = mix(color, uHighlightColor, highlight * 0.6);

        // Subtle specular-like shimmer
        float shimmer = smoothstep(3.0, 6.0, vElevation) * 0.15;
        color += vec3(shimmer);

        // Distance fog
        float depth = length(vWorldPos);
        float fogFactor = smoothstep(uFogNear, uFogFar, depth);
        color = mix(color, uFogColor, fogFactor);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });

  const ocean = new THREE.Mesh(oceanGeo, oceanMat);
  scene.add(ocean);

  // --- Floating particles (stars/mist) ---
  const particleCount = 500;
  const particleGeo = new THREE.BufferGeometry();
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    particlePositions[i * 3] = (Math.random() - 0.5) * 500;
    particlePositions[i * 3 + 1] = Math.random() * 200 + 10;
    particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 500;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 1.2,
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // --- Ambient & Directional Lights ---
  const ambientLight = new THREE.AmbientLight(0x112244, 0.5);
  scene.add(ambientLight);

  const moonLight = new THREE.DirectionalLight(0x4488cc, 0.8);
  moonLight.position.set(100, 200, -100);
  scene.add(moonLight);

  // Subtle warm horizon glow
  const horizonLight = new THREE.PointLight(0x1a3050, 1.5, 600);
  horizonLight.position.set(0, 5, -200);
  scene.add(horizonLight);

  // --- Mouse Tracking ---
  const mouse = { x: 0, y: 0 };
  const targetMouse = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // --- Handle Resize ---
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Animation Loop ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    // Smooth mouse lerp
    mouse.x += (targetMouse.x - mouse.x) * 0.05;
    mouse.y += (targetMouse.y - mouse.y) * 0.05;

    // Update ocean uniforms
    oceanMat.uniforms.uTime.value = elapsed;
    oceanMat.uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Subtle camera movement
    camera.position.x = Math.sin(elapsed * 0.08) * 8 + mouse.x * 15;
    camera.position.y = 30 + Math.sin(elapsed * 0.15) * 3 + mouse.y * 8;
    camera.lookAt(0, 0, -20);

    // Slowly rotate stars
    particles.rotation.y = elapsed * 0.01;

    renderer.render(scene, camera);
  }

  animate();
}

// ─── SCROLL FADE-IN ANIMATIONS ─────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
}

// ─── LIVE CLOCK (India Time) ───────────────────────────
function initClock() {
  const clockEl = document.getElementById('clock-india');
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = String(indiaTime.getHours()).padStart(2, '0');
    const minutes = String(indiaTime.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}`;
  }

  updateClock();
  setInterval(updateClock, 30000);
}

// ─── NAVBAR SCROLL EFFECT ──────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      navbar.style.mixBlendMode = 'normal';
      navbar.style.background = 'rgba(0, 0, 0, 0.85)';
      navbar.style.backdropFilter = 'blur(12px)';
      navbar.style.webkitBackdropFilter = 'blur(12px)';
    } else {
      navbar.style.mixBlendMode = 'difference';
      navbar.style.background = 'transparent';
      navbar.style.backdropFilter = 'none';
      navbar.style.webkitBackdropFilter = 'none';
    }
  });
}

// ─── SMOOTH NAV SCROLL ─────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── CONTACT FORM ──────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const phone = document.getElementById('form-phone').value;
    const message = document.getElementById('form-message').value;

    console.log('Form submitted:', { name, email, phone, message });

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '[✓ SENT]';
    btn.style.background = '#c0ff00';
    btn.style.color = '#000';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
}

// ─── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHeroOcean();
  initScrollAnimations();
  initClock();
  initNavbar();
  initSmoothScroll();
  initContactForm();
});
