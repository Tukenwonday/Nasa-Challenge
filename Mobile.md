# Mission Control: iOS Remote Companion Specification
### Single-User Direct Broadcast Remote for NASA Space Relics 3D Timeline

---

## 1. System Overview & Architecture

```
┌─────────────────────────────────┐                       ┌──────────────────────────────────────┐                       ┌─────────────────────────────────┐
│     iOS Companion (SwiftUI)     │   Direct WSS Stream   │         GCP VPS Relay Server         │   Direct WSS Stream   │    React / Three.js Website     │
│       Zero Pairing Required     │    (Simplified JSON)  │         (Node.js Broadcast)          │    (Simplified JSON)  │       Single Display Screen     │
│                                 │──────────────────────>│                                      │──────────────────────>│                                 │
│  - Instant Connect on Launch    │                       │  - Broadcast to Peer Sockets         │                       │  - OrbitControls Orbit          │
│  - 2D Rotation Touchpad         │                       │  - Zero Room Logic / Zero State      │                       │  - Relic Transition & Timeline  │
│  - Timeline Step Scrubber       │                       │  - Sub-millisecond Packet Forwarding │                       │  - Dust Wiper & Telemetry Sync  │
│  - Haptic Telemetry Engine      │<──────────────────────│  - Ping/Pong Heartbeat Keep-Alive    │<──────────────────────│  - Web Audio & Dossier Drawer   │
└─────────────────────────────────┘                       └──────────────────────────────────────┘                       └─────────────────────────────────┘
```

This companion app provides a **single-user, instant-connect direct bridge** to the 3D space relic timeline. 

### Core Design Principles
* **Zero Configuration:** No pairing codes, no room keys, no QR scanning, and no login screen. The app connects directly to the VPS relay on launch and immediately opens the remote interface.
* **Direct Broadcast Topology:** The VPS acts as an unopinionated, real-time message bridge: any packet sent from the phone is broadcast directly to the desktop browser, and any telemetry from the desktop is received by the phone.
* **Instant Silent Reconnection:** If the app is backgrounded or network drops, a silent 2-second background retry loop restores connection seamlessly without interrupting the UI.
* **Native Frameworks Only:** Built strictly with `SwiftUI`, `Foundation`, `Combine`, and `UIKit` (haptics only). **Zero third-party dependencies.**

---

## 2. Direct Network Architecture & Lifecycle

### 2.1 Connection State Machine

```
      ┌───────────────┐
      │ Disconnected  │◄──────────────────────┐
      └───────┬───────┘                       │
              │ init() / app launch           │ Socket Drop /
              ▼                               │ Silent 2s Retry
      ┌───────────────┐                       │
      │  Connecting   │                       │
      └───────┬───────┘                       │
              │ WSS Handshake OK              │
              ▼                               │
      ┌───────────────┐                       │
      │   Connected   │───────────────────────┘
      │ (Ready State) │
      └───────────────┘
```

* **Instant Activation:** As soon as `WebSocketManager` is initialized, it opens `wss://<GCP-VPS-IP-OR-DOMAIN>/relay`.
* **Silent 2-Second Retry:** When a disconnection occurs, the manager waits 2.0 seconds and reconnects automatically without showing error popups or pairing walls.
* **Ping / Keep-Alive:** The client dispatches a native ping frame every **15 seconds** to prevent GCP firewall and NAT timeouts.

---

## 3. Simplified JSON Packet Contract

All messages are transmitted as UTF-8 JSON text strings. All `roomId`, `sender`, and timestamp envelopes have been eliminated.

Every message strictly uses this schema:
```json
{
  "type": "MESSAGE_TYPE",
  "payload": {}
}
```

---

### 3.1 State Synchronization (Screen -> Mobile)

#### `STATE_SYNC`
Broadcast by the React desktop app on startup and whenever the active relic, audio state, or dossier changes.
```json
{
  "type": "STATE_SYNC",
  "payload": {
    "index": 2,
    "total": 6,
    "overview": false,
    "relic": {
      "id": "viking-1",
      "name": "Viking 1",
      "year": 1976,
      "body": "mars",
      "title": "First Touch on the Red Sands",
      "place": "Mars · Chryse Planitia"
    },
    "panelOpen": true,
    "muted": false
  }
}
```

---

