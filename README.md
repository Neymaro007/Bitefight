# 🧛 BiteFight Bot Pro v28.0

Zaawansowany skrypt automatyzujący rozgrywkę w przeglądarkowej grze BiteFight. Stworzony w JavaScript jako skrypt użytkownika Neymaro007.
Projekt posiada wbudowany, intuicyjny panel GUI pozwalający na swobodne zarządzanie akcjami postaci.

---

## ✨ Główne funkcje (Features)

Skrypt został zaprojektowany z naciskiem na bezpieczeństwo oraz optymalizację czasu gry:

* **🛡️ Inteligentny system leczenia:** Bot dynamicznie analizuje stan HP. Potrafi czytać czas odnowienia (cooldown) mikstur z interfejsu gry w czasie rzeczywistym, unikając zacięć i nieskończonych pętli.
* **🛒 Automatyczne zakupy:** Gdy brakuje mikstur (życia lub energii), skrypt sam udaje się na Rynek, precyzyjnie wyszukuje odpowiedni przedmiot i go kupuje.
* **⚔️ Wojny Klanowe:** Bot na bieżąco monitoruje powiadomienia i automatycznie składa meldunek (zapisuje Cię) na nadchodzące wojny klanowe.
* **🌲 Przygoda w Lesie:** W pełni konfigurowalna logika decyzyjna (np. ścieżka Max EXP i Złoto, dążenie do konkretnych Aspektów).
* **🦇 Polowanie w Grocie:** Wybór poziomu trudności i automatyczna walka z demonami.
* **🩸 Polowanie na ludzi:** Zbieranie Sfer Ekstrakcji określonych rang (np. tylko S, A, B) oraz inteligentne zarządzanie odliczaniem slotów.
* **🏰 Ruiny Pradziejów:** Automatyczne wystawianie odpowiedniej ilości wojska zależnie od poziomu Ruin i śledzenie czasu odnowienia. Dodatkowo rekrutacja wybranej przez ciebie jednostki.
* **⛪ Kościół i Cmentarz:** Samodzielne leczenie za PA (do określonego limitu PA) oraz podejmowanie pracy, gdy skończą się punkty akcji.
* **⚙️ Konfiguracja z poziomu GUI:** Wszystkie funkcje można włączać/wyłączać za pomocą estetycznego panelu w lewym górnym rogu ekranu gry. Zapisywanie ustawień w `localStorage`.

---

## 🚀 Instalacja

Do uruchomienia skryptu potrzebujesz rozszerzenia obsługującego UserScripts.

1. Zainstaluj dodatek **Tampermonkey** dla Twojej przeglądarki (dostępny dla Chrome, Firefox, Edge, Opera, Safari).
2. Kliknij w poniższy link do surowego kodu skryptu:
   👉 **[Zainstaluj skrypt](../../raw/main/bitefight-bot.user.js)** 
3. Tampermonkey otworzy nową kartę – kliknij przycisk **Zainstaluj** (Install).
4. Zaloguj się do gry BiteFight. W lewym górnym rogu pojawi się panel sterowania bota.

---

## 📸 Zrzuty ekranu (Screenshots)

*(Tutaj warto dodać zrzut ekranu. Zrób screena swojego panelu bota, wrzuć go do repozytorium i podmień poniższy link)*

![BiteFight Bot GUI](https://via.placeholder.com/300x500.png?text=Wstaw+tutaj+zrzut+ekranu+swojego+GUI)

---

## ⚠️ Zastrzeżenie (Disclaimer)

**Ten projekt został stworzony wyłącznie w celach edukacyjnych**, aby zaprezentować umiejętności manipulacji modelem DOM (Document Object Model), obsługi asynchronicznej (Promises, async/await)
w JavaScript oraz tworzenia interfejsów wstrzykiwanych na strony internetowe.

Korzystanie z botów i skryptów automatyzujących narusza Regulamin (TOS) firmy Gameforge. Używasz tego skryptu wyłącznie na własne ryzyko. Autor nie ponosi odpowiedzialności za ewentualne blokady kont 
(bany) wynikające z używania tego oprogramowania.
