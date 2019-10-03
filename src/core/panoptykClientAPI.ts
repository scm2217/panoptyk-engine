import * as io from "socket.io-client";
import { ValidationResult } from "./models/validate";
import { Agent, Room, Info, Trade, Item, Conversation } from "./models";

const MODELS: any = {
  Agent,
  Room,
  Info,
  Item,
  Trade,
  Conversation,
};

// This should point to the url of the game server
const socket = io.connect("http://localhost:8080");

// Sets up the hook to recieve updates on relevant models
socket.on("updateModels", data => {
  console.log("Model updates recieved");
  console.log(data);
  for (const key in data) {
    for (const model of data[key]) {
      MODELS[key].load(model);
    }
  }
});



const emit = function(event: string, payload: any): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (result: ValidationResult) => {
      resolve(result);
    });
  });
};

export class ClientAPI {
  public static actionSent = false;
  private static playerAgentName = undefined;
  private static _playerAgent: Agent = undefined;
  public static get playerAgent(): Agent {
    // No name to use to find agent
    if (!ClientAPI.playerAgentName) {
      return undefined;
    }
    // Skip searching for player agent if already found
    if (ClientAPI._playerAgent && ClientAPI._playerAgent.agentName === ClientAPI.playerAgentName) {
      // Get latest verison of player
      return (ClientAPI._playerAgent = Agent.getByID(ClientAPI._playerAgent.id));
    }
    // Search for player agent
    return (ClientAPI._playerAgent = Agent.getAgentByName(ClientAPI.playerAgentName));
  }

  private static async sendWrapper(event: string, payload: any) {
    if (ClientAPI.actionSent) {
      const res: ValidationResult = {
        status: false,
        message: "Please wait for action to complete!"
      };
      throw res;
    }
    ClientAPI.actionSent = true;
    const res = await emit(event, payload);
    ClientAPI.actionSent = false;
    if (res.status) {
        return res;
    }
    else {
        throw res.message;
    }
  }

  public static async login(name: string, password: string) {
    const res = await ClientAPI.sendWrapper("login", { username: name, password });
    ClientAPI.playerAgentName = name;
    return res;
  }

  /**
   * Assumes agent has logged into server
   * @param room room to move to
   * @param agent for admins move other agents around
   */
  public static async moveToRoom(room: number | Room, agent?: Agent) {
    agent = agent ? agent : ClientAPI._playerAgent;
    const res = await ClientAPI.sendWrapper("move-to-room", {roomID: typeof room === "number" ? room : room.id});
    return res;
  }
}
