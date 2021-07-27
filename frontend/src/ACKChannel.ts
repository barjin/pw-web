/* Promisifies WebSocket communication - introduces "request-response" mechanism */
class ACKChannel {
    private _messageID : number = 0;
    private _pendingActions : 
      {
       id: number, 
       resolve: (response?: unknown) => void, 
       reject: (reason: any) => void
      }[] = [];
    
    private _WSChannel : WebSocket;
    private _broadcastCallback : (arg0 : object) => void;
  
    constructor(wsChannel : WebSocket, broadcastCallback : (arg0 : object) => void){
      this._WSChannel = wsChannel;
      this._broadcastCallback = broadcastCallback;
      this._WSChannel.addEventListener('message',this.messageReceiver);
    }
  
    request = (data: object) : Promise<any> => {
        return new Promise((resolve,reject) => {
          this._pendingActions.push({id: this._messageID, resolve: resolve, reject: reject});
          this.send({id: this._messageID, ...data});
          this._messageID++;
          console.log(JSON.stringify(this._pendingActions));
        });
    }
  
    send = (data: object) : void => {
      this._WSChannel.send(JSON.stringify(data));
    }
  
    messageReceiver = (message : { data: string }) : void => {
      let obj = JSON.parse(message.data);
      if("responseID" in obj){
        console.log(obj);
        // If there is id property in the received object, it should correspond to one of the sent (now pending) messages
        // When should be the request rejected? (timeout/errors?)
        for(let i = 0; i < this._pendingActions.length; i++){
          if(this._pendingActions[i].id === obj.responseID){
            this._pendingActions[i].resolve(obj);
            this._pendingActions.splice(i,1);
            break;
          }
        }
        // this._pendingActions = this._pendingActions.filter((x) => (x.id !== obj.responseID));
      }
      else{
        // In this case, this message is not a response to anything and gets processed using the "broadcast" callback.
        this._broadcastCallback(obj);
      }
    }
  
    // Passthrough function for adding listeners to the underlying WebSocket channel (should be used with discretion, e.g. not for 'message' events etc.)
    addEventListener = (type : string, listener : (event : Event) => void) => {
      this._WSChannel.addEventListener(type, listener);
    }
  }

  export default ACKChannel;