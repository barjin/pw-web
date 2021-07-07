var ws = require('ws');

class WSChannel {
	port : number;
	connection : any = null

	wschannel: any = null;

	constructor(port: number){
		this.port = port;
	}

	connectionHandler = (conn, messageCallback) => {
		if(this.connection !== null){
			console.error("Connection is already established, new attempt rejected...");
			conn.terminate();
		}

		this.connection = conn;
		this.connection.on('close', () => {
			this.connection = null;
		})

		this.connection.on('message', messageCallback);
	}

	start = (newMessageCallback : (message: any) => void) => {
		if(this.wschannel === null){
			this.wschannel = new ws.Server({port: this.port});
			this.wschannel.on('connection', (conn) => this.connectionHandler(conn,newMessageCallback));
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