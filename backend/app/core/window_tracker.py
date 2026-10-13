import time
import threading
import pygetwindow as gw

class WindowTracker:
    def __init__(self):
        self.is_tracking = False
        self.selected_window_title: str | None = None
        self.speaker_events: list[dict] = []
        self._thread: threading.Thread | None = None
        self._start_time: float = 0.0

    def get_meeting_windows(self) -> list[str]:
        windows = gw.getAllTitles()
        # Filtra janelas vazias e do sistema
        ignore_list = ["", "Program Manager", "Settings", "Configurações", "Calculadora"]
        filtered = []
        for w in windows:
            title = w.strip()
            if title and title not in ignore_list and len(title) > 2:
                filtered.append(title)
        
        # Prioriza janelas de reunião (Meet, Teams, Zoom, Discord, Chrome, Edge)
        keywords = ["meet", "teams", "zoom", "discord", "google meet", "reunião", "call"]
        sorted_windows = sorted(
            filtered,
            key=lambda x: any(k in x.lower() for k in keywords),
            reverse=True
        )
        return sorted_windows[:20]

    def start_tracking(self, window_title: str):
        self.selected_window_title = window_title
        self.is_tracking = True
        self.speaker_events = []
        self._start_time = time.time()
        self._thread = threading.Thread(target=self._track_loop, daemon=True)
        self._thread.start()

    def stop_tracking(self) -> list[dict]:
        self.is_tracking = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        return self.speaker_events

    def _track_loop(self):
        while self.is_tracking:
            try:
                if self.selected_window_title:
                    wins = gw.getWindowsWithTitle(self.selected_window_title)
                    if wins:
                        current_title = wins[0].title
                        elapsed = round(time.time() - self._start_time, 2)
                        # Registra se o título mudou ou manteve (ex: Meet altera título para quem fala em certas extensões)
                        self.speaker_events.append({
                            "time": elapsed,
                            "window_title": current_title
                        })
            except Exception as e:
                print(f"[WindowTracker] Erro ao rastrear janela: {e}")
            time.sleep(1.0)

window_tracker = WindowTracker()
