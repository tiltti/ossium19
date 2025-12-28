#pragma once

#include <juce_gui_basics/juce_gui_basics.h>
#include <array>
#include <vector>

//==============================================================================
// FM Algorithm data structure
//==============================================================================
struct FmAlgorithm
{
    // For each operator (0-5), list which operators it modulates (empty = carrier)
    std::vector<int> modulatesTo[6];
    // Which operator has feedback (−1 = none)
    int feedbackOp;
    // Carriers (operators that output to audio)
    std::vector<int> carriers;
};

//==============================================================================
// All 32 DX7-style FM algorithms
//==============================================================================
inline const FmAlgorithm FM_ALGORITHMS[32] = {
    // ALG 1: Serial 1→2→3→4→5→6
    { .modulatesTo = {{1}, {2}, {3}, {4}, {5}, {}}, .feedbackOp = 0, .carriers = {5} },

    // ALG 2: 1→2, 2→3→4→5→6
    { .modulatesTo = {{1}, {2}, {3}, {4}, {5}, {}}, .feedbackOp = 1, .carriers = {5} },

    // ALG 3: 1→3, 2→3→4→5→6
    { .modulatesTo = {{2}, {2}, {3}, {4}, {5}, {}}, .feedbackOp = 2, .carriers = {5} },

    // ALG 4: 1→2→3→4→5→6 with FB on 4
    { .modulatesTo = {{1}, {2}, {3}, {4}, {5}, {}}, .feedbackOp = 3, .carriers = {5} },

    // ALG 5: 1→2, 3→4, 5→6
    { .modulatesTo = {{1}, {}, {3}, {}, {5}, {}}, .feedbackOp = 0, .carriers = {1, 3, 5} },

    // ALG 6: 1→2, 3→4, 5→6 with FB on 5
    { .modulatesTo = {{1}, {}, {3}, {}, {5}, {}}, .feedbackOp = 4, .carriers = {1, 3, 5} },

    // ALG 7: 1→2, 3→(4,5,6)
    { .modulatesTo = {{1}, {}, {3, 4, 5}, {}, {}, {}}, .feedbackOp = 0, .carriers = {1, 3, 4, 5} },

    // ALG 8: 1→2, 3→4→(5,6)
    { .modulatesTo = {{1}, {}, {3}, {4, 5}, {}, {}}, .feedbackOp = 3, .carriers = {1, 4, 5} },

    // ALG 9: 1→2, 3→4→5→6
    { .modulatesTo = {{1}, {}, {3}, {4}, {5}, {}}, .feedbackOp = 1, .carriers = {1, 5} },

    // ALG 10: 3→(1,2), 4→5→6
    { .modulatesTo = {{}, {}, {0, 1}, {4}, {5}, {}}, .feedbackOp = 2, .carriers = {0, 1, 5} },

    // ALG 11: 1→2, 3→(4→5→6)
    { .modulatesTo = {{1}, {}, {3}, {4}, {5}, {}}, .feedbackOp = 2, .carriers = {1, 5} },

    // ALG 12: 1→2, 3→4, 5→6 (parallel pairs)
    { .modulatesTo = {{1}, {}, {3}, {}, {5}, {}}, .feedbackOp = 1, .carriers = {1, 3, 5} },

    // ALG 13: 1→2, 3→(4,5,6)
    { .modulatesTo = {{1}, {}, {3, 4, 5}, {}, {}, {}}, .feedbackOp = 2, .carriers = {1, 3, 4, 5} },

    // ALG 14: 1→2→(3,4,5,6)
    { .modulatesTo = {{1}, {2, 3, 4, 5}, {}, {}, {}, {}}, .feedbackOp = 0, .carriers = {2, 3, 4, 5} },

    // ALG 15: 1→2, 3→4→(5,6)
    { .modulatesTo = {{1}, {}, {3}, {4, 5}, {}, {}}, .feedbackOp = 0, .carriers = {1, 4, 5} },

    // ALG 16: 1→(2,3,4,5,6) - one modulator
    { .modulatesTo = {{1, 2, 3, 4, 5}, {}, {}, {}, {}, {}}, .feedbackOp = 0, .carriers = {1, 2, 3, 4, 5} },

    // ALG 17: 1→(2,3), 4→5, 6
    { .modulatesTo = {{1, 2}, {}, {}, {4}, {}, {}}, .feedbackOp = 0, .carriers = {1, 2, 4, 5} },

    // ALG 18: 1→2→3, 4→(5,6)
    { .modulatesTo = {{1}, {2}, {}, {4, 5}, {}, {}}, .feedbackOp = 2, .carriers = {2, 4, 5} },

    // ALG 19: 1→2, 3→(4,5), 6
    { .modulatesTo = {{1}, {}, {3, 4}, {}, {}, {}}, .feedbackOp = 0, .carriers = {1, 3, 4, 5} },

    // ALG 20: 1→2, 3→4, 5, 6
    { .modulatesTo = {{1}, {}, {3}, {}, {}, {}}, .feedbackOp = 2, .carriers = {1, 3, 4, 5} },

    // ALG 21: 1→2, 3, 4, 5, 6 (mostly parallel)
    { .modulatesTo = {{1}, {}, {}, {}, {}, {}}, .feedbackOp = 2, .carriers = {1, 2, 3, 4, 5} },

    // ALG 22: 1→(2,3,4,5), 6
    { .modulatesTo = {{1, 2, 3, 4}, {}, {}, {}, {}, {}}, .feedbackOp = 0, .carriers = {1, 2, 3, 4, 5} },

    // ALG 23: 1→2, 3→(4,5), 6
    { .modulatesTo = {{1}, {}, {3, 4}, {}, {}, {}}, .feedbackOp = 2, .carriers = {1, 3, 4, 5} },

    // ALG 24: 1→2, 3→4, 5, 6
    { .modulatesTo = {{1}, {}, {3}, {}, {}, {}}, .feedbackOp = 5, .carriers = {1, 3, 4, 5} },

    // ALG 25: 1→2, 3, 4, 5, 6
    { .modulatesTo = {{1}, {}, {}, {}, {}, {}}, .feedbackOp = 5, .carriers = {1, 2, 3, 4, 5} },

    // ALG 26: 3→(1,2), 6→(4,5)
    { .modulatesTo = {{}, {}, {0, 1}, {}, {}, {3, 4}}, .feedbackOp = 5, .carriers = {0, 1, 3, 4} },

    // ALG 27: 3→(1,2), 5→4, 6
    { .modulatesTo = {{}, {}, {0, 1}, {}, {3}, {}}, .feedbackOp = 4, .carriers = {0, 1, 3, 5} },

    // ALG 28: 1→2→3, 4, 5→6
    { .modulatesTo = {{1}, {2}, {}, {}, {5}, {}}, .feedbackOp = 0, .carriers = {2, 3, 5} },

    // ALG 29: 1→2, 3, 4→5, 6
    { .modulatesTo = {{1}, {}, {}, {4}, {}, {}}, .feedbackOp = 0, .carriers = {1, 2, 4, 5} },

    // ALG 30: 1→2→3, 4→5, 6
    { .modulatesTo = {{1}, {2}, {}, {4}, {}, {}}, .feedbackOp = 0, .carriers = {2, 4, 5} },

    // ALG 31: 1, 2, 3, 4, 5→6
    { .modulatesTo = {{}, {}, {}, {}, {5}, {}}, .feedbackOp = 5, .carriers = {0, 1, 2, 3, 5} },

    // ALG 32: All carriers (parallel)
    { .modulatesTo = {{}, {}, {}, {}, {}, {}}, .feedbackOp = 5, .carriers = {0, 1, 2, 3, 4, 5} },
};

