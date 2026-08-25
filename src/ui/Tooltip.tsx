import React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

interface TooltipProps {
  label: string;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
}

const Tooltip: React.FC<TooltipProps> = ({ label, children, side = "top" }) => {
  const triggerChild = React.isValidElement<{ tabIndex?: number }>(children)
    ? React.cloneElement(children, {
        tabIndex: children.props.tabIndex ?? 0,
      })
    : children;

  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{triggerChild}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-xs rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          >
            {label}
            <RadixTooltip.Arrow className="fill-slate-900 dark:fill-slate-100" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
};

export default Tooltip;
