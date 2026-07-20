export const GLASS_SURFACE_CLASS =
  "border-foreground/10 bg-card/72 backdrop-blur-2xl backdrop-saturate-150";

// The after:* pseudo-element extends the pointer hit area past the 28px
// visual box without colliding with neighbors at the rails' 6px gaps.
export const TOOL_ICON_BUTTON_CLASS =
  "tool-icon-button relative size-7 rounded-[10px] border border-transparent bg-transparent text-muted-foreground shadow-none transition-[background-color,border-color,color,box-shadow,scale] duration-150 after:absolute after:-inset-[3px] after:content-[''] active:scale-[0.96] motion-reduce:transition-none [&_svg]:size-3.5";

export const TOOL_ICON_BUTTON_ACTIVE_CLASS = "tool-icon-button-active";

export const TOOL_ICON_BUTTON_RESET_FEEDBACK_A_CLASS =
  "tool-icon-button-reset-feedback-a";

export const TOOL_ICON_BUTTON_RESET_FEEDBACK_B_CLASS =
  "tool-icon-button-reset-feedback-b";

export const TOOL_ICON_BUTTON_LOCK_FEEDBACK_A_CLASS =
  "tool-icon-button-lock-feedback-a";

export const TOOL_ICON_BUTTON_LOCK_FEEDBACK_B_CLASS =
  "tool-icon-button-lock-feedback-b";
