// import { Action } from "./action";
// import { logger } from "../utilities/logger";
// import { Validate } from "./validate";
// import { Controller } from "../../controllers/controller";
// import { Models.Agent, Conversation, Info } from "../models/index";

// export const ActionPassQuestion: Action = {
//   name: "pass-question",
//   formats: [
//     {
//       infoID: "number"
//     }
//   ],
//   enact: (agent: Models.Agent, inputData: any) => {
//     const controller = new Controller();
//     const info: Info = Info.getByID(inputData.infoID);

//     controller.passOnQuestion(agent, info, agent.conversation);
//     logger.log("Event pass-question from " + agent + " on " + agent.conversation + " registered.", 2);
//     controller.sendUpdates();
//   },
//   validate: (agent: Models.Agent, socket: any, inputData: any) => {
//     let res;
//     if (!(res = Validate.validate_agent_logged_in(agent)).status) {
//       return res;
//     }
//     const conversation = agent.conversation;
//     if (!(res = Validate.validate_conversation_exists(agent.room, conversation)).status) {
//         return res;
//     }
//     if (!(res = Validate.validate_conversation_has_agent(conversation, agent)).status) {
//         return res;
//     }
//     const info: Info = Info.getByID(inputData.infoID);
//     if (!(res = Validate.validate_asked_in_conversation(info, conversation)).status) {
//         return res;
//     }
//     return Validate.successMsg;
//   }
// };
