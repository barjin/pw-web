/* eslint-disable max-len */
/* The RERE library implementing the REREProtocol over WebSockets */

enum Type{
  REQ = 'REQ',
  RES = 'RES',
  MSG = 'MSG',
}

const MSG_TIMEOUT = 10000;

export type Message = {
  header: {
    id: number | undefined,
    type: Type,
    format: ('J' | 'B')
  },
  payload: Object | Uint8Array | String
};


function isNode(){
  return typeof window === 'undefined';
}
/**
* Simple helper class facilitating a "Request-Response" mechanism over WebSockets.
*
* Uses promises to unify the standard "fetch-like" HTTP-approach and the bidirectional nature of WebSockets communication.
*/
export default class Rerep {
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
    resolve: (response: Message['payload']) => void,
    reject: (reason: Message['payload']) => void
  }[] = [];

/**
* The internal WebSocket connection.
*/
  private WSChannel : WebSocket;

  /**
   * Listener function handling the incoming !requests! (messages with ID, where the other side expects a response).
   * Can (and should) have server-side side effects - no clear difference like GET/POST or such.
   * @returns Response to be sent back to the user.
   */
  private reqHandler : (arg0 : Message['payload']) => Message['payload'] = () => '';

  /**
   * Listener function handling the incoming messages (no response expected).
   * Should have side effects (duh, it's void).
   */
  private msgHandler : (arg0 : Message['payload']) => void = () => {};

  /**
   * Listener function handling the incoming responses (to previously made requests).
   * Can have side effects, but mainly returns true or false to determine whether to resolve or reject the Promise. (Implements the higher level communication protocol.)
   */
  private resHandler : (arg0 : Message['payload']) => boolean = () => false;

  constructor(wsChannel : WebSocket) {
    this.WSChannel = wsChannel;
    this.WSChannel.addEventListener('message', (e) => this.messageReceiver(e.data));
  }

  // eslint-disable-next-line no-return-assign
  private getHeader = (type: Type, format: ('J' | 'B') = 'J') : Message['header'] => ({
    id: this.messageID += 1,
    type: Type[type],
    format,
  });

  private static async parseMessage(message: Uint8Array): Promise<Message> {
    if(message.constructor.name === "Blob"){
      let ab = await (<Blob><unknown>message).arrayBuffer();
      message = new Uint8Array(ab);
    }
    const text = new TextDecoder().decode(message.slice(0, 100)); // might be a problem for very long headers (if the ID strategy changes or after prolonged usage). The aim here is not to load the entire (pontentially large) message.
    
    const match = text.match(/^REREP (?<type>RES|REQ|MSG) ((?<id>(?<=((RES|REQ) ))\d*?) )?(?<format>J|B)\n/);

    if (!match) {
      throw new Error('No valid REREP header found!');
    }

    const headerLength = match[0].length;

    if (!match.groups) {
      throw new Error('REREP - Malformed header!');
    }
    return {
      header: {
        id: match.groups.id ? parseInt(match.groups.id, 10) : undefined,
        type: match.groups.type as Type,
        format: match.groups.format as Message['header']['format'],
      },
      payload: match.groups.format === 'J' ? JSON.parse(new TextDecoder().decode(message.slice(headerLength))) : message.slice(headerLength),
    };
  }

  /**
* Method for sending data, expecting ACK message (or other kind of response)
*
* Returns thenable promise, which hugely simplifies the usage of WebSockets channel with the classic Request-Response approach.
* @param {Uint8Array} data - Arbitrary data to be sent over the WebSockets channel.
* @returns Promise gets resolved with the response object (after the response arrives).
*/
  public request = (data: Message['payload']) : Promise<Record<string, unknown>> => new Promise((resolve, reject) => {
    this.send(data, this.getHeader(Type.REQ, data.constructor.name === 'Object' ? 'J' : 'B'));
    this.pendingActions.push({ messageID: this.messageID, resolve: resolve as any, reject });
  });

  /**
* Method for sending the data.
* @param data - Arbitrary data to be sent over the WebSockets channel.
* @param header - Optional header parameter for sending request-response messages.
*/
  public send (data: Message['payload'], header : Message['header'] = this.getHeader(Type.MSG, data.constructor.name === 'Object' ? 'J' : 'B')) : void {
    const headerEnc = new TextEncoder().encode(`REREP ${Type[header.type]}${(header.type !== Type[Type.MSG]) ? ` ${header.id} ` : ' '}${header.format}\n`);

    const encData : String|Uint8Array = data.constructor.name === 'Object' ? new TextEncoder().encode(JSON.stringify(data)) : <any>data;

    const buffer = new Uint8Array(headerEnc.length + encData.length);

    buffer.set(headerEnc);
    buffer.set(encData as any, headerEnc.byteLength);

    if(this.WSChannel.readyState === 1){
      this.WSChannel.send(buffer);
    }
    else{
      this.WSChannel.addEventListener('open', ()=>{
        this.WSChannel.send(buffer);
      });
    }
  };

  /**
* Passthrough function for adding listeners to the underlying WebSocket channel.
*
* Although useful, should be used with discretion, e.g. not for 'message' events, which are already handled by the messageReceiver method.
* @param {string} type - Event type to be listening to (conn, message...)
* @param {(event: Event) => void} listener - Listener (event handling) function.
*/
  public addEventListener = (type : keyof WebSocketEventMap|("request"|"response"|"misc"), listener : (event : Event) => void) : void => {
    switch (type) {
    // the added listeners accept message["payload"], not Event - this function's signature follows the original semantics of addEventListener though
      case 'request':
        this.reqHandler = <any>listener;
        break;
      case 'response':
        this.resHandler = <any>listener;
        break;
      case 'misc':
        this.msgHandler = <any>listener;
        break;
      default:
        this.WSChannel.addEventListener(type, listener);
    }
  };

  /**
* New message handler, if the message is a response for any pending request, the attached promise gets resolved with the incoming data.
* @param {Uint8Array} message - WS message object containing arbitrary data
*/
  private messageReceiver = async (message : Uint8Array) : Promise<void> => {
    const parsedMessage = await Rerep.parseMessage(message);
    switch (parsedMessage.header.type) {
      case Type.RES: {
        for (let i = 0; i < this.pendingActions.length; i += 1) {
          if (this.pendingActions[i].messageID === parsedMessage.header.id) {
            const success = this.resHandler(parsedMessage.payload);
            if (success) {
              this.pendingActions[i].resolve(parsedMessage.payload);
            } else {
              this.pendingActions[i].reject(parsedMessage.payload);
            }
            this.pendingActions.splice(i, 1);
            break;
          }
        }
        break;
      }
      case Type.REQ: {
        const response = await this.reqHandler(parsedMessage.payload);
        this.send(
          response,
          {
            ...parsedMessage.header,
            type: Type.RES,
            format: response.constructor.name === 'Object' ? 'J' : 'B',
          },
        );
        break;
      }
      case Type.MSG: {
        this.msgHandler(parsedMessage);
        break;
      }
      default:
        throw new Error('Rerep error - bad message type!');
    }
  };
}
