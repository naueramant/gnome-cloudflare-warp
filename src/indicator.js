import GObject from "gi://GObject";
import Gio from "gi://Gio";
import { SystemIndicator } from "resource:///org/gnome/shell/ui/quickSettings.js";
import * as Warp from "./warp.js";
import { WarpMenuToggle } from "./menu.js";
import { getStateIcon } from "./icon.js";

export const WarpIndicator = GObject.registerClass(
  class WarpIndicator extends SystemIndicator {
    constructor(extensionObject) {
      super();

      extensionObject.warpClient = new Warp.Client();

      // Indicator

      this._indicator = this._addIndicator();
      this._indicator.gicon = Gio.icon_new_for_string(
        extensionObject.path + "/icons/unknown.svg",
      );
      this._indicator.visible = false;

      extensionObject.warpClient.onStateChange((state) => {
        let icon = getStateIcon(state);

        this._indicator.gicon = Gio.icon_new_for_string(
          extensionObject.path + `/icons/${icon}`,
        );

        const showIndicator =
          state === Warp.State.CONNECTED || state === Warp.State.CONNECTING;

        this._indicator.visible = showIndicator;
      });

      // Quick setting

      const toggle = new WarpMenuToggle(extensionObject);

      toggle.connect("clicked", () => {
        extensionObject.warpClient.toggle();
      });

      this.quickSettingsItems.push(toggle);
    }
  },
);
