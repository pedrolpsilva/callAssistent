import time
import threading
import ctypes
from ctypes import wintypes

user32 = ctypes.windll.user32

class WindowTracker:
    def __init__(self):
        self.is_tracking = False
        self.selected_window_title: str | None = None
        self.speaker_events: list[dict] = []
        self._thread: threading.Thread | None = None
        self._start_time: float = 0.0

    def get_meeting_windows(self) -> list[str]:
        titles = []
        ignore_list = {
            "", "Program Manager", "Settings", "Configurações", "Calculadora",
            "Experiência de Entrada do Windows", "Windows Input Experience"
        }

        def enum_callback(hwnd, lparam):
            if user32.IsWindowVisible(hwnd):
                length = user32.GetWindowTextLengthW(hwnd)
                if length > 0:
                    buff = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(hwnd, buff, length + 1)
                    t = buff.value.strip()
                    if t and t not in ignore_list and len(t) > 2:
                        titles.append(t)
            return True

        WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
        cb_func = WNDENUMPROC(enum_callback)

        # 1. Tenta abrir o Desktop interativo 'Default' (onde Chrome, Meet, Teams e janelas do usuário rodam)
        DESKTOP_ENUMERATE = 0x0100
        hdesk = user32.OpenDesktopW("Default", 0, False, DESKTOP_ENUMERATE)
        
        if hdesk:
            try:
                user32.EnumDesktopWindows(hdesk, cb_func, 0)
            finally:
                user32.CloseDesktop(hdesk)
        else:
            # Fallback para EnumWindows convencional
            user32.EnumWindows(cb_func, 0)

        # Remove duplicatas preservando a ordem
        seen = set()
        unique_titles = []
        for t in titles:
            if t not in seen:
                seen.add(t)
                unique_titles.append(t)

        # Prioriza janelas de reunião e navegadores (Meet, Teams, Zoom, Discord, Chrome, Edge, YouTube)
        keywords = ["meet", "teams", "zoom", "discord", "google meet", "reunião", "call", "chrome", "edge", "youtube"]
        sorted_windows = sorted(
            unique_titles,
            key=lambda x: any(k in x.lower() for k in keywords),
            reverse=True
        )

        return sorted_windows[:25]

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
                    elapsed = round(time.time() - self._start_time, 2)
                    self.speaker_events.append({
                        "time": elapsed,
                        "window_title": self.selected_window_title
                    })
            except Exception as e:
                print(f"[WindowTracker] Erro no loop de rastreamento: {e}")
            time.sleep(1.0)

window_tracker = WindowTracker()
