import {
  CaptionButton,
  FullscreenButton,
  isTrackCaptionKind,
  MuteButton,
  PIPButton,
  PlayButton,
  useMediaState,
} from "@vidstack/react";

import { Button } from "@korino/ui/button";
import {
  Minimize as FullscreenExitIcon,
  Maximize as FullscreenIcon,
  VolumeX as MuteIcon,
  PauseIcon,
  PictureInPictureIcon as PictureInPictureExitIcon,
  PictureInPicture2 as PictureInPictureIcon,
  PlayIcon,
  SubtitlesIcon,
  Volume2 as VolumeHighIcon,
  Volume1 as VolumeLowIcon,
} from "@korino/ui/icons";
import {
  TooltipContent,
  TooltipContentProps,
  Tooltip as TooltipPrimitive,
  TooltipProvider,
  TooltipTrigger,
} from "@korino/ui/tooltip";

const Tooltip = ({ children }: { children: React.ReactNode }) => (
  <TooltipProvider>
    <TooltipPrimitive>{children}</TooltipPrimitive>
  </TooltipProvider>
);

export interface MediaButtonProps {
  tooltipSide?: TooltipContentProps["side"];
  tooltipAlign?: TooltipContentProps["align"];
  tooltipOffset?: number;
}

export function Play({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isPaused = useMediaState("paused");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="invisible">
          <PlayButton>
            {isPaused ? (
              <PlayIcon className="h-7 w-7 translate-x-px" />
            ) : (
              <PauseIcon className="h-7 w-7" />
            )}
          </PlayButton>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isPaused ? "Play" : "Pause"}
      </TooltipContent>
    </Tooltip>
  );
}

export function Mute({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const volume = useMediaState("volume"),
    isMuted = useMediaState("muted");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="invisible">
          <MuteButton>
            {isMuted || volume == 0 ? (
              <MuteIcon className="h-7 w-7" />
            ) : volume < 0.5 ? (
              <VolumeLowIcon className="h-7 w-7" />
            ) : (
              <VolumeHighIcon className="h-7 w-7" />
            )}
          </MuteButton>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isMuted ? "Unmute" : "Mute"}
      </TooltipContent>
    </Tooltip>
  );
}

export function Caption({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const track = useMediaState("textTrack"),
    isOn = track && isTrackCaptionKind(track);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="invisible">
          <CaptionButton>
            <SubtitlesIcon
              className={`h-7 w-7 ${!isOn ? "text-white/60" : ""}`}
            />
          </CaptionButton>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isOn ? "Closed-Captions Off" : "Closed-Captions On"}
      </TooltipContent>
    </Tooltip>
  );
}

export function PIP({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isActive = useMediaState("pictureInPicture");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="invisible">
          <PIPButton>
            {isActive ? (
              <PictureInPictureExitIcon className="h-7 w-7" />
            ) : (
              <PictureInPictureIcon className="h-7 w-7" />
            )}
          </PIPButton>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? "Exit PIP" : "Enter PIP"}
      </TooltipContent>
    </Tooltip>
  );
}

export function Fullscreen({
  tooltipOffset = 0,
  tooltipSide = "top",
  tooltipAlign = "center",
}: MediaButtonProps) {
  const isActive = useMediaState("fullscreen");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild variant="invisible">
          <FullscreenButton>
            {isActive ? (
              <FullscreenExitIcon className="h-7 w-7" />
            ) : (
              <FullscreenIcon className="h-7 w-7" />
            )}
          </FullscreenButton>
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        align={tooltipAlign}
        sideOffset={tooltipOffset}
      >
        {isActive ? "Exit Fullscreen" : "Enter Fullscreen"}
      </TooltipContent>
    </Tooltip>
  );
}