### 3.2 Navigation Commands (Mobile -> Screen)

#### `NAVIGATE`
```json
{
  "type": "NAVIGATE",
  "payload": {
    "action": "GO_TO_INDEX",
    "targetIndex": 4
  }
}
```
*Valid `action` values:*
- `"NEXT"`: Next relic.
- `"PREV"`: Previous relic.
- `"OVERVIEW"`: Sets `index = -1` (overview mode).
- `"GO_TO_INDEX"`: Direct jump to `targetIndex` (`-1` to `5`).

---

### 3.3 3D Orbit Rotation (Mobile -> Screen)

#### `ROTATE`
High-frequency touchpad deltas throttled to **60Hz (16.6ms)** on the iOS client.
```json
{
  "type": "ROTATE",
  "payload": {
    "dx": -0.0145,
    "dy": 0.0082,
    "phase": "move"
  }
}
```
*Valid `phase` values:* `"start"`, `"move"`, `"end"`.

---

### 3.4 Action Triggers (Mobile -> Screen)

#### `TRIGGER_ACTION`
```json
{
  "type": "TRIGGER_ACTION",
  "payload": {
    "action": "WIPE_DUST"
  }
}
```
*Supported Actions:*
- `"WIPE_DUST"`: Triggers solar panel clearing particle burst and audio sweep.
- `"PING_SIGNAL"`: Emits audio chime and telemetry radar ping.
- `"TOGGLE_AUDIO"`: Toggles sound mute/unmute.
- `"TOGGLE_DOSSIER"`: Opens/closes the StoryCard science dossier panel.

---

## 4. Swift & SwiftUI Implementation Specification

### 4.1 Project Directory Structure

```
NasaMissionRemote/
├── App/
│   └── NasaMissionRemoteApp.swift
├── Core/
│   ├── Network/
│   │   └── WebSocketManager.swift
│   ├── Motion/
│   │   └── TouchManager.swift
│   └── Haptics/
│       └── HapticManager.swift
├── Models/
│   └── MissionModels.swift
└── Views/
    ├── RootView.swift
    ├── RemoteView.swift
    └── Components/
        ├── OrbitTouchSurface.swift
        ├── TimelineScrubberView.swift
        ├── QuickActionGrid.swift
        └── ConnectionStatusBadge.swift
```

---

### 4.2 Network Layer: `WebSocketManager.swift`

Direct connection on launch, zero pairing logic, silent 2-second auto-reconnect, and native ping keep-alive.

