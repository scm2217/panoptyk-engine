import * as fs from "fs";
import express from "express";
import http from "http";
import socketIO from "socket.io";
import { ConnectionController } from "./controllers";
import {
  logger,
  LOG,
  inject,
  PanoptykSettings,
  SocketAgentMap,
} from "./utilities";
import { Agent } from "./models";
import {
  Action,
  ActionLogin,
  ActionMoveToRoom,
  ActionRequestConversation,
  ActionLeaveConversation,
  ActionTakeItems,
  ActionDropItems,
  ActionRejectConversationRequest,
  ActionJoinConversation,
} from "./action/index";
import * as Validate from "./validate";

const defaultActions: Action[] = [
  ActionLogin,
  ActionMoveToRoom,
  ActionDropItems,
  ActionTakeItems,
  ActionRequestConversation,
  ActionRejectConversationRequest,
  ActionJoinConversation,
  ActionLeaveConversation,
];

const MIN_TIME_BETWEEN_ACTIONS = 100; // in ms

export class Server {
  _timeBetweenActions = MIN_TIME_BETWEEN_ACTIONS;
  get timeBetweenActions() {
    return this._timeBetweenActions;
  }
  set timeBetweenActions(t: number) {
    this._timeBetweenActions = t;
  }
  _timeSinceLastMsg: Map<socketIO.Socket, number> = new Map<
    socketIO.Socket,
    number
  >();
  _app: express.Application;
  _server: http.Server;
  _io: socketIO.Server;
  _port: string | number;

  _actions: Action[] = [];

  constructor(app?: express.Application) {
    this._actions = defaultActions;
    this._createApp(app);
    this._loadConfig();
    this._createServer();
    this._makeSockets();
  }

  _createApp(app?: express.Application): void {
    this._app = app ? app : express();
  }

  _createServer(): void {
    this._server = http.createServer(this._app);
  }

  _makeSockets(): void {
    this._io = socketIO(this._server);
  }

  _loadConfig(): void {
    const settingsM = inject.settingsManager;
    // Read settings
    try {
      const json = JSON.parse(
        fs.readFileSync("panoptyk-settings.json").toString()
      );
      settingsM.setSettings(json);
      logger.log("Panoptyk settings loaded...", "SERVER");
    } catch (err) {
      logger.log("No panoptyk settings found... creating one.", "SERVER");
      fs.writeFileSync(
        "panoptyk-settings.json",
        JSON.stringify(PanoptykSettings.default)
      );
    }

    // Report settings
    logger.log("Panoptyk Settings:", "SERVER");
    for (const key in settingsM.settings) {
      logger.log(
        key + ": " + JSON.stringify(settingsM.settings[key]),
        "SERVER"
      );
    }
  }

  /**
   * These are client -> server messages.
   * This file should not need to be modified. To add new events, create new
   * event files in models/events
   */
  _listen(): void {
    // Assign port
    this._port = inject.settingsManager.settings.port;

    this._server.listen(this._port, () => {
      logger.log("Starting server on port " + this._port, "SERVER");
    });

    // Adds hook to set up all action hooks for each client
    this._io.on("connection", (socket) => {
      logger.log("Web client Connected", "SERVER");

      for (const action of this._actions) {
        socket.on(
          action.name,
          (data, callback: (res: Validate.ValidationResult) => void) => {
            // Enforce action limit
            const now = Date.now();
            if (
              this._timeSinceLastMsg.has(socket) &&
              now - this._timeSinceLastMsg.get(socket) <
                this._timeBetweenActions
            ) {
              callback({
                success: false,
                errorCode: Validate.ValidationError.TooManyActions,
                message:
                  "You can only act once every " +
                  this._timeBetweenActions +
                  " milliseconds!",
              });
              return;
            }
            this._timeSinceLastMsg.set(socket, now);

            // Process action
            logger.log("Action recieved: " + action.name, "SERVER");
            const agent = SocketAgentMap.getAgentFromSocket(socket);
            let res: Validate.ValidationResult;
            if (
              (res = Validate.keyFormat(action.formats, data)).success // TODO &&
              // (res = Validate.factionType_requirement(
              //   action.requiredFactionType,
              //   agent
              // )).success
            ) {
              res = action.validate(agent, socket, data);
              if (res.success) {
                action.enact(agent, data);
              } else {
                logger.log(
                  "Action failed to validate: " + res.message,
                  "SERVER",
                  LOG.WARN
                );
              }
            }
            callback(res);
          }
        );
      }

      socket.on("disconnect", (data) => {
        logger.log("Client disconnected", "SERVER");
        const agent = SocketAgentMap.getAgentFromSocket(socket);
        if (agent) {
          const cc: ConnectionController = new ConnectionController();
          cc.logout(agent);
        }
        SocketAgentMap.removeAgentSocket(socket, agent);
      });
    });
  }

  async _loadModels() {
    return inject.db.load();
  }

  async _saveModels() {
    return await inject.db.save();
  }

  _logoutAll() {
    const agents: Agent[] = inject.db.retrieveModels(
      [...SocketAgentMap._agentSocket.keys()],
      Agent
    ) as Agent[];
    agents.forEach((agent) => {
      if (agent) {
        const cc: ConnectionController = new ConnectionController();
        cc.logout(agent);
      }
    });
  }

  start() {
    let loaded = false;
    this._loadModels().finally(() => {
      console.log("in finally");
      loaded = true;
    });

    // Sets up "ctrl + c" to stop server
    process.on("SIGINT", () => {
      logger.log("Shutting down...", "SERVER");
      this._logoutAll();
      let done = false;
      this._saveModels().finally(() => {
        done = true;
      });
      logger.log("Server closed", "SERVER");
      process.exit(0);
    });

    // Start http server
    this._listen();
  }
}
