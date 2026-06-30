"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const PALETTE = ["#8aa0ff", "#b794ff", "#74d0ff", "#7fe9cf", "#ffc6a3"];

type OrbData = {
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
  phase: number;
};

function Orbs() {
  const group = useRef<THREE.Group>(null);

  const orbs = useMemo<OrbData[]>(() => {
    const rng = (a: number, b: number) => a + Math.random() * (b - a);
    return Array.from({ length: 14 }, () => ({
      position: [rng(-7, 7), rng(-5, 5), rng(-6, -1)],
      scale: rng(0.5, 1.7),
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      speed: rng(0.15, 0.5),
      phase: rng(0, Math.PI * 2),
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const scroll =
      typeof window !== "undefined"
        ? window.scrollY /
          Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        : 0;
    if (group.current) {
      group.current.rotation.z = scroll * 0.4;
      group.current.position.y = scroll * 2.5;
      group.current.children.forEach((child, i) => {
        const o = orbs[i];
        child.position.y = o.position[1] + Math.sin(t * o.speed + o.phase) * 0.6;
        child.position.x = o.position[0] + Math.cos(t * o.speed * 0.7 + o.phase) * 0.4;
      });
    }
  });

  return (
    <group ref={group}>
      {orbs.map((o, i) => (
        <mesh key={i} position={o.position} scale={o.scale}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial
            color={o.color}
            transparent
            opacity={0.32}
            roughness={0.25}
            metalness={0.1}
            emissive={o.color}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function AmbientCanvas() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-20"
      style={{ filter: "blur(28px)", opacity: 0.90 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        <Orbs />
      </Canvas>
    </div>
  );
}
