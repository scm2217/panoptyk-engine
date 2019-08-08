import { PEvent } from "./pEvent";
import { logger } from "../../utilities/logger";
import { Validate } from "../validate";
import { control } from "../../../server/controllers/controller";

export class eventReadyTrade extends PEvent {
  private static _eventName = "ready-trade";
  public static get eventName() {
    return eventReadyTrade._eventName;
  }
  private static _formats =  [{
    "trade_id": "number",
    "ready_status": "boolean"
  }];
  public static get formats() {
    return eventReadyTrade._formats;
  }

  public ready_status;
  public trade;

  /**
   * Event model.
   * @param {Object} socket - socket.io client socket object.
   * @param {Object} inputData - raw input recieved.
   */
  constructor(socket, inputData) {
    super(socket, inputData);
    let res;

    if (!(res = eventReadyTrade.validate(inputData, this.fromAgent)).status) {
      logger.log("Bad event readyTrade data (" + JSON.stringify(inputData) + ").", 1);
      // TODO server.send.event_failed(socket, eventReadyTrade._eventName, res.message);
      return;
    }

    this.trade = res.trade;
    this.ready_status = inputData.ready_status;

    control.set_trade_agent_status(this.trade, this.fromAgent, this.ready_status);

    (Validate.objects = Validate.objects || []).push(this);
    logger.log("Event ready-trade " + this.trade.trade_id + " registered.", 2);
  }

  /**
   * Event validation.
   * @param {Object} structure - raw input recieved.
   * @param {Object} agent - agent associated with this event.
   * @return {Object}
   */
  static validate(structure, agent) {
    let res;
    if (!(res = Validate.validate_agent_logged_in(agent)).status) {
      return res;
    }
    if (!(res = Validate.validate_key_format(eventReadyTrade._formats, structure)).status) {
      return res;
    }
    if (!(res = Validate.validate_trade_exists(structure.trade_id)).status) {
      return res;
    }
    if (!(res = Validate.validate_trade_status(res.trade, [2])).status) {
      return res;
    }
    if (!(res = Validate.validate_ready_status(res.trade, agent, !structure.ready_status)).status) {
      return res;
    }
    const res2 = res;
    if (!(res = Validate.validate_agent_logged_in(res.trade.agent_ini)).status) {
      return res;
    }

    return {status: true, message: "", trade: res2.trade};
  }

}