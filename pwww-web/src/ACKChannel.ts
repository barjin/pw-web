/* eslint-disable max-len */
/* Promisifies WebSocket communication - introduces "request-response" mechanism */

type Response = Record<string, unknown>;
/**
 * Simple helper class facilitating a "Request-Response" mechanism over WebSockets.
 *
 * Uses promises to unify the standard "fetch-like" HTTP-approach and the bidirectional nature of WebSockets communication.
 */
export default class ACKChannel {
  /**
   * Global ACK message counter (used for generating unique message IDs sequentially)
   */
  private messageID = 0;

  /**
     * List of pending messages (sent, but not confirmed by the server yet).
     *
     * Every message record contains resolve and reject functions which either resolve or reject the associated promise.
     */
  private pendingActions :
  {
    messageID: number,
    resolve: (response: Response) => void,
    reject: (reason: Error) => void
  }[] = [];

  /**
       * The internal WebSocket connection.
       */
  private WSChannel : WebSocket;

  /**
     * The function called when an unrequested message comes (either has no responseID or has no match in the pendingActions).
     */
  private broadcastCallback : (arg0 : Blob) => void;

  constructor(wsChannel : WebSocket, broadcastCallback : (arg0 : Blob) => void) {
    this.WSChannel = wsChannel;
    this.broadcastCallback = broadcastCallback;
    this.WSChannel.addEventListener('message', this.messageReceiver);
  }

  /**
     * Method for sending data, expecting ACK message (or other kind of response)
     *
     * Returns thenable promise, which hugely simplifies the usage of WebSockets channel with the classic Request-Response approach.
     * @param {object} data - Arbitrary (serializable) data to be sent over the WebSockets channel.
     * @returns Promise gets resolved with the response object (after the response arrives).
     */
  public request = (data: Record<string, unknown>) : Promise<Response> => new Promise((resolve, reject) => {
    this.pendingActions.push({ messageID: this.messageID, resolve, reject });
    this.send({ messageID: this.messageID, payload: data });
    this.messageID += 1;
    console.log(JSON.stringify(this.pendingActions));
  });

  /**
     * Method for sending data without waiting for ACK (or any other response)
     * @param {object} data - Arbitrary (serializable) data to be sent over the WebSockets channel.
     */
  public send = (data: Record<string, unknown>) : void => {
    this.WSChannel.send(JSON.stringify(data));
  };

  /**
     * Passthrough function for adding listeners to the underlying WebSocket channel.
     *
     * Although useful, should be used with discretion, e.g. not for 'message' events, which are already handled by the messageReceiver method.
     * @param {string} type - Event type to be listening to (conn, message...)
     * @param {(event: Event) => void} listener - Listener (event handling) function.
     */
  public addEventListener = (type : string, listener : (event : Event) => void) : void => {
    this.WSChannel.addEventListener(type, listener);
  };

  /**
     * New message handler, if the message is a response for any pending request, the attached promise gets resolved with the incoming data.
     * @param {{data: Blob}} message - WS message object containing arbitrary data
     */
  private messageReceiver = (message : { data: Blob }) : void => {
    try {
      const obj = JSON.parse(message.data as any);

      if ('responseID' in obj) {
        console.log(obj);
        // If there is id property in the received object, it should correspond to one of the sent (now pending) messages (this invariant should be respected by both sides - no responseID without intital messageID (request)!)
        for (let i = 0; i < this.pendingActions.length; i += 1) {
          if (this.pendingActions[i].messageID === obj.responseID) {
            if ('error' in obj) {
              this.pendingActions[i].reject(new Error(obj.errorMessage));
            } else {
              this.pendingActions[i].resolve(obj);
            }
            this.pendingActions.splice(i, 1);
            break;
          }
        }
      } else {
        // In this case, this message is not a response to anything and gets processed using the "broadcast" callback.
        this.broadcastCallback(message.data);
      }
    } catch {
      // The message data is not valid JSON (e.g. binary image data)
      this.broadcastCallback(message.data);
    }
  };
}
