/* Promisifies WebSocket communication - introduces "request-response" mechanism */

/**
 * Simple helper class facilitating a "Request-Response" mechanism over WebSockets. 
 * 
 * Uses promises to unify the standard "fetch-like" HTTP-approach and the bidirectional nature of WebSockets communication.
 */
class ACKChannel {
  /**
   * Global ACK message counter (used for generating unique message IDs sequentially)
   */
    private _messageID : number = 0;

    /**
     * List of pending messages (sent, but not confirmed by the server yet).
     * 
     * Every message record contains resolve and reject functions which either resolve or reject the associated promise.
     */
    private _pendingActions : 
      {
       messageID: number, 
       resolve: (response: object) => void, 
       reject: (reason: any) => void
      }[] = [];
    
      /**
       * The internal WebSocket connection.
       */
    private _WSChannel : WebSocket;
    /**
     * The function called when an unrequested message comes (either has no responseID or has no match in the _pendingActions).
     */
    private _broadcastCallback : (arg0 : Blob) => void;
  
    constructor(wsChannel : WebSocket, broadcastCallback : (arg0 : Blob) => void){
      this._WSChannel = wsChannel;
      this._broadcastCallback = broadcastCallback;
      this._WSChannel.addEventListener('message',this.messageReceiver);
    }
  
    /**
     * Method for sending data, expecting ACK message (or other kind of response)
     * 
     * Returns thenable promise, which hugely simplifies the usage of WebSockets channel with the classic Request-Response approach.
     * @param {object} data - Arbitrary (serializable) data to be sent over the WebSockets channel.
     * @returns Promise gets resolved with the response object (after the response arrives).
     */
    public request = (data: object) : Promise<object> => {
        return new Promise((resolve,reject) => {
          this._pendingActions.push({messageID: this._messageID, resolve: resolve, reject: reject});
          this.send({messageID: this._messageID, payload: data});
          this._messageID++;
          console.log(JSON.stringify(this._pendingActions));
        });
    }
  
    /**
     * Method for sending data without waiting for ACK (or any other response)
     * @param {object} data - Arbitrary (serializable) data to be sent over the WebSockets channel.
     */
    public send = (data: object) : void => {
      this._WSChannel.send(JSON.stringify(data));
    }
  
    /**
     * Passthrough function for adding listeners to the underlying WebSocket channel.
     * 
     * Although useful, should be used with discretion, e.g. not for 'message' events, which are already handled by the messageReceiver method.
     * @param {string} type - Event type to be listening to (conn, message...)
     * @param {(event: Event) => void} listener - Listener (event handling) function.
     */
    public addEventListener = (type : string, listener : (event : Event) => void) => {
      this._WSChannel.addEventListener(type, listener);
    }

    /**
     * New message handler, if the message is a response for any pending request, the attached promise gets resolved with the incoming data.
     * @param {{data: Blob}} message - WS message object containing arbitrary data
     */
    private messageReceiver = (message : { data: Blob }) : void => {
      try{
        var obj = JSON.parse(message.data as any);

        if("responseID" in obj){
          console.log(obj);
          // If there is id property in the received object, it should correspond to one of the sent (now pending) messages (this invariant should be respected by both sides - no responseID without intital messageID (request)!)
          for(let i = 0; i < this._pendingActions.length; i++){
            if(this._pendingActions[i].messageID === obj.responseID){
              if("error" in obj){
                this._pendingActions[i].reject(obj);
              }
              else{
                this._pendingActions[i].resolve(obj);
              }
              this._pendingActions.splice(i,1);
              break;
            }
          }
        }
        else{
          // In this case, this message is not a response to anything and gets processed using the "broadcast" callback.
          this._broadcastCallback(message.data);
        }
      }
      catch{
        // The message data is not valid JSON (e.g. binary image data)
        this._broadcastCallback(message.data);
      }
    }
  }

  export {ACKChannel};