/* ─────────────────────────────────────────────────────────────────────────────
   main.js — shared across all v2 pages
   Handles: WebGL background, navigation toggle, scroll effects
───────────────────────────────────────────────────────────────────────────── */

/* ── WebGL fog / cursor glow ── */
(function () {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;
    const gl = canvas.getContext('webgl');

    function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();
    if (!gl) return;

    const vs = `attribute vec4 aPos;void main(){gl_Position=aPos;}`;
    const fs = `precision mediump float;
    uniform vec2 u_res;uniform float u_time;uniform vec2 u_mouse;
    float random(vec2 st){return fract(sin(dot(st,vec2(12.9898,78.233)))*43758.5453);}
    float noise(vec2 st){vec2 i=floor(st),f=fract(st);float a=random(i),b=random(i+vec2(1,0)),c=random(i+vec2(0,1)),d=random(i+vec2(1,1));vec2 u=f*f*(3.0-2.0*f);return mix(a,b,u.x)+(c-a)*u.y*(1.0-u.x)+(d-b)*u.x*u.y;}
    float fbm(vec2 st){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*noise(st);st*=2.0;a*=0.5;}return v;}
    void main(){
        vec2 st=gl_FragCoord.xy/u_res;st.x*=u_res.x/u_res.y;
        vec2 q=vec2(fbm(st+0.0*u_time),fbm(st+vec2(1.0)));
        vec2 r=vec2(fbm(st+q+vec2(1.7,9.2)+0.15*u_time),fbm(st+q+vec2(8.3,2.8)+0.126*u_time));
        float f=fbm(st+r);
        vec3 col=mix(vec3(0.05,0.05,0.07),vec3(0.16,0.16,0.22),clamp(f*f*4.0,0.0,1.0));
        vec2 mn=u_mouse/u_res;if(mn.x==0.0&&mn.y==0.0)mn=vec2(0.5,0.5);
        float d=distance(st,vec2(mn.x*(u_res.x/u_res.y),1.0-mn.y));
        vec3 crimson=vec3(1.0,0.1,0.23);
        col+=crimson*(exp(-d*3.0)*0.6*f*1.5)+vec3(1.0)*(exp(-d*10.0)*0.4*f);
        gl_FragColor=vec4(col,1.0);}`;

    function mk(t, s) {
        const sh = gl.createShader(t);
        gl.shaderSource(sh, s);
        gl.compileShader(sh);
        return sh;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]), gl.STATIC_DRAW);

    const aPos   = gl.getAttribLocation(prog, 'aPos');
    const uRes   = gl.getUniformLocation(prog, 'u_res');
    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mx = 0, my = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    (function render(now) {
        now *= 0.001;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(aPos);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.uniform1f(uTime, now);
        gl.uniform2f(uMouse, mx, my);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        requestAnimationFrame(render);
    })(0);
})();

/* ── Navigation toggle (mobile) ── */
const toggle   = document.getElementById('menu-toggle');
const navLinks = document.getElementById('nav-links');

if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('active');
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open);
    });
}

/* Exposed so inline onclick="closeMenu()" on anchor tags still works */
function closeMenu() {
    if (!navLinks || !toggle) return;
    navLinks.classList.remove('active');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
}

/* Close menu when any nav link is clicked (covers dropdown items too) */
if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

/* ── Scroll — nav shrink + breadcrumb follow + hide scroll cue ── */
const scrollCue   = document.getElementById('scroll-cue');
const breadcrumb  = document.querySelector('.page-breadcrumb');

window.addEventListener('scroll', () => {
    const nav      = document.getElementById('main-nav');
    const scrolled = scrollY > 50;

    if (nav) {
        nav.style.height     = scrolled ? '60px'             : 'var(--nav-h)';
        nav.style.background = scrolled ? 'rgba(5,5,7,0.97)' : 'rgba(5,5,7,0.82)';
    }
    if (breadcrumb) {
        breadcrumb.style.top = scrolled ? '60px' : 'var(--nav-h)';
    }
    if (scrollCue) scrollCue.classList.toggle('is-hidden', scrollY > 60);
}, { passive: true });

