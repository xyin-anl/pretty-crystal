/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRETTY_CRYSTAL_STATIC_SCENE?: string;
  readonly VITE_PRETTY_CRYSTAL_STATIC_SCENE_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
