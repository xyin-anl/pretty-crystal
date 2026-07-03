import { EffectComposer, N8AO } from "@react-three/postprocessing";

import type { AmbientOcclusionProps } from "./MaterialPresetEffects";

export function AmbientOcclusionEffect({
  ambientOcclusion,
}: {
  ambientOcclusion: AmbientOcclusionProps;
}) {
  return (
    <EffectComposer multisampling={8}>
      <N8AO {...ambientOcclusion} />
    </EffectComposer>
  );
}
