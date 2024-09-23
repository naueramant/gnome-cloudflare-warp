import GObject from "gi://GObject";
import Gio from "gi://Gio";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";
import { QuickMenuToggle } from "resource:///org/gnome/shell/ui/quickSettings.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Warp from "./warp.js";
import { getStateIcon } from "./icon.js";

export const WarpMenuToggle = GObject.registerClass(
  class WarpMenuToggle extends QuickMenuToggle {
    _init(extensionObject, warpClient) {
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

      this._warpClient = warpClient;
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
      this._warpClient.onStateChange((state) => {
        this.checked = state === Warp.State.CONNECTED;

        let stateText = Warp.stateToString(state);
        if (state === Warp.State.CONNECTED) {
          stateText = this._selectedVirtualNetwork.name;
        }

        this.subtitle = stateText;

        let icon = getStateIcon(state);

        const gicon = Gio.icon_new_for_string(
          this._extensionObject.path + `/icons/${icon}`,
        );

        this.gicon = gicon;
        this.menu.setHeader(gicon, _("WARP"), _("Virtual Networks"));
      });
    }

    _subscribeToVirtualNetworksChange() {
      this._warpClient.onVirtualNetworksChange((vnets) => {
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
        this._warpClient.setVirtualNetwork(vnet.id);
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

    destroy() {
      this._removeMenuItems();
      super.destroy();
    }
  },
);
