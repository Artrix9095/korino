import { useCaptionOptions, useMediaPlayer } from "@vidstack/react";
import { CheckCircle, CircleIcon, SubtitlesIcon } from "lucide-react";

import { Button } from "@korino/ui/button";
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
            asChild
            disabled={options.disabled}
          >
            <Button variant={"invisible"}>
              <SubtitlesIcon className="h-7 w-7" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent
          side={tooltipSide}
          align={tooltipAlign}
          sideOffset={tooltipOffset}
        >
          Captions
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
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
