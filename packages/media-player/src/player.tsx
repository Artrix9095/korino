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
  controls = true,
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
        {tracks.map((track) => (
          <Track {...track} key={track.src} />
        ))}
      </MediaProvider>

      {controls && layout}
    </MediaPlayer>
  );
}

export const DefaultPlayer = React.memo(Player);
