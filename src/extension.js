import GObject from "gi://GObject";
import Gio from "gi://Gio";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import {
  QuickMenuToggle,
  SystemIndicator,
} from "resource:///org/gnome/shell/ui/quickSettings.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Warp from "./warp.js";

const WarpMenuToggle = GObject.registerClass(
  class WarpMenuToggle extends QuickMenuToggle {
    _init(extensionObject) {
      super._init({
        title: _("WARP"),
        subtitle: _(""),
        gicon: Gio.icon_new_for_string(
          extensionObject.path + "/icons/unknown.svg",
        ),
        toggleMode: true,
      });

      this._extensionObject = extensionObject;
      this._items = new Map();

      this._selectedVirtualNetwork = "";

      // Menu header
      this.menu.setHeader(
        Gio.icon_new_for_string(extensionObject.path + "/icons/unknown.svg"),
        _("WARP"),
        _("Virtual Networks"),
      );

      // Virtual networks section
      this._virtualNetworksSection = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._virtualNetworksSection);

      // Subscribe to changes
      this._subscribeToStateChange();
      this._subscribeToVirtualNetworksChange();
    }

    _subscribeToStateChange() {
      this._extensionObject.warpClient.onStateChange((state) => {
        this.checked = state === Warp.State.CONNECTED;

        let stateText = Warp.stateToString(state);
        if (state === Warp.State.CONNECTED) {
          stateText = this._selectedVirtualNetwork.name;
        }

        this.subtitle = stateText;

        let icon = "enabled.svg";
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

        const gicon = Gio.icon_new_for_string(
          this._extensionObject.path + `/icons/${icon}`,
        );

        this.gicon = gicon;
        this.menu.setHeader(gicon, _("WARP"), _("Virtual Networks"));
      });
    }

    _subscribeToVirtualNetworksChange() {
      this._extensionObject.warpClient.onVirtualNetworksChange((vnets) => {
        this._removeMenuItems();

        vnets.forEach((vnet) => {
          if (vnet.selected) {
            this._selectedVirtualNetwork = vnet;
          }

          this._addMenuItem(vnet);
        });
      });
    }

    _addMenuItem(vnet) {
      const item = new PopupMenu.PopupMenuItem(vnet.name);
      item.connect("activate", () => {
        this._extensionObject.warpClient.setVirtualNetwork(vnet.id);
      });

      if (vnet.selected) {
        item.setOrnament(PopupMenu.Ornament.CHECK);
      }

      this._items.set(vnet.id, item);
      this._virtualNetworksSection.addMenuItem(item);
    }

    _removeMenuItems() {
      this._items.forEach((item) => {
        item.destroy();
      });

      this._items.clear();
    }
  },
);

const WarpIndicator = GObject.registerClass(
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

        this._indicator.gicon = Gio.icon_new_for_string(
          extensionObject.path + `/icons/${icon}`,
        );

        const showIndicator =
          state === Warp.State.CONNECTED || state === Warp.State.CONNECTING;

        this._indicator.visible = showIndicator;
      });

      // Quick settings

      const toggle = new WarpMenuToggle(extensionObject);

      toggle.connect("clicked", () => {
        extensionObject.warpClient.toggle();
      });

      this.quickSettingsItems.push(toggle);
    }
  },
);

export default class WarpExtension extends Extension {
  enable() {
    this._indicator = new WarpIndicator(this);
    Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
  }

  disable() {
    this._indicator.quickSettingsItems.forEach((item) => item.destroy());
    this._indicator.destroy();
  }
}
