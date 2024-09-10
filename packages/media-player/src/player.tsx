import type {
  MediaPlayerInstance,
  MediaPlayerProps,
  MediaProviderAdapter,
  TrackProps,
} from "@vidstack/react";
import React from "react";
import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Track,
} from "@vidstack/react";

export type PlayerProps = MediaPlayerProps & {
  tracks?: TrackProps[];
  poster?: JSX.Element;
};
const Player = React.forwardRef<MediaPlayerInstance, PlayerProps>(
  (
    { children: layout, controls = true, poster, tracks = [], ...props },
    ref,
  ) => {
    function onProviderChange(
      provider: MediaProviderAdapter | null,
      // nativeEvent: MediaProviderChangeEvent,
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
        ref={ref}
        {...props}
      >
        <MediaProvider>
          {poster}
          {tracks.map((track, i) => (
            <Track {...track} key={String(i)} />
          ))}
        </MediaProvider>

        {controls && layout}
      </MediaPlayer>
    );
  },
);

export const DefaultPlayer = Player;
