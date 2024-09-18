import Gio from "gi://Gio";

export const State = {
  ERROR: 0,
  UNKNOWN: 1,
  CONNECTED: 2,
  DISCONNECTED: 3,
  CONNECTING: 4,
};

export class Settings {
  constructor(organization) {
    this.organization = organization;
  }
}

export class VNet {
  constructor(id, name, isDefault, isSelected) {
    this.id = id;
    this.name = name;
    this.default = isDefault;
    this.selected = isSelected;
  }
}

export function stateToString(state) {
  switch (state) {
    case State.CONNECTED:
      return "Connected";
    case State.CONNECTING:
      return "Connecting";
    case State.DISCONNECTED:
      return "Disconnected";
    case State.ERROR:
      return "Error";
    default:
      return "Unknown";
  }
}

export class Client {
  statusPattern =
    /(Connected|Connecting|Disconnected|Registration Missing|No Network)/;

  virtualNetworksRefreshInterval = 5000;
  stateRefreshInterval = 1000;

  state = State.UNKNOWN;
  vnets = [];

  vnetEventListeners = [];
  stateEventListeners = [];

  vnetInterval = null;
  stateInterval = null;

  constructor() {
    this._startPollingIntervals();
  }

  /*
      public methods
  */

  async connect() {
    await this._setState(State.CONNECTING);
    await execute("warp-cli", ["connect"]);

    await this._getState();
  }

  async disconnect() {
    await this._setState(State.DISCONNECTED);
    await execute("warp-cli", ["disconnect"]);

    await this._getState();
  }

  async toggle() {
    if (this.state === State.CONNECTED) {
      await this.disconnect();
    } else {
      await this.connect();
    }
  }

  async setVirtualNetwork(id) {
    this._stopPollingIntervals();

    const isDisconnected = this.state === State.DISCONNECTED;

    await this._setState(State.CONNECTING);

    await execute("warp-cli", ["vnet", id]);

    if (isDisconnected) {
      await this.connect();
    }

    this._startPollingIntervals();
  }

  onStateChange(cb) {
    cb(this.state);
    this.stateEventListeners.push(cb);
  }

  onVirtualNetworksChange(cb) {
    cb(this.vnets);
    this.vnetEventListeners.push(cb);
  }

  /*
      private methods
  */

  _startPollingIntervals() {
    this._getState();
    this._getVirtualNetworks();

    this.vnetInterval = setInterval(() => {
      this._getVirtualNetworks();
    }, this.virtualNetworksRefreshInterval);

    this.stateInterval = setInterval(() => {
      this._getState();
    }, this.stateRefreshInterval);
  }

  _stopPollingIntervals() {
    clearInterval(this.vnetInterval);
    clearInterval(this.stateInterval);
  }

  async _getVirtualNetworks() {
    const virtualNetworks = [];

    try {
      const stdout = await execute("warp-cli", ["vnet"]);

      const lines = stdout.split("\n");

      const currentlySelected = lines[1].split(": ")[1];

      let id = null;
      let name = null;
      let isDefault = false;

      for (let line of lines) {
        if (line.startsWith("ID: ")) {
          id = line.split(": ")[1];
        } else if (line.startsWith("Name: ")) {
          name = line.split(": ")[1];
        } else if (line.startsWith("Default: ")) {
          isDefault = line.split(": ")[1] === "true";
          virtualNetworks.push(
            new VNet(id, name, isDefault, id === currentlySelected),
          );
        }
      }
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      // do nothing
    }

    await this._setVirtualNetworks(virtualNetworks);
  }

  async _getState() {
    let state = State.UNKNOWN;

    try {
      const stdout = await execute("warp-cli", ["status"]);
      const status = this.statusPattern.exec(stdout)?.[1];

      switch (status) {
        case "Connected":
          state = State.CONNECTED;
          break;
        case "Connecting":
          state = State.CONNECTING;
          break;
        case "Disconnected":
          state = State.DISCONNECTED;
          break;
        default:
          state = State.ERROR;
      }
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      state = State.ERROR;
    }

    await this._setState(state);
  }

  async _setState(state) {
    this.state = state;

    for (let cb of this.stateEventListeners) {
      cb(state);
    }
  }

  async _setVirtualNetworks(vnets) {
    this.vnets = vnets;

    for (let cb of this.vnetEventListeners) {
      cb(vnets);
    }
  }
}

async function execute(cmd, args) {
  try {
    const proc = Gio.Subprocess.new(
      [cmd].concat(args),
      Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    );

    const stdout = await new Promise((resolve, reject) => {
      proc.communicate_utf8_async(null, null, (proc, res) => {
        let [, stdout, stderr] = proc.communicate_utf8_finish(res);
        if (proc.get_successful()) resolve(stdout);
        reject(stderr);
      });
    });

    return stdout;
  } catch (e) {
    return {
      stdout: "",
      stderr: e.message,
    };
  }
}
