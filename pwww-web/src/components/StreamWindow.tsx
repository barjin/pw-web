/* eslint-disable max-len */
import React, { Component, createRef } from 'react';
import * as types from 'pwww-shared/Types';

const VIEWPORT_W = 1280;
const VIEWPORT_H = 720;
/**
 * React component containing the canvas with the streamed browser environment.
 *
 * Contains all the rendering methods as well as some scrolling logic.
 */
export default class StreamWindow extends Component<any, any> {
/**
 * React Reference to the actual HTML canvas element acting as the browser main window.
 */
  private canvas : React.RefObject<HTMLCanvasElement>;

  /**
 * Callback function for passing the canvas targetted actions (clicking, screenshots) to the handlers higher up.
 */
  private actionSender : (...args: any[]) => Promise<void>;

  /**
 * Callback function for requesting new screen tiles - used with the scrolling functionality, not connected to the recordable "screenshot" action.
 */
  private requestScreenshot : (screenNumber: number) => void;

  /**
 * Current distance scrolled (in the vertical direction).
 */
  private scrollHeight = 0;

  /**
 * Array of screen tiles - updated dynamically as the user scrolls to save some bandwidth as well as some extra horsepower.
 */
  private screenBuffer : Blob[] = [new Blob([])];

  constructor(props: { actionSender : (actionType: types.BrowserAction, data: Record<string, unknown>) => Promise<void>, screenRequester: (screenNumber: number) => void }) {
    super(props);

    this.canvas = createRef();
    this.actionSender = props.actionSender;
    this.requestScreenshot = props.screenRequester;
  }

  componentDidMount = () : void => {
    if (this.canvas.current) {
      const canvas = this.canvas.current;

      canvas.addEventListener('click', (ev) => {
        if (this.canvas.current) {
          this.actionSender(types.BrowserAction.click, this.getClickPos(ev))
            .catch(console.error);
        }
      });

      canvas.addEventListener('contextmenu', (ev) => {
        this.actionSender(types.BrowserAction.read, this.getClickPos(ev));
        ev.preventDefault();
      });

      canvas.addEventListener('wheel', (ev) => {
        const heightBackup = this.scrollHeight;
        this.scrollHeight += (ev.deltaY * VIEWPORT_H) / (this.canvas.current?.height || 1);
        this.scrollHeight = (this.scrollHeight < 0) ? 0 : this.scrollHeight;

        if (this.scrollHeight > ((this.screenBuffer.length - 2) * VIEWPORT_H)) { // always keeping at least 1 screen in advance
          this.requestScreenshot(this.screenBuffer.length);
        }

        if (this.scrollHeight > VIEWPORT_H * (this.screenBuffer.length - 1)) { // when at the bottom of the page, this stops user from completely drifting away
          this.scrollHeight = heightBackup;
        }

        this.flushBuffer();
        ev.preventDefault();
      });

      canvas.addEventListener('keydown', (ev) => {
        if (ev.key.toLocaleLowerCase() === 's') {
          this.actionSender(types.BrowserAction.screenshot, {})
            .catch(console.error);
        }
      });
    }
  };

  /**
 * Canvas click handler using basic geometry to map the current click position (takes care of the scroll height calculations) to the VIEWPORT_H, VIEWPORT_W space (correspoding to the Playwright's browser window size)
 * @param {MouseEvent} ev - Click event
 * @returns The remapped coordinates of the current click.
 */
  private getClickPos = (ev : MouseEvent) => {
    if (this.canvas.current) {
      const canvasPos = this.canvas.current.getBoundingClientRect();
      return {
        x: Math.floor((VIEWPORT_W / canvasPos.width) * (ev.clientX - canvasPos.left)),
        y: Math.floor((VIEWPORT_H / canvasPos.height) * (ev.clientY - canvasPos.top) + this.scrollHeight),
      };
    }

    return { x: 0, y: 0 };
  };

  /**
 * Internal method for flushing the current state of the image buffer to the screen.
 *
 * Checks whether the images are loaded, uses the current scroll height and optimizes the rendering process.
 */
  private flushBuffer = () => {
    if (this.canvas.current) {
      const ctx = this.canvas.current.getContext('2d');

      const firstTileIndex = Math.floor(this.scrollHeight / VIEWPORT_H);
      if (this.screenBuffer.length <= firstTileIndex) { // in case even the first tile is not loaded yet
        return;
      }

      const firstBackground = new Image();
      const secondBackground = new Image();

      try {
        firstBackground.src = URL.createObjectURL(this.screenBuffer[firstTileIndex]);
        if (firstTileIndex + 1 < this.screenBuffer.length) { // useful at the end of the pages
          secondBackground.src = URL.createObjectURL(this.screenBuffer[firstTileIndex + 1]);
          secondBackground.onload = () => {
            ctx?.clearRect(0, 0, VIEWPORT_W || 0, VIEWPORT_H || 0);
            ctx?.drawImage(firstBackground, 0, -(this.scrollHeight % VIEWPORT_H)); // by the time the second screen is loaded, the first should already be loaded (server works sequentially)
            ctx?.drawImage(secondBackground, 0, VIEWPORT_H - (this.scrollHeight % VIEWPORT_H));
          };
        } else {
          firstBackground.onload = () => {
            ctx?.clearRect(0, 0, this.canvas.current?.width || 0, VIEWPORT_H || 0);
            ctx?.drawImage(firstBackground, 0, -(this.scrollHeight % VIEWPORT_H));
          };
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  /**
 * "Setter" function for the internal sceen buffer.
 * @param {number} idx - Index of the new screen being added.
 * @param {Blob} data - Binary image data of the new screen.
 */
  public addScreen(idx: number, data: Blob) : void {
    this.screenBuffer[idx] = data;
    this.flushBuffer();
  }

  /**
 * Clears the screen buffer array and resets the scroll height to 0.
 */
  public resetView(): void {
    this.scrollHeight = 0;
    this.screenBuffer = [];
  }

  render() : JSX.Element {
    return (
      <canvas
        ref={this.canvas}
        tabIndex={-1}
        style={{ width: `${100}%`, height: `${75}vh` }}
        width={`${VIEWPORT_W}px`}
        height={`${VIEWPORT_H}px`}
      />
    );
  }
}
