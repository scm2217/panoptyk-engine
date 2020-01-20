import { Action } from "./action";
import { logger } from "../../utilities/logger";
import { Validate } from "../validate";
import { Controller } from "../../controllers/controller";
import { Agent } from "../index";

export const ActionModifyAgentFaction: Action = {
  name: "modify-agent-faction",
  formats: [
    {
      agentID: "number",
      faction: "string",
      rank: "number"
    }
  ],
  enact: (agent: Agent, inputData: any) => {
    const controller = new Controller();
    const targetAgent: Agent = Agent.getByID(inputData.agentID);
    controller.modifyAgentFaction(targetAgent, inputData.faction, inputData.rank);
    logger.log("Event modify-agent-faction from (" + agent + ") targeting " + targetAgent + " registered.", 2);

    controller.sendUpdates();
  },
  validate: (agent: Agent, socket: any, inputData: any) => {
    let res;
    if (!(res = Validate.validate_agent_logged_in(agent)).status) {
      return res;
    }
    // TODO: add appropiate validation once factions are flushed out
    return Validate.successMsg;
  }
};