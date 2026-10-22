# Third-party notices

## Fluent-Qt adaptations

Source: https://github.com/calvinhxx/Fluent-Qt

Version: v1.10.2, commit `4d8a600112a6c43bb7bd0c7cdb5b08185ad759ac`.

The workstation adapts the settings-row layout from
`app/view/pages/SettingsPage.cpp` (SettingsRow) into
`src/AppearanceSettings.tsx` and `src/styles.css`: leading icon, primary and
secondary text, trailing controls, and stacked controls in narrow containers.
The port uses CSS grid/container queries instead of Qt layouts, changes the
breakpoint to 640px for three translated buttons, and preserves workstation
colors and typography.

`src/tokens.css` and shared control styles adapt the 150ms fast-feedback
duration from `src/design/Animation.h`. The workstation applies it to shadow
and filter only; selection colors change immediately. Reduced motion disables
these transitions through the operating system preference. This is not the
complete Fluent-Qt MotionPolicy implementation.

No Qt runtime, PySide6 bindings, fonts, icon fonts, Gallery artwork or other
bundled third-party assets are included. This notice covers the adaptations
above; npm dependencies retain their own license notices.

### Fluent-Qt MIT License

Copyright (c) 2026 calvinhxx

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
