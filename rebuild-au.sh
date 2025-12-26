#!/bin/bash
# OSSIAN-19 AU Plugin Rebuild Script
# Rebuilds plugins and clears AU cache for testing

set -e

echo "🔨 Building AU plugins..."
cd "$(dirname "$0")"

# Build JUCE plugins
cd juce-plugins/build
cmake --build . --config Release -j8

echo ""
echo "🧹 Clearing AU cache..."
killall -9 AudioComponentRegistrar 2>/dev/null || true
rm -rf ~/Library/Caches/AudioUnitCache 2>/dev/null || true

echo ""
echo "✅ Done! Restart your DAW to see changes."
echo ""
echo "Installed plugins:"
ls -la ~/Library/Audio/Plug-Ins/Components/ | grep -i ossian
