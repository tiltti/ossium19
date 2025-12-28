#include "AlgorithmDisplay.h"
#include <algorithm>
#include <set>

AlgorithmDisplay::AlgorithmDisplay()
{
}

void AlgorithmDisplay::setAlgorithm(int algoIndex)
{
    if (algoIndex >= 0 && algoIndex < 32 && algoIndex != currentAlgo)
    {
        currentAlgo = algoIndex;
        repaint();
    }
}

std::array<AlgorithmDisplay::OpPosition, 6> AlgorithmDisplay::calculateLayout(
    const FmAlgorithm& algo, float width, float height)
{
    std::array<OpPosition, 6> positions;
    std::set<int> carrierSet(algo.carriers.begin(), algo.carriers.end());

    // Level-based layout: calculate distance from carrier for each operator
    // Carriers are level 0, their modulators are level 1, etc.
    std::array<int, 6> level = {-1, -1, -1, -1, -1, -1};

    // Start with carriers at level 0
    for (int c : algo.carriers)
    {
        level[c] = 0;
    }

    // Iteratively assign levels to modulators
    bool changed = true;
    int iterations = 0;
    while (changed && iterations < 10)
    {
        changed = false;
        iterations++;
        for (int i = 0; i < 6; ++i)
        {
            if (level[i] >= 0) continue;  // already assigned

            // Check if we modulate anyone with a known level
            for (int target : algo.modulatesTo[i])
            {
                int targetLevel = level[target];
                if (targetLevel >= 0)
                {
                    int newLevel = targetLevel + 1;
                    if (level[i] < 0 || newLevel > level[i])
                    {
                        level[i] = newLevel;
                        changed = true;
                    }
                }
            }
        }
    }

    // Assign level 0 to any unassigned operators (shouldn't happen)
    for (int i = 0; i < 6; ++i)
    {
        if (level[i] < 0) level[i] = 0;
    }

    // Find max level
    int maxLevel = 0;
    for (int i = 0; i < 6; ++i)
    {
        if (level[i] > maxLevel) maxLevel = level[i];
    }

    // Group operators by level
    std::vector<std::vector<int>> byLevel(maxLevel + 1);
    for (int i = 0; i < 6; ++i)
    {
        byLevel[level[i]].push_back(i);
    }

    // Sort operators within each level
    for (auto& ops : byLevel)
    {
        std::sort(ops.begin(), ops.end());
    }

    // Calculate positions
    float paddingX = 20.0f;
    float paddingTop = 10.0f;
    float paddingBottom = 30.0f;  // For output line
    float availableHeight = height - paddingTop - paddingBottom;
    float availableWidth = width - paddingX * 2;

    // Check if we need zigzag layout for long single chains
    bool needsZigzag = maxLevel >= 4 && algo.carriers.size() == 1;

    if (needsZigzag)
    {
        // Zigzag layout: split into 2 rows
        int midLevel = (maxLevel + 1) / 2;
        float topRowY = paddingTop + availableHeight * 0.25f;
        float bottomRowY = paddingTop + availableHeight * 0.75f;

        // Count ops in each row
        int topRowCount = 0;
        int bottomRowCount = 0;
        for (int lvl = 0; lvl <= maxLevel; ++lvl)
        {
            if (lvl > midLevel) topRowCount += (int)byLevel[lvl].size();
            else bottomRowCount += (int)byLevel[lvl].size();
        }

        // Position operators
        int topIdx = 0;
        int bottomIdx = 0;

        for (int lvl = maxLevel; lvl >= 0; --lvl)
        {
            const auto& ops = byLevel[lvl];
            if (ops.empty()) continue;

            if (lvl > midLevel)
            {
                // Top row
                float spacing = availableWidth / (float)(topRowCount + 1);
                for (int op : ops)
                {
                    float x = paddingX + spacing * (float)(topIdx + 1);
                    positions[op] = { x, topRowY };
                    topIdx++;
                }
            }
            else
            {
                // Bottom row
                float spacing = availableWidth / (float)(bottomRowCount + 1);
                for (int op : ops)
                {
                    float x = paddingX + spacing * (float)(bottomIdx + 1);
                    positions[op] = { x, bottomRowY };
                    bottomIdx++;
                }
            }
        }
    }
    else
    {
        // Standard level-based layout
        int numRows = maxLevel + 1;
        float rowHeight = numRows > 1 ? availableHeight / (float)numRows : availableHeight;

        // Position operators
        for (int lvl = 0; lvl <= maxLevel; ++lvl)
        {
            const auto& ops = byLevel[lvl];
            if (ops.empty()) continue;

            // Y position: higher levels at top, carriers (level 0) at bottom
            float y = paddingTop + (float)(maxLevel - lvl) * rowHeight + rowHeight / 2.0f;

            // X positions: spread evenly across width
            float spacing = availableWidth / (float)(ops.size() + 1);

            for (size_t i = 0; i < ops.size(); ++i)
            {
                int op = ops[i];
                float x = paddingX + spacing * (float)(i + 1);
                positions[op] = { x, y };
            }
        }
    }

    return positions;
}

