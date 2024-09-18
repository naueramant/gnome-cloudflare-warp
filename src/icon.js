import * as Warp from "./warp.js";

export function getStateIcon(state) {
  let icon = "unknown.svg";
  switch (state) {
    case Warp.State.CONNECTED:
      icon = "enabled.svg";
      break;
    case Warp.State.CONNECTING:
      icon = "connecting.svg";
      break;
    case Warp.State.DISCONNECTED:
    case Warp.State.ERROR:
      icon = "disabled.svg";
      break;
  }
  return icon;
}
