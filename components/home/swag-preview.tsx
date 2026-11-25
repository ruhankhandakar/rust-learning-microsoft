"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Rotate3d } from "lucide-react";

const MODELS = [
  { id: "male", label: "Him", alt: "Man wearing the rs:: T-shirt" },
  { id: "female", label: "Her", alt: "Woman wearing the rs:: T-shirt" },
] as const;
type Who = (typeof MODELS)[number]["id"];

interface Viewer {
  show: (who: Who) => void;
  dispose: () => void;
}

async function createViewer(host: HTMLDivElement, onReady: () => void): Promise<Viewer> {
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
  const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
  const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
  const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);
  Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = controls.maxPolarAngle = Math.PI / 2;
  controls.autoRotate = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 1.6;
  // OrbitControls sets touch-action: none; keep vertical page scrolling on phones.
  renderer.domElement.style.touchAction = "pan-y";

  const draco = new DRACOLoader().setDecoderPath("/draco/");
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const cache = new Map<string, Promise<import("three").Object3D>>();
  const load = (url: string) => {
    if (!cache.has(url)) cache.set(url, loader.loadAsync(url).then((g) => g.scene));
    return cache.get(url)!;
  };

  let current: import("three").Object3D | null = null;
  let wanted: Who | null = null;
  let disposed = false;

  function place(model: import("three").Object3D) {
    if (current) scene.remove(current);
    model.traverse((o) => (o.frustumCulled = false));
    const box = new THREE.Box3().setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));
    const height = box.getSize(new THREE.Vector3()).y;
    camera.position.set(0, 0, (height / 2 / Math.tan((camera.fov * Math.PI) / 360)) * 1.12);
    controls.target.set(0, 0, 0);
    scene.add(model);
    current = model;
    onReady();
  }

  async function show(who: Who) {
    wanted = who;
    const preview = await load(`/3d/${who}-preview.glb`);
    if (disposed || wanted !== who) return;
    place(preview);
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const full = await load(`/3d/${who}-full.glb`);
    if (!disposed && wanted === who) place(full);
  }

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  let visible = true;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
  io.observe(host);
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    show: (who) => void show(who).catch(() => {}),
    dispose() {
      disposed = true;
      renderer.setAnimationLoop(null);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      draco.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export function SwagPreview() {
  const [who, setWho] = useState<Who>("male");
  const [ready, setReady] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const whoRef = useRef<Who>("male");
  const model = MODELS.find((m) => m.id === who)!;

  useEffect(() => {
    const host = hostRef.current!;
    let viewer: Viewer | null = null;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        createViewer(host, () => setReady(true))
          .then((v) => {
            if (cancelled) return v.dispose();
            viewer = viewerRef.current = v;
            v.show(whoRef.current);
          })
          .catch(() => {});
      },
      { rootMargin: "200px" },
    );
    io.observe(host);
    return () => {
      cancelled = true;
      io.disconnect();
      viewer?.dispose();
      viewerRef.current = null;
    };
  }, []);

  function pick(id: Who) {
    setWho(id);
    whoRef.current = id;
    viewerRef.current?.show(id);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative aspect-[900/1300] w-full max-w-[220px] overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_50%_30%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_65%)]">
        <Image
          src={`/3d/${who}-poster.webp`}
          alt={model.alt}
          width={900}
          height={1300}
          unoptimized
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${ready ? "opacity-0" : "opacity-100"}`}
        />
        <div
          ref={hostRef}
          aria-hidden="true"
          className={`absolute inset-0 cursor-grab transition-opacity duration-500 active:cursor-grabbing ${ready ? "opacity-100" : "opacity-0"}`}
        />
        <span title="Drag to turn" className="pointer-events-none absolute left-3 top-3 text-muted-foreground">
          <Rotate3d className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <div className="relative grid grid-cols-2 rounded-full border border-border bg-card p-1" role="group" aria-label="Model">
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary shadow-[0_0_16px_color-mix(in_oklch,var(--primary)_45%,transparent)] transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{ transform: who === "female" ? "translateX(100%)" : "none" }}
        />
        {MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={who === m.id}
            onClick={() => pick(m.id)}
            className={`relative min-h-9 rounded-full px-6 text-sm font-semibold transition-colors ${
              who === m.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
