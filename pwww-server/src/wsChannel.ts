var ws = require('ws');

class WSChannel {
	private port : number;
	private connection : any = null

	private wschannel: any = null;

	constructor(port: number){
		this.port = port;
	}

	connectionHandler = (conn, messageCallback : (message: any) => void, closeCallback : () => void) => {
		if(this.connection !== null){
			console.error("Connection is already established, new attempt rejected...");
			conn.terminate();
		}

		this.connection = conn;
		this.connection.on('close', () => {
			closeCallback();
			this.connection = null;
		})

		this.connection.on('message', messageCallback);
	}

	start = (newMessageCallback : (message: any) => void, closeCallback : () => void) => {
		if(this.wschannel === null){
			this.wschannel = new ws.Server({port: this.port});
			this.wschannel.on('connection', (conn) => this.connectionHandler(conn,newMessageCallback,closeCallback));
		}
		else{
			throw ("This WebSocket channel is already running at port " + this.port);
		}
	}

	send = (data: any) : void => {
		if(this.connection === null){
			throw ("This WebSockets channel is not connected to anything.");
		}

		this.connection.send(data);
	}
}

export default WSChannel;