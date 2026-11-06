"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE_TYPES from "three";

/**
 * Visor 3D de los modelos GLB basado en three.js, con la misma calidad de
 * visionado que el visor de referencia (visor_botella.html):
 *
 *  - Entorno PBR generado con RoomEnvironment + PMREMGenerator, imprescindible
 *    para que se aprecien transmission/clearcoat (vidrio de la botella).
 *  - Tone mapping ACES Filmic con exposición 1.1.
 *  - Fondo degradado de estudio (CanvasTexture) visible a través del vidrio.
 *  - Encuadre automático (FOV 35°, distancia 1,7× el semidiámetro) y
 *    OrbitControls con amortiguación (rueda=zoom, clic izq=girar, clic der=mover).
 *
 * Se importa dinámicamente para evitar problemas de SSR y no penalizar el
 * primer render. Todos los recursos GPU se liberan al desmontar o cambiar de src.
 */
export function ModelViewer({
  src,
  alt,
  fill = false,
}: {
  src: string;
  alt: string;
  /** fill=true: ocupa todo el contenedor padre (modo maximizado) en lugar de altura fija */
  fill?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    let dispose: (() => void) | null = null;
    setLoaded(false);
    setFailed(false);

    (async () => {
      try {
        const THREE = await import("three");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { DRACOLoader } = await import("three/examples/jsm/loaders/DRACOLoader.js");
        const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
        const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
        if (cancelled) return;

        const width = container.clientWidth || 640;
        const height = container.clientHeight || 480;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.1;
        renderer.domElement.style.display = "block";
        renderer.domElement.style.touchAction = "none";
        renderer.domElement.setAttribute("aria-label", alt);
        renderer.domElement.setAttribute("role", "img");

        const scene = new THREE.Scene();

        // Fondo degradado de estudio (visible a través del transmission del vidrio)
        const cv = document.createElement("canvas");
        cv.width = 2;
        cv.height = 512;
        const ctx = cv.getContext("2d");
        if (ctx) {
          const grad = ctx.createLinearGradient(0, 0, 0, 512);
          grad.addColorStop(0, "#eef1f4");
          grad.addColorStop(0.6, "#c9d2d9");
          grad.addColorStop(1, "#9aa5ad");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 2, 512);
        }
        const bgTex = new THREE.CanvasTexture(cv);
        bgTex.colorSpace = THREE.SRGBColorSpace;
        scene.background = bgTex;

        // Entorno PBR (imprescindible para ver transmission/clearcoat)
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTexture;

        const camera = new THREE.PerspectiveCamera(35, width / height, 0.01, 100);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        let model: THREE_TYPES.Object3D | null = null;

        // Encuadre automático idéntico al visor de referencia
        function frame(obj: THREE_TYPES.Object3D) {
          const box = new THREE.Box3().setFromObject(obj);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const fov = camera.fov * Math.PI / 180;
          const dist = (maxDim / (2 * Math.tan(fov / 2))) * 1.7;
          camera.near = dist / 100;
          camera.far = dist * 20;
          camera.updateProjectionMatrix();
          camera.position.set(
            center.x + dist * 0.35,
            center.y + dist * 0.22,
            center.z + dist * 0.9,
          );
          controls.target.copy(center);
          controls.update();
        }

        function disposeModel(obj: THREE_TYPES.Object3D) {
          obj.traverse((child) => {
            const mesh = child as THREE_TYPES.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
            for (const m of mats) {
              for (const v of Object.values(m)) {
                if (v && (v as THREE_TYPES.Texture).isTexture) (v as THREE_TYPES.Texture).dispose();
              }
              m.dispose();
            }
          });
        }

        // Decodificador DRACO local (algunos GLB del catálogo, p. ej. suero.glb,
        // usan KHR_draco_mesh_compression). Sin dependencia de CDN: funciona offline.
        const draco = new DRACOLoader();
        draco.setDecoderPath("/draco/");
        const loader = new GLTFLoader();
        loader.setDRACOLoader(draco);

        loader.load(
          src,
          (gltf) => {
            if (cancelled) {
              disposeModel(gltf.scene);
              return;
            }
            model = gltf.scene;
            scene.add(model);
            frame(model);
            setLoaded(true);
          },
          undefined,
          () => !cancelled && setFailed(true),
        );

        // Redimensionado responsivo del contenedor (tarjeta / maximizado)
        const onResize = () => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (w === 0 || h === 0) return;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(container);

        renderer.setAnimationLoop(() => {
          controls.update();
          renderer.render(scene, camera);
        });
        container.appendChild(renderer.domElement);

        dispose = () => {
          renderer.setAnimationLoop(null);
          ro.disconnect();
          controls.dispose();
          if (model) disposeModel(model);
          envTexture.dispose();
          pmrem.dispose();
          bgTex.dispose();
          draco.dispose();
          loader.setDRACOLoader(null);
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [src, alt]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-bb-line bg-gradient-to-b from-bb-paper to-[#eceae4] ${
        fill ? "h-full" : "h-72 sm:h-80 lg:h-96"
      }`}
      role="img"
      aria-label={alt}
    >
      <div ref={containerRef} className="h-full w-full" />
      {!loaded && !failed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bb-paper/80">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-bb-green border-t-transparent" />
          <p className="text-xs text-slate-500">Cargando modelo 3D…</p>
        </div>
      )}
      {failed && (
        <div className="absolute inset-0 flex items-center justify-center bg-bb-paper/90">
          <p className="text-sm text-slate-500">No se pudo cargar el modelo 3D</p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] text-white">
        Arrastra para rotar · Rueda/pellizco para zoom · Clic derecho para mover
      </div>
    </div>
  );
}