//==============================================================================
// Algorithm Display Component
//==============================================================================
class AlgorithmDisplay : public juce::Component
{
public:
    AlgorithmDisplay();
    ~AlgorithmDisplay() override = default;

    void setAlgorithm(int algoIndex);  // 0-31
    int getAlgorithm() const { return currentAlgo; }

    void paint(juce::Graphics& g) override;
    void resized() override {}

private:
    int currentAlgo = 0;

    // Operator colors (matching main editor)
    static constexpr uint32_t OP_COLORS[6] = {
        0xffff6b6b,  // OP1 - Red
        0xffffd93d,  // OP2 - Yellow
        0xff6bcb77,  // OP3 - Green
        0xff4d96ff,  // OP4 - Blue
        0xffc792ea,  // OP5 - Purple
        0xffff9f43   // OP6 - Orange
    };

    void drawOperator(juce::Graphics& g, int op, float x, float y, float radius, bool isCarrier);
    void drawConnection(juce::Graphics& g, float x1, float y1, float x2, float y2);
    void drawFeedback(juce::Graphics& g, float x, float y, float radius);
    juce::String buildDescriptionText(const FmAlgorithm& algo);

    // Layout positions for operators (calculated in paint based on algorithm)
    struct OpPosition { float x, y; };
    std::array<OpPosition, 6> calculateLayout(const FmAlgorithm& algo, float width, float height);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(AlgorithmDisplay)
};
