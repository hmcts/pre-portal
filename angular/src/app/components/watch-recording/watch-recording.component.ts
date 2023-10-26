import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';

declare var mkplayer: any;

@Component({
  selector: 'app-watch-recording',
  template: `
    <div
      class="govuk-!-margin-bottom-2 video-wrapper"
      *ngIf="selectedRecordingSource">
      <div id="video-container" class="video-container" #videoPlayer></div>
    </div>
  `,
  styles: [
    `
      .video-wrapper {
        border: 4px solid black;
        margin-bottom: 30px;
        position: relative;

        .video-container {
          height: calc(100% - 8px);

          & > video,
          > .bmpui-ui-uicontainer,
          > .bitmovinplayer-poster {
            width: calc(100% - 8px);
            height: calc(100% - 8px);
            margin: 4px 4px 0 4px;
          }
        }
      }
    `,
  ],
})
export class WatchRecordingComponent implements OnDestroy, AfterViewInit {
  @Input() selectedRecordingSource?: string;
  @ViewChild('videoPlayer') videoPlayer?: ElementRef;
  private player?: any;

  ngAfterViewInit(): void {
    if (this.videoPlayer && !this.player) this.initPlayer();
  }

  initPlayer() {
    const playerConfig = {
      // TODO GET API KEY
      key: 'API_KEY',
      playback: {
        muted: false,
        autoplay: false,
      },
      ui: true,
      events: {
        [mkplayer.MKPlayerEvent.Error]: (event: any) => {
          console.log('Encountered player error: ', JSON.stringify(event));
        },
        [mkplayer.MKPlayerEvent.TimeChanged]: (event: any) => {
          console.log('Current player position: ', event.time);
        },
      },
    };

    this.player = new mkplayer.MKPlayer(
      this.videoPlayer?.nativeElement as HTMLElement,
      playerConfig as any
    );

    // TODO Set dash to this.selectedRecordingSource
    const sourceConfig = {
      title: 'Title for your source',
      description: 'Brief description of your source',
      // poster: 'https://my-cdn.com/mysource/poster.png',
      // hls: 'https://my-cdn.com/mysource/hls/index.m3u8',
      // dash: 'https://my-cdn.com/mysource/dash/manifest.mpd',
      dash: 'https://cdn.bitmovin.com/content/assets/art-of-motion-dash-hls-progressive/mpds/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.mpd',
    };

    this.player
      .load(sourceConfig)
      .then(() => {
        console.log('Source loaded');
      })
      .catch((e: Error) => {
        console.error('An error occurred: ', e);
      });
  }

  ngOnDestroy() {
    if (!this.player) return;

    this.player
      .unload()
      .then(() => {
        console.log('Source unloaded successfully!');
        this.player.destroy().then(() => console.log('Player destroyed'));
      })
      .catch((error: Error) => {
        console.error('Source unload failed with error:', error);
      });
  }
}
