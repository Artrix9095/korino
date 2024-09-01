import { useCaptionOptions, useMediaPlayer } from "@vidstack/react";
import { CheckCircle, CircleIcon, SubtitlesIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuMenuContentProps,
  DropdownMenuMenuRadioItemProps,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@korino/ui/dropdown-menu";
import {
  TooltipContent,
  TooltipContentProps,
  Tooltip as TooltipPrimitive,
  TooltipProvider,
  TooltipTrigger,
} from "@korino/ui/tooltip";

import { buttonClass, tooltipClass } from "./buttons";

export interface MenuProps {
  side?: DropdownMenuMenuContentProps["side"];
  align?: DropdownMenuMenuContentProps["align"];
  offset?: DropdownMenuMenuContentProps["sideOffset"];
  tooltipSide?: TooltipContentProps["side"];
  tooltipAlign?: TooltipContentProps["align"];
  tooltipOffset?: number;
}

const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider>
    <TooltipPrimitive>{children}</TooltipPrimitive>
  </TooltipProvider>
);

// We can reuse this class for other menus.
const menuClass =
  "animate-out fade-out z-[9999] slide-in-from-bottom-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-out-to-bottom-2 flex max-h-[400px] min-w-[260px] flex-col rounded-md border border-white/10 bg-black/95 p-2.5 font-sans text-[15px] font-medium outline-none backdrop-blur-sm duration-300";

export function Captions({
  side = "top",
  align = "end",
  offset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
  tooltipOffset = 0,
}: MenuProps) {
  const player = useMediaPlayer(),
    options = useCaptionOptions(),
    hint = options.selectedTrack?.label ?? "Off";
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger
            aria-label="Settings"
            className={buttonClass}
            disabled={options.disabled}
          >
            <SubtitlesIcon className="h-7 w-7" />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent
          className={tooltipClass}
          side={tooltipSide}
          align={tooltipAlign}
          sideOffset={tooltipOffset}
        >
          Captions
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className={menuClass}
        side={side}
        align={align}
        sideOffset={offset}
        collisionBoundary={player?.el}
      >
        <DropdownMenuLabel className="mb-2 flex w-full items-center px-1.5 text-[15px] font-medium">
          <SubtitlesIcon className="mr-1.5 h-5 w-5 translate-y-px" />
          Captions
          <span className="ml-auto text-sm text-white/50">{hint}</span>
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          aria-label="Captions"
          className="flex w-full flex-col"
          value={options.selectedValue}
        >
          {options.map(({ label, value, select }) => (
            <Radio value={value} onSelect={select} key={value}>
              {label}
            </Radio>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Radio({ children, ...props }: DropdownMenuMenuRadioItemProps) {
  return (
    <DropdownMenuRadioItem
      className="ring-media-focus hocus:bg-white/10 group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 text-sm outline-none data-[focus]:ring-[3px]"
      {...props}
    >
      <CircleIcon className="h-4 w-4 text-white group-data-[state=checked]:hidden" />
      <CheckCircle className="text-media-brand hidden h-4 w-4 group-data-[state=checked]:block" />
      <span className="ml-2">{children}</span>
    </DropdownMenuRadioItem>
  );
}
