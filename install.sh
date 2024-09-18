#!/bin/bash

# Delete existing copy of the extension
rm -rf ~/.local/share/gnome-shell/extensions/cloudflare-warp@naueramant.github.com
mkdir -p ~/.local/share/gnome-shell/extensions/cloudflare-warp@naueramant.github.com

# Copy extension source to the directory
cp -a "src/." ~/.local/share/gnome-shell/extensions/cloudflare-warp@naueramant.github.com

# Enble the extension
gnome-extensions enable cloudflare-warp@naueramant.github.com

# Inform the user to restart GNOME Shell
echo "Please restart GNOME Shell by pressing Alt + F2 and typing 'r' and pressing Enter"
