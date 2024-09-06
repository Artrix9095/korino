import type {
  MediaCanPlayDetail,
  MediaCanPlayEvent,
  MediaPlayerProps,
  MediaProviderAdapter,
  MediaProviderChangeEvent,
} from "@vidstack/react";
import React from "react";
import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  TrackProps,
} from "@vidstack/react";

export type PlayerProps = MediaPlayerProps & {
  tracks?: TrackProps[];
  poster?: JSX.Element;
};
function Player({
  children: layout,
  poster,
  tracks = [],
  ...props
}: PlayerProps) {
  function onProviderChange(
    provider: MediaProviderAdapter | null,
    nativeEvent: MediaProviderChangeEvent,
  ) {
    // We can configure provider's here.
    if (isHLSProvider(provider)) {
      provider.config = {
        debug: true,
      };
    }
  }

  return (
    <MediaPlayer
      className="ring-media-focus aspect-video w-full overflow-hidden rounded-md bg-slate-900 font-sans text-white data-[focus]:ring-4"
      crossOrigin
      playsInline
      onProviderChange={onProviderChange}
      {...props}
    >
      <MediaProvider>
        {poster}
        {/* <Poster
          className="absolute inset-0 block h-full w-full rounded-md object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
          src="https://files.vidstack.io/sprite-fight/poster.webp"
          alt="Girl walks into campfire with gnomes surrounding her friend ready for their next meal!"
        /> */}
        {tracks.map((track) => (
          <Track {...track} key={track.src} />
        ))}
      </MediaProvider>

      {layout}
    </MediaPlayer>
  );
}

export const DefaultPlayer = React.memo(Player);
