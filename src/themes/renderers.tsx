"use client";

// ─── Theme renderer registry ─────────────────────────────────────────
// Maps theme id → renderer component. Kept separate from registry.ts so
// server-side code (actions, validation) can use theme definitions without
// importing React components.

import type { ComponentType } from "react";
import type { ThemeId } from "@/types";
import type { ThemeRenderProps } from "./types";
import { MonographRenderer } from "./monograph/Renderer";
import { Roll36Renderer } from "./roll36/Renderer";
import { KeepsakeRenderer } from "./keepsake/Renderer";
import { AfterDarkRenderer } from "./afterdark/Renderer";
import { CabinetRenderer } from "./cabinet/Renderer";

export const THEME_RENDERERS: Record<ThemeId, ComponentType<ThemeRenderProps>> = {
  monograph: MonographRenderer,
  roll36: Roll36Renderer,
  keepsake: KeepsakeRenderer,
  afterdark: AfterDarkRenderer,
  cabinet: CabinetRenderer,
};