```swift
import Foundation
import Combine

@MainActor
final class WebSocketManager: ObservableObject {
    enum ConnectionStatus: String {
        case disconnected = "OFFLINE"
        case connecting = "CONNECTING"
        case connected = "LINK ACTIVE"
    }

    @Published var status: ConnectionStatus = .disconnected
    @Published var activeState: MissionTelemetryState?
    @Published var latencyMs: Int = 0

    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession
    private var pingTimer: Timer?
    private var reconnectTimer: Timer?
    private let serverURL: URL

    // Configured for your GCP VPS: 34.165.204.35 via SSLIP.io
    init(serverURL: URL = URL(string: "wss://34.165.204.35.sslip.io/relay")!) {
        self.serverURL = serverURL
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        self.session = URLSession(configuration: config)

        // Automatically connect on launch
        connect()
    }

    func connect() {
        stopPingTimer()
        reconnectTimer?.invalidate()
        reconnectTimer = nil

        status = .connecting
        var request = URLRequest(url: serverURL)
        request.timeoutInterval = 8

        webSocketTask = session.webSocketTask(with: request)
        webSocketTask?.resume()

        listenForMessages()
        startPingTimer()
    }

    func disconnect() {
        stopPingTimer()
        reconnectTimer?.invalidate()
        reconnectTimer = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        status = .disconnected
    }

    // MARK: - Direct JSON Dispatch
    func send<T: Encodable>(type: String, payload: T) {
        guard status == .connected else { return }

        let packet: [String: Any] = [
            "type": type,
            "payload": (try? payload.asDictionary()) ?? [:]
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: packet),
              let text = String(data: data, encoding: .utf8) else { return }

        webSocketTask?.send(.string(text)) { [weak self] error in
            if error != nil {
                Task { @MainActor in
                    self?.handleDisconnect()
                }
            }
        }
    }

    // MARK: - Receive Loop
    private func listenForMessages() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            Task { @MainActor in
                switch result {
                case .success(let message):
                    if self.status != .connected {
                        self.status = .connected
                    }

                    switch message {
                    case .string(let text):
                        self.handleIncomingString(text)
                    case .data(let data):
                        if let text = String(data: data, encoding: .utf8) {
                            self.handleIncomingString(text)
                        }
                    @unknown default:
                        break
                    }
                    self.listenForMessages() // Keep receive loop alive

                case .failure:
                    self.handleDisconnect()
                }
            }
        }
    }

    private func handleIncomingString(_ jsonString: String) {
        guard let data = jsonString.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else { return }

        switch type {
        case "STATE_SYNC":
            if let payload = json["payload"] as? [String: Any],
               let payloadData = try? JSONSerialization.data(withJSONObject: payload),
               let state = try? JSONDecoder().decode(MissionTelemetryState.self, from: payloadData) {
                self.activeState = state
            }
        default:
            break
        }
    }

    // MARK: - Silent Auto-Reconnect & Ping
    private func handleDisconnect() {
        status = .disconnected
        stopPingTimer()
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil

        // Silent 2-second reconnect retry
        guard reconnectTimer == nil else { return }
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: false) { [weak self] _ in
            Task { @MainActor in
                self?.reconnectTimer = nil
                self?.connect()
            }
        }
    }

    private func startPingTimer() {
        stopPingTimer()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 15.0, repeats: true) { [weak self] _ in
            let start = Date()
            self?.webSocketTask?.sendPing { error in
                Task { @MainActor in
                    if error != nil {
                        self?.handleDisconnect()
                    } else {
                        let ms = Int(Date().timeIntervalSince(start) * 1000)
                        self?.latencyMs = ms
                        if self?.status != .connected {
                            self?.status = .connected
                        }
                    }
                }
            }
        }
    }

    private func stopPingTimer() {
        pingTimer?.invalidate()
        pingTimer = nil
    }
}

fileprivate extension Encodable {
    func asDictionary() throws -> [String: Any] {
        let data = try JSONEncoder().encode(self)
        guard let dictionary = try JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] else {
            throw NSError()
        }
        return dictionary
    }
}
```

---

### 4.3 Data Models: `MissionModels.swift`

```swift
import Foundation

struct RelicBrief: Codable, Equatable {
    let id: String
    let name: String
    let year: Int
    let body: String
    let title: String
    let place: String
}

struct MissionTelemetryState: Codable, Equatable {
    let index: Int
    let total: Int
    let overview: Bool
    let relic: RelicBrief?
    let panelOpen: Bool
    let muted: Bool
}

struct RotatePayload: Codable {
    let dx: Float
    let dy: Float
    let phase: String
}

struct NavigatePayload: Codable {
    let action: String
    let targetIndex: Int?
}

struct TriggerPayload: Codable {
    let action: String
}
```

---

### 4.4 Haptics Specialist: `HapticManager.swift`

```swift
import UIKit

final class HapticManager {
    static let shared = HapticManager()

    private let lightImpact = UIImpactFeedbackGenerator(style: .light)
    private let mediumImpact = UIImpactFeedbackGenerator(style: .medium)
    private let heavyImpact = UIImpactFeedbackGenerator(style: .heavy)
    private let selectionFeedback = UISelectionFeedbackGenerator()

    private init() {
        lightImpact.prepare()
        mediumImpact.prepare()
        heavyImpact.prepare()
        selectionFeedback.prepare()
    }

    func tick() {
        selectionFeedback.selectionChanged()
    }

    func impactLight() {
        lightImpact.impactOccurred(intensity: 0.6)
    }

    func impactMedium() {
        mediumImpact.impactOccurred(intensity: 0.85)
    }

    func burst() {
        heavyImpact.impactOccurred(intensity: 1.0)
    }
}
```

---

### 4.5 Motion & Touch Throttler: `TouchManager.swift`

Enforces a 60Hz (16.6ms) throttle to ensure smooth camera orbit without network congestion.

