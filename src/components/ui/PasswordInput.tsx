"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { TextInput, type InputProps } from "@/components/ui/FormField";

/**
 * Password field with a show/hide (eye) toggle. Pass `visible` + `onVisibleChange`
 * to control several fields together (e.g. password + confirm).
 */
export function PasswordInput({
  visible: visibleProp,
  onVisibleChange,
  ...props
}: Omit<InputProps, "type" | "endAdornment"> & {
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}) {
  const [visibleState, setVisibleState] = useState(false);
  const visible = visibleProp ?? visibleState;
  const toggle = () => {
    const next = !visible;
    if (visibleProp === undefined) setVisibleState(next);
    onVisibleChange?.(next);
  };
  return (
    <TextInput
      {...props}
      type={visible ? "text" : "password"}
      endAdornment={
        <button
          type="button"
          onClick={toggle}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={props.id}
          className="-my-2 -mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-havezic-primary"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      }
    />
  );
}