void AlgorithmDisplay::drawOperator(juce::Graphics& g, int op, float x, float y,
                                     float radius, bool isCarrier)
{
    juce::Colour opColor(OP_COLORS[op]);

    if (isCarrier)
    {
        // Filled circle for carrier
        g.setColour(opColor);
        g.fillEllipse(x - radius, y - radius, radius * 2, radius * 2);

        // White border
        g.setColour(juce::Colours::white.withAlpha(0.8f));
        g.drawEllipse(x - radius, y - radius, radius * 2, radius * 2, 2.0f);
    }
    else
    {
        // Outline circle for modulator
        g.setColour(opColor.withAlpha(0.3f));
        g.fillEllipse(x - radius, y - radius, radius * 2, radius * 2);

        g.setColour(opColor);
        g.drawEllipse(x - radius, y - radius, radius * 2, radius * 2, 2.0f);
    }

    // Operator number
    g.setColour(isCarrier ? juce::Colours::black : opColor.brighter(0.3f));
    g.setFont(juce::FontOptions(radius * 1.2f).withStyle("Bold"));
    g.drawText(juce::String(op + 1),
               (int)(x - radius), (int)(y - radius),
               (int)(radius * 2), (int)(radius * 2),
               juce::Justification::centred);
}

void AlgorithmDisplay::drawConnection(juce::Graphics& g, float x1, float y1, float x2, float y2)
{
    g.setColour(juce::Colour(0xffaaaaaa));

    // Draw line with arrow
    juce::Path path;
    path.startNewSubPath(x1, y1);
    path.lineTo(x2, y2);
    g.strokePath(path, juce::PathStrokeType(1.5f));

    // Arrow head at destination
    float angle = std::atan2(y2 - y1, x2 - x1);
    float arrowLen = 8.0f;
    float arrowAngle = 0.5f;

    juce::Path arrow;
    arrow.startNewSubPath(x2, y2);
    arrow.lineTo(x2 - arrowLen * std::cos(angle - arrowAngle),
                 y2 - arrowLen * std::sin(angle - arrowAngle));
    arrow.lineTo(x2 - arrowLen * std::cos(angle + arrowAngle),
                 y2 - arrowLen * std::sin(angle + arrowAngle));
    arrow.closeSubPath();
    g.fillPath(arrow);
}

void AlgorithmDisplay::drawFeedback(juce::Graphics& g, float x, float y, float radius)
{
    g.setColour(juce::Colour(0xffffaa00));

    // Draw feedback loop (curved arrow pointing back to itself)
    float loopRadius = radius * 0.8f;
    float startAngle = -2.5f;
    float endAngle = 0.8f;

    juce::Path arc;
    arc.addCentredArc(x + radius + loopRadius * 0.5f, y,
                      loopRadius, loopRadius,
                      0.0f, startAngle, endAngle, true);
    g.strokePath(arc, juce::PathStrokeType(1.5f));

    // Arrow at end of arc
    float arrowX = x + radius + loopRadius * 0.5f + loopRadius * std::cos(endAngle);
    float arrowY = y + loopRadius * std::sin(endAngle);

    juce::Path arrow;
    arrow.startNewSubPath(arrowX, arrowY);
    arrow.lineTo(arrowX - 5, arrowY - 5);
    arrow.lineTo(arrowX + 3, arrowY - 3);
    arrow.closeSubPath();
    g.fillPath(arrow);
}

