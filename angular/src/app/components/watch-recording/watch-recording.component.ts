import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-watch-recording',
  template: `
    <link
      href="//amp.azure.net/libs/amp/latest/skins/amp-default/azuremediaplayer.min.css"
      rel="stylesheet" />
    <div
      class="govuk-!-margin-bottom-2 video-wrapper"
      *ngIf="selectedRecordingSource">
      <video
        data-testid="recording-video"
        class="azuremediaplayer amp-default-skin amp-big-play-centered"
        controls
        width="100%"
        height="auto"
        data-setup='{"nativeControlsForTouch": false}'>
        <source
          [src]="selectedRecordingSource"
          type="application/vnd.ms-sstr+xml" />
        <p class="amp-no-js">
          To view this video please enable JavaScript, and consider upgrading to
          a web browser that supports HTML5 video
        </p>
      </video>
    </div>
  `,
  styles: [
    `
      .video-wrapper {
        border: 4px solid black;
        padding: 4px;
        margin-bottom: 30px;
      }
    `,
  ],
})
export class WatchRecordingComponent {
  @Input() selectedRecordingSource?: string;
}