```swift
import SwiftUI

@MainActor
final class TouchManager: ObservableObject {
    private var lastSendTime: TimeInterval = 0
    private let sendInterval: TimeInterval = 1.0 / 60.0 // 16.6ms cadence

    func handleDrag(translation: CGSize, viewSize: CGSize, isEnded: Bool, onEmit: (RotatePayload) -> Void) {
        guard viewSize.width > 0, viewSize.height > 0 else { return }

        let normDx = Float(translation.width / viewSize.width) * 1.8
        let normDy = Float(translation.height / viewSize.height) * 1.8

        let now = Date().timeIntervalSince1970
        if isEnded {
            onEmit(RotatePayload(dx: normDx, dy: normDy, phase: "end"))
            return
        }

        if now - lastSendTime >= sendInterval {
            onEmit(RotatePayload(dx: normDx, dy: normDy, phase: "move"))
            lastSendTime = now
            HapticManager.shared.impactLight()
        }
    }
}
```

---

### 4.6 UI Components

#### Connection Status Badge (`ConnectionStatusBadge.swift`)

```swift
import SwiftUI

struct ConnectionStatusBadge: View {
    let status: WebSocketManager.ConnectionStatus
    let latencyMs: Int

    var indicatorColor: Color {
        switch status {
        case .connected: return Color.green
        case .connecting: return Color.orange
        case .disconnected: return Color.red
        }
    }

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(indicatorColor)
                .frame(width: 6, height: 6)

            Text(status == .connected ? "\(latencyMs)ms" : status.rawValue)
                .font(.system(size: 10, weight: .medium, design: .monospaced))
                .foregroundColor(.white.opacity(0.65))
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.white.opacity(0.06))
        .cornerRadius(8)
    }
}
```

---

#### 2D Orbit Touchpad (`OrbitTouchSurface.swift`)

```swift
import SwiftUI

struct OrbitTouchSurface: View {
    let accentColor: Color
    let onRotate: (RotatePayload) -> Void

    @State private var dragLocation: CGPoint?
    @State private var previousDragTranslation: CGSize = .zero
    @StateObject private var touchManager = TouchManager()

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Background Radar Container
                RoundedRectangle(cornerRadius: 24)
                    .fill(Color(hex: "#0F1014"))
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )

                // Reticle Crosshairs
                Path { path in
                    path.move(to: CGPoint(x: geo.size.width / 2, y: 16))
                    path.addLine(to: CGPoint(x: geo.size.width / 2, y: geo.size.height - 16))
                    path.move(to: CGPoint(x: 16, y: geo.size.height / 2))
                    path.addLine(to: CGPoint(x: geo.size.width - 16, y: geo.size.height / 2))
                }
                .stroke(Color.white.opacity(0.06), style: StrokeStyle(lineWidth: 1, dash: [4, 6]))

                // Range Rings
                Circle()
                    .stroke(accentColor.opacity(0.15), lineWidth: 1)
                    .frame(width: geo.size.width * 0.55)

                Circle()
                    .stroke(accentColor.opacity(0.25), lineWidth: 1)
                    .frame(width: geo.size.width * 0.25)

                // Touch Contact Indicator
                if let loc = dragLocation {
                    Circle()
                        .fill(accentColor.opacity(0.3))
                        .frame(width: 56, height: 56)
                        .position(loc)
                        .blur(radius: 4)

                    Circle()
                        .fill(Color.white)
                        .frame(width: 8, height: 8)
                        .position(loc)
                }

                // HUD Overlay Label
                VStack {
                    HStack {
                        Text("3D ORBIT TRACKPAD")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundColor(accentColor.opacity(0.8))
                            .tracking(2)
                        Spacer()
                        Text("YAW / PITCH")
                            .font(.system(size: 9, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.4))
                    }
                    .padding(18)
                    Spacer()
                }
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        dragLocation = value.location
                        let delta = CGSize(
                            width: value.translation.width - previousDragTranslation.width,
                            height: value.translation.height - previousDragTranslation.height
                        )
                        previousDragTranslation = value.translation
                        touchManager.handleDrag(translation: delta, viewSize: geo.size, isEnded: false, onEmit: onRotate)
                    }
                    .onEnded { _ in
                        dragLocation = nil
                        previousDragTranslation = .zero
                        touchManager.handleDrag(translation: .zero, viewSize: geo.size, isEnded: true, onEmit: onRotate)
                    }
            )
        }
        .frame(height: 280)
    }
}

fileprivate extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
}
```

