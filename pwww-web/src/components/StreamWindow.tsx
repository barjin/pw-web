/* eslint-disable max-len */
import React, { Component, createRef } from 'react';

import RemoteBrowser from '../RemoteBrowser';

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
  private browser : RemoteBrowser;

  constructor(props: { browser : RemoteBrowser }) {
    super(props);

    this.canvas = createRef();
    this.browser = props.browser;
  }

  componentDidMount = () : void => {
    if (this.canvas.current) {
      const canvas = this.canvas.current;

      canvas.addEventListener('click', (ev) => {
        if (this.canvas.current) {
          this.browser.click(this.getClickPos(ev))
            .catch(console.error);
        }
      });

      canvas.addEventListener('contextmenu', (ev) => {
        this.browser.read(this.getClickPos(ev));
        ev.preventDefault();
      });

      canvas.addEventListener('wheel', (ev) => {
        this.browser.scroll(ev);
        ev.preventDefault();
      });

      canvas.addEventListener('keydown', (ev) => {
        if (ev.key.toLocaleLowerCase() === 's') {
          // this.actionSender(types.BrowserAction.screenshot, {})
          //   .catch(console.error);
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
        y: Math.floor((VIEWPORT_H / canvasPos.height) * (ev.clientY - canvasPos.top)),
      };
    }

    return { x: 0, y: 0 };
  };

  public DrawImage = (image: Buffer) :void => {
    if (this.canvas.current) {
      const ctx = this.canvas.current.getContext('2d');

      const img = new Image();

      img.src = URL.createObjectURL(new Blob([image]));
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        ctx?.clearRect(0, 0, this.canvas.current?.width || 0, VIEWPORT_H || 0);
        ctx?.drawImage(img, 0, 0);
      };
    }
  };

  /**
 * Internal method for flushing the current state of the image buffer to the screen.
 *
 * Checks whether the images are loaded, uses the current scroll height and optimizes the rendering process.
 */
  // private flushBuffer = () => {
  //   if (this.canvas.current) {
  //     const ctx = this.canvas.current.getContext('2d');

  //     const firstTileIndex = Math.floor(this.scrollHeight / VIEWPORT_H);
  //     if (this.screenBuffer.length <= firstTileIndex) { // in case even the first tile is not loaded yet
  //       return;
  //     }

  //     const firstBackground = new Image();
  //     const secondBackground = new Image();

  //     try {
  //       firstBackground.src = URL.createObjectURL(this.screenBuffer[firstTileIndex]);
  //       if (firstTileIndex + 1 < this.screenBuffer.length) { // useful at the end of the pages
  //         secondBackground.src = URL.createObjectURL(this.screenBuffer[firstTileIndex + 1]);
  //         secondBackground.onload = () => {
  //           ctx?.clearRect(0, 0, VIEWPORT_W || 0, VIEWPORT_H || 0);
  //           ctx?.drawImage(firstBackground, 0, -(this.scrollHeight % VIEWPORT_H)); // by the time the second screen is loaded, the first should already be loaded (server works sequentially)
  //           ctx?.drawImage(secondBackground, 0, VIEWPORT_H - (this.scrollHeight % VIEWPORT_H));
  //         };
  //       } else {
  //         firstBackground.onload = () => {
  //           ctx?.clearRect(0, 0, this.canvas.current?.width || 0, VIEWPORT_H || 0);
  //           ctx?.drawImage(firstBackground, 0, -(this.scrollHeight % VIEWPORT_H));
  //         };
  //       }
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }
  // };

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
