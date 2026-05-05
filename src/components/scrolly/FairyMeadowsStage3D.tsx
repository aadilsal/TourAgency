"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { cn } from "@/lib/cn";

function TopoScene({ accent = "#FACC15" }: { accent?: string }) {
  const group = useRef<THREE.Group>(null);

  const topo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(7.2, 5.6, 140, 110);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const nx = v.x * 0.85;
      const ny = v.y * 0.9;
      const h =
        0.55 * Math.sin(nx * 1.2) * Math.cos(ny * 1.05) +
        0.25 * Math.sin(nx * 2.25 + 0.8) * Math.cos(ny * 2.4) +
        0.14 * Math.sin((nx + ny) * 2.1);
      pos.setZ(i, h);
    }
    geo.computeVertexNormals();

    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-3.1, -1.6, 0.15),
        new THREE.Vector3(-1.8, -0.6, 0.28),
        new THREE.Vector3(-0.3, 0.1, 0.38),
        new THREE.Vector3(1.35, 0.95, 0.42),
        new THREE.Vector3(3.05, 1.8, 0.46),
      ],
      false,
      "catmullrom",
      0.6,
    );

    const tube = new THREE.TubeGeometry(curve, 140, 0.045, 10, false);
    return { geo, tube };
  }, []);

  return (
    <group ref={group} rotation={[-0.42, -0.35, 0]} position={[0, -0.2, 0]}>
      <mesh geometry={topo.geo} receiveShadow>
        <meshStandardMaterial
          color="#0B1D33"
          metalness={0.45}
          roughness={0.25}
          emissive="#06121f"
          emissiveIntensity={0.25}
        />
      </mesh>
      <Float speed={1.2} rotationIntensity={0.25} floatIntensity={0.18}>
        <mesh geometry={topo.tube} castShadow>
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={0.65}
            metalness={0.35}
            roughness={0.2}
          />
        </mesh>
      </Float>
    </group>
  );
}

export function FairyMeadowsStage3D({
  className,
  accent,
  label = "Journey preview",
  subtitle = "3D route moment",
}: {
  className?: string;
  accent?: string;
  label?: string;
  subtitle?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl border border-border bg-panel",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      <Canvas
        shadows={false}
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <PerspectiveCamera makeDefault fov={42} position={[0, 0.4, 7.6]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4.5, 6.5, 3.5]} intensity={1.1} />
        <TopoScene accent={accent} />
        <Environment preset="city" />
      </Canvas>
      <div className="absolute left-6 top-6 rounded-2xl border border-border bg-background/80 px-4 py-3 backdrop-blur-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