---

#### Timeline Step Scrubber (`TimelineScrubberView.swift`)

```swift
import SwiftUI

struct TimelineScrubberView: View {
    let currentIndex: Int
    let totalCount: Int
    let accentColor: Color
    let onSelect: (Int) -> Void

    private let relicYears = [1966, 1969, 1976, 1997, 2004, 2021]

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Button(action: {
                    onSelect(-1)
                    HapticManager.shared.impactMedium()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "square.grid.2x2")
                            .font(.system(size: 11))
                        Text("OVERVIEW")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                    }
                    .foregroundColor(currentIndex < 0 ? .white : .white.opacity(0.5))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 5)
                    .background(currentIndex < 0 ? accentColor.opacity(0.3) : Color.white.opacity(0.05))
                    .cornerRadius(8)
                }

                Spacer()

                Text(currentIndex >= 0 ? "\(currentIndex + 1) / \(totalCount)" : "OVERVIEW")
                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                    .foregroundColor(accentColor)
            }

            // Step Rail
            HStack(spacing: 8) {
                ForEach(0..<totalCount, id: \.self) { idx in
                    let isSelected = idx == currentIndex
                    let isPast = idx <= currentIndex

                    Button(action: {
                        onSelect(idx)
                        HapticManager.shared.tick()
                    }) {
                        VStack(spacing: 6) {
                            Capsule()
                                .fill(isSelected ? accentColor : (isPast ? accentColor.opacity(0.4) : Color.white.opacity(0.15)))
                                .frame(height: isSelected ? 8 : 4)
                                .shadow(color: isSelected ? accentColor.opacity(0.8) : .clear, radius: 6)

                            Text(String(relicYears[idx]))
                                .font(.system(size: 9, weight: isSelected ? .bold : .regular, design: .monospaced))
                                .foregroundColor(isSelected ? .white : .white.opacity(0.4))
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(16)
        .background(Color(hex: "#101115"))
        .cornerRadius(18)
        .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.1), lineWidth: 1))
    }
}
```

---

#### Quick Actions Grid (`QuickActionGrid.swift`)

```swift
import SwiftUI

struct QuickActionGrid: View {
    let isPanelOpen: Bool
    let isMuted: Bool
    let accentColor: Color
    let onTrigger: (String) -> Void

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            // Solar Panel Dust Wiper
            ActionButton(
                title: "WIPE DUST",
                subtitle: "PULSE DISCHARGE",
                icon: "wind",
                color: accentColor
            ) {
                onTrigger("WIPE_DUST")
                HapticManager.shared.burst()
            }

            // Radar Ping
            ActionButton(
                title: "PING TELEMETRY",
                subtitle: "RADIO LINK CHECK",
                icon: "dot.radiowaves.left.and.right",
                color: Color(hex: "#9FB4D8")
            ) {
                onTrigger("PING_SIGNAL")
                HapticManager.shared.impactMedium()
            }

            // Dossier Drawer Toggle
            ActionButton(
                title: isPanelOpen ? "CLOSE DOSSIER" : "OPEN DOSSIER",
                subtitle: "MISSION LOGS",
                icon: isPanelOpen ? "chevron.down.circle" : "doc.text.magnifyingglass",
                color: .white.opacity(0.8)
            ) {
                onTrigger("TOGGLE_DOSSIER")
                HapticManager.shared.tick()
            }

            // Audio Mute Toggle
            ActionButton(
                title: isMuted ? "UNMUTE AUDIO" : "MUTE AUDIO",
                subtitle: "SYNTH ENGINE",
                icon: isMuted ? "speaker.slash" : "speaker.wave.2",
                color: isMuted ? .red.opacity(0.8) : .green.opacity(0.8)
            ) {
                onTrigger("TOGGLE_AUDIO")
                HapticManager.shared.tick()
            }
        }
    }
}

struct ActionButton: View {
    let title: String
    let subtitle: String
    let icon: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(color)
                    Spacer()
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.system(size: 11, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                    Text(subtitle)
                        .font(.system(size: 9, design: .monospaced))
                        .foregroundColor(.white.opacity(0.4))
                }
            }
            .padding(14)
            .background(Color(hex: "#101115"))
            .cornerRadius(16)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.08), lineWidth: 1))
        }
    }
}
```