juce::String AlgorithmDisplay::buildDescriptionText(const FmAlgorithm& algo)
{
    juce::String desc;

    // Build modulation description
    juce::String modDesc;
    for (int i = 0; i < 6; ++i)
    {
        if (!algo.modulatesTo[i].empty())
        {
            if (modDesc.isNotEmpty())
                modDesc += "  ";

            modDesc += juce::String(i + 1) + juce::String(juce::CharPointer_UTF8("\xe2\x86\x92"));

            if (algo.modulatesTo[i].size() == 1)
            {
                modDesc += juce::String(algo.modulatesTo[i][0] + 1);
            }
            else
            {
                modDesc += "(";
                for (size_t j = 0; j < algo.modulatesTo[i].size(); ++j)
                {
                    if (j > 0) modDesc += ",";
                    modDesc += juce::String(algo.modulatesTo[i][j] + 1);
                }
                modDesc += ")";
            }
        }
    }

    // Build carriers description
    juce::String carDesc = "OUT: ";
    for (size_t i = 0; i < algo.carriers.size(); ++i)
    {
        if (i > 0) carDesc += ",";
        carDesc += juce::String(algo.carriers[i] + 1);
    }

    // Build feedback description
    juce::String fbDesc;
    if (algo.feedbackOp >= 0)
    {
        fbDesc = "FB: " + juce::String(algo.feedbackOp + 1);
    }

    if (modDesc.isNotEmpty())
        desc = "MOD: " + modDesc + "   ";
    desc += carDesc;
    if (fbDesc.isNotEmpty())
        desc += "   " + fbDesc;

    return desc;
}

void AlgorithmDisplay::paint(juce::Graphics& g)
{
    auto bounds = getLocalBounds().toFloat();

    // LCD-style background
    g.setColour(juce::Colour(0xff151515));
    g.fillRoundedRectangle(bounds, 6.0f);

    // Border
    g.setColour(juce::Colour(0xff404040));
    g.drawRoundedRectangle(bounds.reduced(0.5f), 6.0f, 1.0f);

    // Inner glow
    g.setColour(juce::Colour(0xff1a1a1a));
    g.fillRoundedRectangle(bounds.reduced(3.0f), 4.0f);

    const FmAlgorithm& algo = FM_ALGORITHMS[currentAlgo];

    // Title
    g.setColour(juce::Colour(0xffffcc00));
    g.setFont(juce::FontOptions(16.0f).withStyle("Bold"));
    g.drawText("ALG " + juce::String(currentAlgo + 1),
               bounds.removeFromTop(24.0f),
               juce::Justification::centred);

    // Calculate layout
    float displayWidth = bounds.getWidth() - 20.0f;
    float displayHeight = bounds.getHeight() - 40.0f;  // Leave room for description
    float offsetX = bounds.getX() + 10.0f;
    float offsetY = bounds.getY();

    auto positions = calculateLayout(algo, displayWidth, displayHeight);

    // Determine carriers
    std::set<int> carrierSet(algo.carriers.begin(), algo.carriers.end());

    float radius = 14.0f;

    // Draw connections first (behind operators)
    for (int fromOp = 0; fromOp < 6; ++fromOp)
    {
        for (int toOp : algo.modulatesTo[fromOp])
        {
            float x1 = offsetX + positions[fromOp].x;
            float y1 = offsetY + positions[fromOp].y + radius;
            float x2 = offsetX + positions[toOp].x;
            float y2 = offsetY + positions[toOp].y - radius;

            drawConnection(g, x1, y1, x2, y2);
        }
    }

    // Draw output line
    g.setColour(juce::Colour(0xff666666));
    float outputY = offsetY + displayHeight * 0.82f;
    g.drawLine(offsetX + displayWidth * 0.15f, outputY,
               offsetX + displayWidth * 0.85f, outputY, 2.0f);

    g.setColour(juce::Colour(0xff888888));
    g.setFont(juce::FontOptions(10.0f));
    g.drawText("OUTPUT", (int)(offsetX + displayWidth * 0.35f), (int)(outputY + 2),
               (int)(displayWidth * 0.3f), 14, juce::Justification::centred);

    // Draw operators
    for (int i = 0; i < 6; ++i)
    {
        float x = offsetX + positions[i].x;
        float y = offsetY + positions[i].y;
        bool isCarrier = carrierSet.find(i) != carrierSet.end();

        drawOperator(g, i, x, y, radius, isCarrier);

        // Draw feedback indicator
        if (i == algo.feedbackOp)
        {
            drawFeedback(g, x, y, radius);
        }
    }

    // Draw description text
    g.setColour(juce::Colour(0xffaaaaaa));
    g.setFont(juce::FontOptions(11.0f));
    juce::String desc = buildDescriptionText(algo);
    g.drawText(desc, bounds.removeFromBottom(20.0f).reduced(5.0f, 0.0f),
               juce::Justification::centred);
}
