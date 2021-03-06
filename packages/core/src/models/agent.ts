import { IDatabase } from "../database/IDatabase";
import { BaseModel } from "./Imodel";
import { Room } from "./room";
import { Item } from "./item";
import { Info, Information } from "./information";
import { Quest } from "./quest";
import { Conversation } from "./conversation";
import { Faction } from "./faction";
import { Trade } from "./trade";
import { logger } from "../utilities";


export class Agent extends BaseModel {
  _agentName: string;
  get agentName(): string {
    return this._agentName;
  }
  _room: number;
  get room() {
    return this.db.retrieveModel(this._room, Room) as Room;
  }
  set room(room: Room) {
    this._room = room ? room.id : -1;
  }
  _inventory: Set<number>;
  get inventory(): Item[] {
    return this.db.retrieveModels([...this._inventory], Item) as Item[];
  }
  _knowledge: Set<number>;
  get knowledge(): Info[] {
    return this.db.retrieveModels([...this._knowledge], Information) as Info[];
  }
  _assignedQuests: Set<number>;
  get activeAssignedQuests(): Quest[] {
    return this.db.retrieveModels([...this._assignedQuests], Quest) as Quest[];
  }
  _givenQuests: Set<number>;
  get activeGivenQuests(): Quest[] {
    return this.db.retrieveModels([...this._givenQuests], Quest) as Quest[];
  }
  _conversation = -1;
  get conversation(): Conversation {
    return this.db.retrieveModel(this._conversation, Conversation) as Conversation;
  }
  set conversation(conversation: Conversation) {
    this._conversation = conversation ? conversation.id : -1;
  }

  /**
   * Other agents to this agent
   */
  _conversationRequests: Set<number>;
  get conversationRequesters(): Agent[] {
    return this.db.retrieveModels([...this._conversationRequests], Agent) as Agent[];
  }
  /**
   * This agent to other agents
   */
  _conversationRequested: Set<number>;
  get conversationRequested(): Agent[] {
    return this.db.retrieveModels([...this._conversationRequested], Agent) as Agent[];
  }
  _trade = -1;
  get trade(): Trade {
    return this.db.retrieveModel(this._trade, Trade) as Trade;
  }
  set trade(trade: Trade) {
    this._trade = trade ? trade.id : -1;
  }
  /**
   * Other agents to this agent
   */
  _tradeRequests: Set<number>;
  get tradeRequesters(): Agent[] {
    return this.db.retrieveModels([...this._tradeRequests], Agent) as Agent[];
  }

  /**
   * This agent to other agents
   */
  _tradeRequested: Set<number>;
  get tradeRequested(): Agent[] {
    return this.db.retrieveModels([...this._tradeRequested], Agent) as Agent[];
  }
  _gold: number;
  get gold(): number {
    return this._gold;
  }
  _faction: number;
  get faction(): Faction {
    return this.db.retrieveModel(this._faction, Faction) as Faction;
  }
  set faction(newFaction: Faction) {
    this._faction = newFaction ? newFaction.id : -1;
  }
  get factionRank(): number {
    if (this.faction) {
      return this.faction.getAgentRank(this);
    }
    return undefined;
  }

  constructor(username: string, room?: Room, id?: number, db?: IDatabase) {
    super(id, db);
    this._agentName = username;
    this.room = room;
    this._inventory = new Set<number>();
    this._knowledge = new Set<number>();
    this._gold = 0;
    this._conversationRequests = new Set<number>();
    this._conversationRequested = new Set<number>();
    this._tradeRequests = new Set<number>();
    this._tradeRequested = new Set<number>();
    this._assignedQuests = new Set<number>();
    this._givenQuests = new Set<number>();

    logger.log("Agent " + this + " Initialized.", "AGENT");
  }

  toJSON(forClient: boolean, context: any): object {
    const safeAgent = super.toJSON(forClient, context);
    if (forClient) {
      if (context && context.agent instanceof Agent) {
        const agent: Agent = context.agent;
        if (agent.id !== this.id) {
          // TODO: Remove hidden data
        }
      }
    }
    return safeAgent;
  }
  displayName(): string {
    return this._agentName;
  }
  toString(): string {
    return this._agentName + " (id#" + this.id + ")";
  }
  equals(model: any) {
    return model instanceof Agent && this.id === model.id;
  }

  activeConversationRequestTo(other: Agent): boolean {
    return this._conversationRequested.has(other.id);
  }

  activeTradeRequestTo(other: Agent): boolean {
    return this._tradeRequested.has(other.id);
  }

  inConversation(): boolean {
    return this._conversation > 0;
  }

  getInfoRef(targetInfo: Info): Info {
    throw new Error("Method not implemented.");
  }

  hasItem(item: Item): boolean {
    return this._inventory.has(item.id);
  }

  hasInfo(info: Info): boolean {
    return this._knowledge.has(info.id);
  }

  hasGold(gold: number): boolean {
    return this._gold >= gold;
  }

}