---

#### Direct Controller View (`RemoteView.swift`)

```swift
import SwiftUI

struct RemoteView: View {
    @ObservedObject var ws: WebSocketManager

    var accentColor: Color {
        guard let relic = ws.activeState?.relic else { return Color(hex: "#C4C9D1") }
        return relic.body == "mars" ? Color(hex: "#C65D3B") : Color(hex: "#9FB4D8")
    }

    var body: some View {
        ZStack {
            Color(hex: "#08080A").ignoresSafeArea()

            VStack(spacing: 16) {
                // Header HUD
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(ws.activeState?.relic?.name.uppercased() ?? "SYSTEM OVERVIEW")
                            .font(.system(size: 16, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                        Text(ws.activeState?.relic?.place.uppercased() ?? "ALL STATIONS")
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(accentColor)
                    }

                    Spacer()

                    ConnectionStatusBadge(status: ws.status, latencyMs: ws.latencyMs)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)

                // 2D Rotation Surface
                OrbitTouchSurface(accentColor: accentColor) { payload in
                    ws.send(type: "ROTATE", payload: payload)
                }
                .padding(.horizontal, 20)

                // Timeline Scrubber
                TimelineScrubberView(
                    currentIndex: ws.activeState?.index ?? -1,
                    totalCount: ws.activeState?.total ?? 6,
                    accentColor: accentColor
                ) { targetIdx in
                    ws.send(type: "NAVIGATE", payload: NavigatePayload(
                        action: targetIdx == -1 ? "OVERVIEW" : "GO_TO_INDEX",
                        targetIndex: targetIdx
                    ))
                }
                .padding(.horizontal, 20)

                // Action Triggers Grid
                QuickActionGrid(
                    isPanelOpen: ws.activeState?.panelOpen ?? false,
                    isMuted: ws.activeState?.muted ?? false,
                    accentColor: accentColor
                ) { actionName in
                    ws.send(type: "TRIGGER_ACTION", payload: TriggerPayload(action: actionName))
                }
                .padding(.horizontal, 20)

                Spacer()
            }
        }
    }
}
```

---

#### Immediate Root View (`RootView.swift`) & App Entry

```swift
import SwiftUI

@main
struct NasaMissionRemoteApp: App {
    @StateObject private var ws = WebSocketManager()

    var body: some Scene {
        WindowGroup {
            // Direct launch with no pairing screens
            RemoteView(ws: ws)
                .preferredColorScheme(.dark)
        }
    }
}
```

---

## 5. Direct Broadcast Relay Server (GCP VPS)

Deploy this simplified broadcast server on your GCP VPS. It requires zero database, zero room logic, and forwards every packet to all other connected sockets.

### 5.1 Node.js Broadcast Server (`relay-server.js`)

```javascript
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = process.env.PORT || 8080;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('NASA Direct Relay: Operational\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  // Broadcast all incoming messages directly to every other connected socket
  ws.on('message', (data, isBinary) => {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  // Keep-alive ping responder
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});

// Periodic heartbeat verification
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Direct broadcast relay running on port ${PORT}`);
});
```

### 5.2 Production Caddy Configuration (TLS Termination)

To expose `wss://` over HTTPS without manual certificate renewals:

`/etc/caddy/Caddyfile`:
```caddy
34.165.204.35.sslip.io {
    reverse_proxy /relay localhost:8080
}
```

---

## 6. Xcode Build & Deployment Instructions

1. **Create Xcode Project:**
   * Open Xcode 15 or 16 -> **New Project** -> **iOS App** -> Interface: **SwiftUI**, Language: **Swift**.
   * Product Name: `NasaMissionRemote`.
2. **Project Settings:**
   * In `Signing & Capabilities`, select your Apple Developer account / Team.
   * In `Info.plist`, verify orientations are locked to **Portrait only**.
3. **Configure VPS Endpoint:**
   * Open `WebSocketManager.swift` and update the default `serverURL` to your GCP address:
     ```swift
     init(serverURL: URL = URL(string: "wss://34.165.204.35.sslip.io/relay")!)
     ```
4. **Deploy & Run:**
   * Connect your physical iPhone or select an iOS Simulator.
   * Press **Cmd + R** to build and run. The app opens directly to the controller with immediate connection to the relay.
