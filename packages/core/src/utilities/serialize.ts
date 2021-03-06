import {
  IModel,
  Agent,
  Room,
  Information,
  Item,
  Trade,
  Conversation,
  Quest,
  Faction,
} from "../models";
import { inject } from "../utilities";
import { SmartJSON } from "./smartJSON";

export class Serialize {
  static model(m: IModel): string {
    return SmartJSON.stringify(m.toJSON(false, {}));
  }
}

export class Deserialize {
  static model(data: string, key: string): IModel {
    let model;
    const modelJson = SmartJSON.parse(data);
    switch (key) {
      case Agent.name:
        model = inject.db.retrieveModel(modelJson.id, Agent);
        if (model === undefined) {
          model = new Agent("", undefined, modelJson.id);
        }
        model.fromJSON(modelJson);
        break;
      case Information.name:
        model = inject.db.retrieveModel(modelJson.id, Information);
        if (model === undefined) {
          model = new Information(
            "",
            undefined,
            undefined,
            undefined,
            modelJson.id
          );
        }
        model.fromJSON(modelJson);
        break;
      case Item.name:
        model = inject.db.retrieveModel(modelJson.id, Item);
        if (model === undefined) {
          model = new Item("", "", undefined, undefined, undefined, modelJson.id);
        }
        model.fromJSON(modelJson);
        break;
      case Room.name:
        model = inject.db.retrieveModel(modelJson.id, Room);
        if (model === undefined) {
          model = new Room("", 1, modelJson.id);
        }
        model.fromJSON(modelJson);
        break;
      case Trade.name:
        model = inject.db.retrieveModel(modelJson.id, Trade);
        if (model === undefined) {
          model = new Trade(modelJson.id);
        }
        model.fromJSON(modelJson);
        break;
      case Conversation.name:
        model = inject.db.retrieveModel(modelJson.id, Conversation);
        if (model === undefined) {
          model = new Conversation(undefined, modelJson.id);
        }
        model.fromJSON(modelJson);
        break;
      case Quest.name:
        model = inject.db.retrieveModel(modelJson.id, Quest);
        if (model === undefined) {
          model = new Quest(modelJson.id);
        }
        model.fromJSON(modelJson);
        break;
      case Faction.name:
        model = inject.db.retrieveModel(modelJson.id, Faction);
        if (model === undefined) {
          model = new Faction("", undefined, modelJson.id);
        }
        model.fromJSON(modelJson);
        break;
      default:
        break;
    }
    return model;
  }
}
