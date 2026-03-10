// ==UserScript==
// @name         BiteFight Bot Pro v28.0 (Naprawa Jamy Lęgowej)
// @namespace    http://tampermonkey.net/
// @version      28.0
// @description  Poprawione zakupy, odczyt HP, Energia (-20 PA), naprawiony trening wojska.
// @author       Anonymous
// @match        https://*.bitefight.gameforge.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    //==================================================================
    // 📜 KONFIGURACJA 📜
    //==================================================================

    const healthTriggerPercent = 0.85;
    const healthCriticalPercent = 0.15;

    const potionScriptCooldown = 31 * 60 * 1000;
    const churchScriptCooldown = 121 * 60 * 1000;
    const fallbackWaitTime = 10 * 60 * 1000;
    const profilePageLoadDelay = 1000;

    const baseURL = window.location.origin;

    const adventureLink = baseURL + "/city/adventure";
    const profileLink = baseURL + "/profile/index";
    const churchLink = baseURL + "/city/church";
    const marketLink = baseURL + "/city/shop/potions/";
    const clanLink = baseURL + "/clan/index";
    const huntLink = baseURL + "/robbery/index";
    const graveyardLink = baseURL + "/city/graveyard";
    const trainLink = baseURL + "/nourishing/index";
    const grotteLink = baseURL + "/city/grotte";

    const potionEnergyName = "Mikstura Energii";

    const ruinsCooldown = 61 * 60 * 1000;
    const ruinsLevels = [
        { id: 1, unit1: 4, unit2: 4 },
        { id: 2, unit1: 7, unit2: 5 },
        { id: 3, unit1: 11, unit2: 6 },
        { id: 4, unit1: 13, unit2: 8 },
        { id: 5, unit1: 15, unit2: 10 }
    ];

    const clanWarCooldown = 30 * 60 * 1000;

    const adventureStrategies = {
        'exp_gold': {
            name: "Max EXP i Złoto",
            priority: ['Zaurocz', 'Pożryj', 'Wrzuć monetę', 'Skonfrontuj wroga', 'Do ataku!', 'Zamorduj podstępnie', 'Wejdź do lasu', 'Splądruj', 'Zdobądź niezły łup', 'Podpal wszystko', 'Wykorzystaj szansę', 'Zostań tutaj', 'Bądź odważny', 'Sprawdź', 'Rozejrzyj się'],
            avoid: ['Terroryzuj', 'Pogódź się z tym', 'Zakończ przygodę', 'Uciekaj']
        },
        'aspect_human': {
            name: "Aspekt: Człowiek",
            priority: ['Ostrzeż przed niebezpieczeństwem', 'Porozmawiaj', 'Bądź odważny', 'Baw się dobrze', 'Zostań tutaj'],
            avoid: ['Zamorduj podstępnie', 'Do ataku!', 'Podpal wszystko', 'Zakończ przygodę', 'Pogódź się z tym', 'Terroryzuj']
        },
        'aspect_knowledge': {
            name: "Aspekt: Wiedza",
            priority: ['Sprawdź', 'Przeczytaj', 'Rozejrzyj się', 'Porozmawiaj', 'Ostrzeż przed niebezpieczeństwem'],
            avoid: ['Podpal wszystko', 'Do ataku!', 'Zniszcz', 'Zakończ przygodę', 'Pogódź się z tym']
        },
        'aspect_order': {
            name: "Aspekt: Porządek",
            priority: ['Skonfrontuj wroga', 'Bądź odważny', 'Ostrzeż przed niebezpieczeństwem', 'Sprawdź'],
            avoid: ['Zamorduj podstępnie', 'Terroryzuj', 'Splądruj', 'Zakończ przygodę', 'Wrzuć monetę', 'Pogódź się z tym']
        },
        'aspect_nature': {
            name: "Aspekt: Natura",
            priority: ['Ukryj się', 'Zostań tutaj', 'Obserwuj', 'Idź ostrożnie', 'Przeskocz'],
            avoid: ['Podpal wszystko', 'Do ataku!', 'Zniszcz', 'Zakończ przygodę', 'Pogódź się z tym']
        },
        'aspect_beast': {
            name: "Aspekt: Bestia",
            priority: ['Do ataku!', 'Pożryj', 'Śmiertelna aura', 'Terroryzuj'],
            avoid: ['Porozmawiaj', 'Ostrzeż przed niebezpieczeństwem', 'Ukryj się', 'Zakończ przygodę', 'Pogódź się z tym']
        },
        'aspect_destruction': {
            name: "Aspekt: Zniszczenie",
            priority: ['Podpal wszystko', 'Zniszcz', 'Do ataku!', 'Terroryzuj'],
            avoid: ['Sprawdź', 'Zostań tutaj', 'Porozmawiaj', 'Przeczytaj', 'Zakończ przygodę', 'Pogódź się z tym']
        },
        'aspect_chaos': {
            name: "Aspekt: Chaos",
            priority: ['Wykorzystaj szansę', 'Przeskocz', 'Zniszcz', 'Podpal wszystko'],
            avoid: ['Skonfrontuj wroga', 'Sprawdź', 'Ostrzeż przed niebezpieczeństwem', 'Zakończ przygodę', 'Pogódź się z tym']
        },
        'aspect_corruption': {
            name: "Aspekt: Korupcja",
            priority: ['Zamorduj podstępnie', 'Splądruj', 'Zdobądź niezły łup', 'Zaurocz', 'Terroryzuj'],
            avoid: ['Skonfrontuj wroga', 'Ostrzeż przed niebezpieczeństwem', 'Bądź odważny', 'Zakończ przygodę', 'Pogódź się z tym']
        }
    };

    const unitCosts = { '1': 10, '2': 15, '3': 20, '4': 35 };

    //==================================================================
    // 🤖 RDZEŃ SKRYPTU (GUI) 🤖
    //==================================================================

    function createBotPanel() {
        if (document.getElementById('bf-bot-panel')) return;

        const currentServerMatch = window.location.host.match(/s(\d+)-pl/);
        const currentServerId = currentServerMatch ? currentServerMatch[1] : '70';
        const x2Servers = ['60', '63', '65', '67', '69'];
        const isX2 = x2Servers.includes(currentServerId);

        let graveyardOptions = '';
        if (isX2) {
            graveyardOptions = `
                <option value="1">0:30:00 godz. </option>
                <option value="2">1:00:00 godz. </option>
                <option value="3">1:30:00 godz. </option>
                <option value="4">2:00:00 godz. </option>
                <option value="5">2:30:00 godz. </option>
                <option value="6">3:00:00 godz. </option>
                <option value="7">3:30:00 godz. </option>
                <option value="8">4:00:00 godz. </option>
            `;
        } else {
            graveyardOptions = `
                <option value="1">0:10:12 godz. </option>
                <option value="2">0:20:24 godz. </option>
                <option value="3">0:30:36 godz. </option>
                <option value="4">0:40:48 godz. </option>
                <option value="5">0:51:00 godz. </option>
                <option value="6">1:01:12 godz. </option>
                <option value="7">1:11:24 godz. </option>
                <option value="8">1:21:36 godz. </option>
            `;
        }

        const panel = document.createElement('div');
        panel.id = 'bf-bot-panel';
        panel.style.cssText = `
            position: fixed; top: 10px; left: 10px; width: 290px;
            background: linear-gradient(180deg, #1a0a0a 0%, #0d0404 100%);
            border: 2px solid #7a0000; color: #d4d4d4;
            padding: 12px; z-index: 999999; font-family: Tahoma, Arial, sans-serif;
            font-size: 12px; border-radius: 8px; box-shadow: 3px 3px 20px rgba(0,0,0,0.9);
            max-height: 95vh; overflow-y: auto; overflow-x: hidden;
        `;

        panel.innerHTML = `
            <style>
                #bf-bot-panel * { box-sizing: border-box; }
                .bf-sec { background: rgba(20, 5, 5, 0.6); border: 1px solid #4a1515; border-radius: 6px; padding: 10px; margin-bottom: 12px; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); }
                .bf-sec-main { border: 1px solid #8a1515; background: rgba(30, 8, 8, 0.8); box-shadow: 0 0 8px rgba(138, 0, 0, 0.3) inset; }
                .bf-sec-title { margin: 0 0 10px 0; font-weight: bold; color: #ff5555; font-size: 13px; display: flex; align-items: center; gap: 6px; border-bottom: 1px solid #4a1010; padding-bottom: 5px; text-shadow: 1px 1px 2px black; }
                .bf-row { display: flex; align-items: center; margin-bottom: 8px; justify-content: space-between; }
                .bf-row-left { display: flex; align-items: center; margin-bottom: 8px; justify-content: flex-start; gap: 8px;}
                .bf-row label, .bf-row-left label { cursor: pointer; display: flex; align-items: center; gap: 6px; color: #e0e0e0; font-size: 12px; }
                .bf-sel { width: 100%; background: #0a0404; color: #ffdddd; border: 1px solid #661111; padding: 5px; border-radius: 4px; font-size: 11px; margin-top: 2px; outline: none; cursor: pointer; transition: 0.2s;}
                .bf-sel:hover { border-color: #aa2222; }
                .bf-sel option:disabled { color: #555; background: #0a0404; }
                .bf-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
                .bf-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
                .bf-badge { background: #2a0b0b; border: 1px solid #551111; border-radius: 4px; padding: 4px 0; text-align: center; cursor: pointer; color: #ccc; display: flex; align-items: center; justify-content: center; gap: 4px; transition: 0.2s;}
                .bf-badge:hover { background: #501010; color: #fff; border-color: #882222; }
                .bf-badge input { margin: 0; cursor: pointer; }
                .bf-hr { border: 0; height: 1px; background: linear-gradient(90deg, transparent, #551111, transparent); margin: 10px 0; }
                #bf-bot-panel::-webkit-scrollbar { width: 6px; }
                #bf-bot-panel::-webkit-scrollbar-track { background: #0d0404; border-radius: 4px; }
                #bf-bot-panel::-webkit-scrollbar-thumb { background: #7a0000; border-radius: 4px; }
                #bf-bot-panel::-webkit-scrollbar-thumb:hover { background: #a00000; }
            </style>

            <h3 style="margin: 0 0 5px 0; text-align: center; color: #ff3333; text-transform: uppercase; letter-spacing: 2px; font-size: 15px; text-shadow: 2px 2px 4px black, 0 0 10px rgba(255,0,0,0.5);">BiteFight Bot v28.0</h3>

            <div style="text-align: center; margin-bottom: 12px;">
                <label style="color:#aaa; font-size: 11px;">🌍 Serwer:</label>
                <select id="bot-server-select" class="bf-sel" style="width: auto; display: inline-block; margin-left: 5px; padding: 2px 5px; margin-right: 10px;">
                    <option value="60">s60</option>
                    <option value="61">s61</option>
                    <option value="62">s62</option>
                    <option value="63">s63</option>
                    <option value="64">s64</option>
                    <option value="65">s65</option>
                    <option value="66">s66</option>
                    <option value="67">s67</option>
                    <option value="68">s68</option>
                    <option value="69">s69</option>
                    <option value="70">s70</option>
                </select>

                <div style="margin-top: 6px;">
                    <label style="color:#aaa; font-size: 11px;">⏱️ Prędkość bota:</label>
                    <select id="bot-click-delay" class="bf-sel" style="width: auto; display: inline-block; margin-left: 5px; padding: 2px 5px;">
                        <option value="fast">Szybka (100 - 400 ms)</option>
                        <option value="normal" selected>Normalna (200 - 800 ms)</option>
                        <option value="human">Ludzka (0.5s - 1.5s)</option>
                        <option value="safe">Bezpieczna (1s - 3s)</option>
                    </select>
                </div>
            </div>

            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button id="btn-start" style="flex: 1; padding: 10px; font-size: 13px; font-weight: bold; border: 1px solid #00aa00; background: linear-gradient(180deg, #004400, #002200); color: #fff; cursor: pointer; border-radius: 5px; transition: 0.3s; text-shadow: 1px 1px 2px black;">▶ START</button>
                <button id="btn-stop" style="flex: 1; padding: 10px; font-size: 13px; font-weight: bold; border: 1px solid #aa0000; background: linear-gradient(180deg, #440000, #220000); color: #fff; cursor: pointer; border-radius: 5px; transition: 0.3s; text-shadow: 1px 1px 2px black;">⏹ STOP</button>
            </div>

            <div style="margin-bottom: 15px;">
                <button id="btn-reset" style="width: 100%; padding: 8px; font-size: 12px; font-weight: bold; border: 1px solid #997700; background: linear-gradient(180deg, #554400, #222200); color: #fff; cursor: pointer; border-radius: 5px; transition: 0.3s; text-shadow: 1px 1px 2px black;">🔄 Wyczyść Pamięć (Zacięcia)</button>
            </div>

            <div class="bf-sec bf-sec-main">
                <div class="bf-sec-title">⚔️ Główna Aktywność (Wybierz 1)</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-adventure"> 🌲 Przygoda w Lesie</label></div>
                <select id="bot-adv-strategy" class="bf-sel" style="margin-bottom: 10px;">
                    <option value="exp_gold">⚔️ Max EXP i Złoto</option>
                    <option value="aspect_human">👤 Aspekt: Człowiek</option>
                    <option value="aspect_knowledge">📖 Aspekt: Wiedza</option>
                    <option value="aspect_order">⚖️ Aspekt: Porządek (+HP)</option>
                    <option value="aspect_nature">🌿 Aspekt: Natura</option>
                    <option value="aspect_beast">🐺 Aspekt: Bestia</option>
                    <option value="aspect_destruction">🔥 Aspekt: Zniszczenie</option>
                    <option value="aspect_chaos">🌪️ Aspekt: Chaos</option>
                    <option value="aspect_corruption">🧛 Aspekt: Korupcja</option>
                </select>
                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-grotte"> 🦇 Polowanie w Grocie</label></div>
                <select id="bot-grotte-diff" class="bf-sel">
                    <option value="Łatwe">🟢 Poziom: Łatwe</option>
                    <option value="Średnie">🟡 Poziom: Średnie</option>
                    <option value="Trudne">🔴 Poziom: Trudne</option>
                </select>
            </div>

            <div class="bf-sec">
                <div class="bf-sec-title">🧛 Polowanie na Ludzi</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-hunt"> Aktywuj Polowanie</label></div>
                <select id="bot-hunt-location" class="bf-sel">
                    <option value="1">Farma (1 PA)</option>
                    <option value="2">Wioska (1 PA)</option>
                    <option value="3">Małe miasteczko (1 PA)</option>
                    <option value="4">Miasto (1 PA)</option>
                    <option value="5">Metropolia (2 PA)</option>
                </select>
                <div style="margin-top: 10px; color: #aaa; font-size: 10px; text-align: center;">Odbieraj Sfery tych Rang:</div>
                <div class="bf-grid-4" id="bot-rank-checkboxes">
                    <label class="bf-badge"><input type="checkbox" value="S"> S</label>
                    <label class="bf-badge"><input type="checkbox" value="A"> A</label>
                    <label class="bf-badge"><input type="checkbox" value="B"> B</label>
                    <label class="bf-badge"><input type="checkbox" value="C"> C</label>
                    <label class="bf-badge"><input type="checkbox" value="D"> D</label>
                    <label class="bf-badge"><input type="checkbox" value="E"> E</label>
                    <label class="bf-badge"><input type="checkbox" value="F"> F</label>
                </div>
                <div class="bf-row-left" style="margin-top: 10px; margin-bottom: 0;">
                    <label title="Gdy bot zapełni sloty odliczaniem, przerwie polowania."><input type="checkbox" id="bot-toggle-hunt-spheres-only"> 🔮 Tylko po Sfery Ekstrakcji</label>
                </div>
            </div>

            <div class="bf-sec">
                <div class="bf-sec-title">🏰 Walka i Ruiny</div>
                <div class="bf-row-left"><label><input type="checkbox" id="bot-toggle-clan"> Zapisuj na Wojny Klanowe</label></div>
                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-ruins"> Ruiny Pradziejów</label></div>
                <div style="color: #aaa; font-size: 10px; margin-left: 24px; margin-bottom: 4px;">Wybierz poziomy do ataku:</div>
                <div class="bf-grid-3" id="bot-ruins-checkboxes" style="margin-left: 24px;">
                    <label class="bf-badge"><input type="checkbox" value="1"> Poz. 1</label>
                    <label class="bf-badge"><input type="checkbox" value="2"> Poz. 2</label>
                    <label class="bf-badge"><input type="checkbox" value="3"> Poz. 3</label>
                    <label class="bf-badge"><input type="checkbox" value="4"> Poz. 4</label>
                    <label class="bf-badge"><input type="checkbox" value="5"> Poz. 5</label>
                </div>
            </div>

            <div class="bf-sec">
                <div class="bf-sec-title">💎 Rozwój Postaci</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-attributes"> Trenuj Atrybuty (Złoto):</label></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-left: 24px; margin-top: 5px;">
                    <label class="bf-badge"><input type="checkbox" id="attr-strength" value="Siła"> Siła</label>
                    <label class="bf-badge"><input type="checkbox" id="attr-defense" value="Obrona"> Obrona</label>
                    <label class="bf-badge"><input type="checkbox" id="attr-agility" value="Zwinność"> Zwinność</label>
                    <label class="bf-badge"><input type="checkbox" id="attr-endurance" value="Wytrzymałość"> Wytrzym.</label>
                    <label class="bf-badge" style="grid-column: span 2;"><input type="checkbox" id="attr-charisma" value="Charyzma"> Charyzma</label>
                </div>
                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-train"> Jamy Lęgowe (Wojsko)</label></div>
                <select id="bot-train-unit" class="bf-sel" style="margin-left: 24px; width: calc(100% - 24px);">
                    <option value="1">Rój Nietoperzy</option>
                    <option value="2">Ghul</option>
                    <option value="3">Wampirzy Niewolnik</option>
                    <option value="4">Banshee</option>
                </select>
            </div>

            <div class="bf-sec" style="margin-bottom: 0;">
                <div class="bf-sec-title">🩸 Przetrwanie i Regeneracja</div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-potion-life"> Pij Mikstury Leczące:</label></div>
                <select id="bot-potion-type" class="bf-sel" style="margin-bottom: 10px;">
                    <option value="Mała Uzdrawiająca Mikstura">Mała Uzdrawiająca (od 1 lvl)</option>
                    <option value="Średnia Uzdrawiająca Mikstura">Średnia Uzdrawiająca (od 3 lvl)</option>
                    <option value="Zupa Życia">Zupa Życia (od 75 lvl)</option>
                </select>

                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-potion-energy"> Pij Mikstury Energii (PA)</label></div>
                <div class="bf-row-left" style="margin-top: 10px; margin-bottom: 10px;"><label style="font-weight:bold; color:#00ff00;"><input type="checkbox" id="bot-potion-autobuy"> Auto-Kupowanie brakujących mikstur</label></div>

                <div class="bf-row-left" style="margin-top: 10px;"><label style="font-weight:bold; color:#ffcc33;">🛡️ Ucieczka (Zakończ Przygodę), gdy HP spadnie do:</label></div>
                <select id="bot-safe-hp" class="bf-sel" style="margin-bottom: 10px;">
                    <option value="0.15">15% (Wysokie ryzyko)</option>
                    <option value="0.25">25% (Podwyższone ryzyko)</option>
                    <option value="0.35">35% (Zbalansowane)</option>
                    <option value="0.50">50% (Bezpieczne)</option>
                    <option value="0.65">65% (Bardzo ostrożnie)</option>
                </select>

                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-church"> Uzdrowienie w Kościele</label></div>
                <div style="color: #aaa; font-size: 10px; margin-left: 24px;">Akceptuj max. koszt leczenia:</div>
                <select id="bot-church-ap" class="bf-sel" style="margin-left: 24px; width: calc(100% - 24px); margin-bottom: 10px;">
                    <option value="5">Do 5 Punktów Akcji (PA)</option>
                    <option value="10">Do 10 Punktów Akcji (PA)</option>
                    <option value="20">Do 20 Punktów Akcji (PA)</option>
                    <option value="40">Do 40 Punktów Akcji (PA)</option>
                    <option value="80">Do 80 Punktów Akcji (PA)</option>
                </select>

                <div class="bf-hr"></div>
                <div class="bf-row-left"><label style="font-weight:bold; color:#fff;"><input type="checkbox" id="bot-toggle-graveyard"> Praca (Cmentarz), gdy brak PA</label></div>
                <select id="bot-graveyard-time" class="bf-sel" style="margin-left: 24px; width: calc(100% - 24px);">
                    ${graveyardOptions}
                </select>
            </div>
        `;

        document.body.appendChild(panel);

        const btnStart = document.getElementById('btn-start');
        const btnStop = document.getElementById('btn-stop');
        const btnReset = document.getElementById('btn-reset');
        const serverSelect = document.getElementById('bot-server-select');

        if (currentServerMatch) {
            serverSelect.value = currentServerMatch[1];
        }

        serverSelect.addEventListener('change', (e) => {
            const newServer = e.target.value;
            window.location.href = `https://s${newServer}-pl.bitefight.gameforge.com/profile/index`;
        });

        function updateMainButtons(isRunning) {
            if (isRunning) {
                btnStart.style.background = '#006600';
                btnStart.style.color = '#fff';
                btnStart.style.boxShadow = '0 0 12px #00ff00';
                btnStart.style.borderColor = '#00ff00';
                btnStop.style.background = '#330000';
                btnStop.style.color = '#888';
                btnStop.style.boxShadow = 'none';
                btnStop.style.borderColor = '#660000';
            } else {
                btnStart.style.background = '#003300';
                btnStart.style.color = '#888';
                btnStart.style.boxShadow = 'none';
                btnStart.style.borderColor = '#006600';
                btnStop.style.background = '#880000';
                btnStop.style.color = '#fff';
                btnStop.style.boxShadow = '0 0 12px #ff0000';
                btnStop.style.borderColor = '#ff3333';
            }
        }

        const isRunning = localStorage.getItem('botCfg_Main') === 'true';
        updateMainButtons(isRunning);

        btnStart.addEventListener('click', () => {
            localStorage.setItem('botCfg_Main', 'true');
            updateMainButtons(true);
            window.location.reload();
        });

        btnStop.addEventListener('click', () => {
            localStorage.setItem('botCfg_Main', 'false');
            updateMainButtons(false);
        });

        btnReset.addEventListener('click', () => {
            localStorage.removeItem('lastLifePotionUse');
            localStorage.removeItem('lastEnergyPotionUse');
            localStorage.removeItem('needsLifePotion');
            localStorage.removeItem('needsEnergyPotion');
            localStorage.removeItem('bot_PauseAll');
            alert("Pamięć bota została wyczyszczona! Zacięcia i blokady zostały zresetowane.");
            window.location.reload();
        });

        function setupCheckbox(id, storageKey, defaultValue) {
            const checkbox = document.getElementById(id);
            let savedState = localStorage.getItem(storageKey);

            if (savedState === null) {
                localStorage.setItem(storageKey, defaultValue);
                savedState = defaultValue.toString();
            }

            checkbox.checked = savedState === 'true';
            checkbox.addEventListener('change', (e) => {
                localStorage.setItem(storageKey, e.target.checked);
            });
        }

        function setupSelect(id, storageKey) {
            const select = document.getElementById(id);
            const savedVal = localStorage.getItem(storageKey);

            if (savedVal) { select.value = savedVal; }
            else { localStorage.setItem(storageKey, select.value); }

            select.addEventListener('change', (e) => {
                localStorage.setItem(storageKey, e.target.value);
            });
        }

        const rankContainer = document.getElementById('bot-rank-checkboxes');
        const rankCbs = rankContainer.querySelectorAll('input[type="checkbox"]');
        const savedRanks = localStorage.getItem('botCfg_HuntRanks');
        const activeRanks = savedRanks ? savedRanks.split(',') : ['S','A','B','C','D','E','F'];

        rankCbs.forEach(cb => {
            cb.checked = activeRanks.includes(cb.value);
            cb.addEventListener('change', () => {
                const newActive = Array.from(rankCbs).filter(c => c.checked).map(c => c.value);
                localStorage.setItem('botCfg_HuntRanks', newActive.join(','));
            });
        });

        const ruinsContainer = document.getElementById('bot-ruins-checkboxes');
        const ruinsCbs = ruinsContainer.querySelectorAll('input[type="checkbox"]');
        const savedRuins = localStorage.getItem('botCfg_RuinsLevels');
        const activeRuins = savedRuins ? savedRuins.split(',') : ['1','2','3','4','5'];

        ruinsCbs.forEach(cb => {
            cb.checked = activeRuins.includes(cb.value);
            cb.addEventListener('change', () => {
                const newActive = Array.from(ruinsCbs).filter(c => c.checked).map(c => c.value);
                localStorage.setItem('botCfg_RuinsLevels', newActive.join(','));
            });
        });

        setupCheckbox('bot-toggle-attributes', 'botCfg_Attributes', false);
        const attrs = ['Siła', 'Obrona', 'Zwinność', 'Wytrzymałość', 'Charyzma'];
        const savedAttrs = localStorage.getItem('botCfg_AttrList');
        const activeAttrs = savedAttrs ? savedAttrs.split(',') : [];

        attrs.forEach(attrName => {
            let attrId = '';
            if (attrName === 'Siła') attrId = 'attr-strength';
            if (attrName === 'Obrona') attrId = 'attr-defense';
            if (attrName === 'Zwinność') attrId = 'attr-agility';
            if (attrName === 'Wytrzymałość') attrId = 'attr-endurance';
            if (attrName === 'Charyzma') attrId = 'attr-charisma';

            const cb = document.getElementById(attrId);
            cb.checked = activeAttrs.includes(attrName);
            cb.addEventListener('change', () => {
                const currentActive = [];
                if (document.getElementById('attr-strength').checked) currentActive.push('Siła');
                if (document.getElementById('attr-defense').checked) currentActive.push('Obrona');
                if (document.getElementById('attr-agility').checked) currentActive.push('Zwinność');
                if (document.getElementById('attr-endurance').checked) currentActive.push('Wytrzymałość');
                if (document.getElementById('attr-charisma').checked) currentActive.push('Charyzma');
                localStorage.setItem('botCfg_AttrList', currentActive.join(','));
            });
        });

        setupCheckbox('bot-potion-life', 'botCfg_PotionLife', true);
        setupSelect('bot-potion-type', 'botCfg_PotionType');
        setupCheckbox('bot-potion-energy', 'botCfg_PotionEnergy', false);
        setupCheckbox('bot-potion-autobuy', 'botCfg_PotionAutoBuy', false);
        setupSelect('bot-safe-hp', 'botCfg_SafeHp');

        setupCheckbox('bot-toggle-church', 'botCfg_Church', true);
        setupSelect('bot-church-ap', 'botCfg_ChurchApMax');
        setupCheckbox('bot-toggle-clan', 'botCfg_Clan', true);
        setupCheckbox('bot-toggle-ruins', 'botCfg_Ruins', true);
        setupCheckbox('bot-toggle-hunt', 'botCfg_Hunt', false);
        setupSelect('bot-hunt-location', 'botCfg_HuntLocation');
        setupCheckbox('bot-toggle-hunt-spheres-only', 'botCfg_HuntSpheresOnly', true);
        setupCheckbox('bot-toggle-adventure', 'botCfg_Adventure', true);
        setupSelect('bot-adv-strategy', 'botCfg_AdvStrategy');
        setupSelect('bot-click-delay', 'botCfg_ClickDelay');
        setupCheckbox('bot-toggle-grotte', 'botCfg_Grotte', false);
        setupSelect('bot-grotte-diff', 'botCfg_GrotteDiff');
        setupCheckbox('bot-toggle-train', 'botCfg_Train', false);
        setupSelect('bot-train-unit', 'botCfg_TrainUnit');

        const cbAdv = document.getElementById('bot-toggle-adventure');
        const cbGrotte = document.getElementById('bot-toggle-grotte');

        cbAdv.addEventListener('change', (e) => {
            if (e.target.checked) { cbGrotte.checked = false; localStorage.setItem('botCfg_Grotte', 'false'); }
        });
        cbGrotte.addEventListener('change', (e) => {
            if (e.target.checked) { cbAdv.checked = false; localStorage.setItem('botCfg_Adventure', 'false'); }
        });

        setupCheckbox('bot-toggle-graveyard', 'botCfg_Graveyard', true);
        setupSelect('bot-graveyard-time', 'botCfg_GraveyardTime');
    }

    let isNavigating = false;

    function getRandomDelay() {
        const speed = localStorage.getItem('botCfg_ClickDelay') || 'normal';
        let min = 200, max = 800;
        if (speed === 'fast') { min = 100; max = 400; }
        else if (speed === 'normal') { min = 200; max = 800; }
        else if (speed === 'human') { min = 500; max = 1500; }
        else if (speed === 'safe') { min = 1000; max = 3000; }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function goTo(url) {
        isNavigating = true;
        setTimeout(() => window.location.href = url, getRandomDelay());
    }

    function clickElement(element) {
        isNavigating = true;
        setTimeout(() => element.click(), getRandomDelay());
    }

    function waitAndRefresh(reason) {
        isNavigating = true;
        console.log(`TEST: Wstrzymuję bota. Powód: ${reason}. Czekam 10 minut...`);
        setTimeout(() => { window.location.reload(); }, fallbackWaitTime);
    }

    function getStats() {
        const goldDiv = document.querySelector("div.gold");
        if (!goldDiv) return null;

        const text = goldDiv.innerHTML.replace(/&nbsp;/g, ' ');

        const goldMatch = text.match(/([\d\s.,]+)\s*<img[^>]*alt="Złoto"/i);
        const healthMatch = text.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)\s*<img[^>]*alt="Zdrowie"/i);
        const apMatch = text.match(/([\d\s.,]+)\s*\/\s*([\d\s.,]+)\s*<img[^>]*alt="Punkty Akcji"/i);

        const bloodElem = document.getElementById("blood-essen-balance");
        const levelElem = document.querySelector("img[alt='Poziom']");

        if (!goldMatch || !healthMatch || !apMatch) return null;

        const parseNum = (str) => parseInt(str.replace(/[^\d]/g, ''), 10);

        let level = 1;
        if (levelElem && levelElem.nextSibling) {
            level = parseInt(levelElem.nextSibling.textContent.replace(/[^\d]/g, ''), 10) || 1;
        }

        return {
            gold: parseNum(goldMatch[1]),
            currentHP: parseNum(healthMatch[1]),
            maxHP: parseNum(healthMatch[2]),
            currentAP: parseNum(apMatch[1]),
            maxAP: parseNum(apMatch[2]),
            blood: bloodElem ? parseNum(bloodElem.textContent) : 0,
            level: level
        };
    }

    function applyLevelRestrictionsToGUI(stats) {
        const selectEl = document.getElementById('bot-potion-type');
        if (selectEl && stats) {
            Array.from(selectEl.options).forEach(opt => {
                if (opt.value === 'Średnia Uzdrawiająca Mikstura') opt.disabled = stats.level < 3;
                if (opt.value === 'Zupa Życia') opt.disabled = stats.level < 75;
            });
            if (selectEl.options[selectEl.selectedIndex].disabled) {
                selectEl.value = 'Mała Uzdrawiająca Mikstura';
                localStorage.setItem('botCfg_PotionType', 'Mała Uzdrawiająca Mikstura');
            }
        }
    }

    async function attemptAttributesUpgrade(currentPage, stats) {
        const savedAttrs = (localStorage.getItem('botCfg_AttrList') || '').split(',').filter(Boolean);
        if (savedAttrs.length === 0) return false;

        if (!currentPage.includes('/profile/index')) {
            goTo(profileLink); return true;
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                const attrRows = document.querySelectorAll("#skills_tab table tr");
                let actionTaken = false;

                for (let row of attrRows) {
                    const labelTd = row.querySelector("td:first-child");
                    if (!labelTd) continue;

                    const attrName = labelTd.textContent.replace(':', '').trim();
                    if (!savedAttrs.includes(attrName)) continue;

                    let cost = null;
                    const rowText = row.textContent;
                    const costMatch = rowText.match(/kosztuje:\s*([\d.]+)/i);

                    if (costMatch) {
                        cost = parseInt(costMatch[1].replace(/\./g, ''), 10);
                        localStorage.setItem('bot_attrCost_' + attrName, cost.toString());
                    }

                    if (!actionTaken && cost !== null) {
                        const plusBtnLink = row.querySelector("a[href*='/profile/training/']");

                        if (plusBtnLink && stats.gold >= cost) {
                            console.log(`TEST: Ulepszam '${attrName}' za ${cost} złota!`);
                            clickElement(plusBtnLink);
                            actionTaken = true;
                        }
                    }
                }

                if (actionTaken) {
                    resolve(true);
                } else {
                    localStorage.setItem('bot_NextAttrCheck', (Date.now() + 5 * 60 * 1000).toString());
                    resolve(false);
                }
            }, profilePageLoadDelay);
        });
    }

    async function attemptTraining(currentPage, stats) {
        const unitId = localStorage.getItem('botCfg_TrainUnit') || '1';
        const costPerUnit = unitCosts[unitId] || 10;

        if (stats.blood < costPerUnit) return false;

        if (!currentPage.includes('/nourishing/index')) {
            goTo(trainLink); return true;
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                const amountToBuy = (stats.blood >= costPerUnit * 10) ? 10 : 1;
                const btnId = `recruits-${unitId}-${amountToBuy}`;
                const trainBtn = document.getElementById(btnId);

                if (trainBtn && !trainBtn.classList.contains('disabled')) {
                    console.log(`TEST: Trenuję wojsko... Zmuszam do odświeżenia.`);
                    clickElement(trainBtn);
                    setTimeout(() => { window.location.reload(); }, getRandomDelay() + 1500);
                    resolve(true);
                } else {
                    goTo(adventureLink);
                    resolve(true);
                }
            }, profilePageLoadDelay);
        });
    }

    // --- NOWA FUNKCJA POMOCNICZA: Przelicza czas z gry na milisekundy ---
    function parseTimeToMs(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 3) {
            return (parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10)) * 1000;
        } else if (parts.length === 2) {
            return (parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)) * 1000;
        }
        return 10 * 60 * 1000;
    }

    async function attemptUseItem(currentPage, itemName, storageCooldown, storageNeedBuy) {
        if (!currentPage.includes('/profile/index')) {
            goTo(profileLink); return true;
        }
        return new Promise((resolve) => {
            setTimeout(() => {
                const itemContainer = document.getElementById("items");
                if (!itemContainer) { resolve(false); return; }

                const allItemNames = Array.from(itemContainer.querySelectorAll("strong"));
                const itemRowStrong = allItemNames.find(el => el.textContent.toLowerCase().includes(itemName.toLowerCase().trim()));

                if (itemRowStrong) {
                    const itemRow = itemRowStrong.closest("tr") || itemRowStrong.closest("div.item-form") || itemRowStrong.parentElement.parentElement;
                    const useButton = itemRow ? Array.from(itemRow.querySelectorAll("a, button, input")).find(btn => (btn.href && btn.href.includes('/profile/useItem/')) || (btn.value && btn.value.includes('Użyj'))) : null;

                    if (useButton) {
                        console.log(`TEST: Znalazłem '${itemName}' w ekwipunku. Używam!`);
                        localStorage.removeItem(storageNeedBuy);
                        localStorage.setItem(storageCooldown, (Date.now() - potionScriptCooldown).toString());
                        clickElement(useButton);
                        resolve(true);
                    } else {
                        const cooldownSpan = itemRow.querySelector('.countdown_amount');
                        let waitTimeMs = 10 * 60 * 1000;

                        if (cooldownSpan) {
                            waitTimeMs = parseTimeToMs(cooldownSpan.textContent.trim());
                            console.warn(`TEST: '${itemName}' jest w trakcie odnowy. Gra pokazuje: ${cooldownSpan.textContent.trim()}. Wrócę do tego za ten czas.`);
                        } else {
                            console.warn(`TEST: '${itemName}' jest na cooldownie, ale nie widzę timera. Zakładam domyślne 10 min.`);
                        }

                        localStorage.setItem(storageCooldown, (Date.now() + waitTimeMs + 5000 - potionScriptCooldown).toString());
                        resolve(false);
                    }
                } else {
                     const doAutoBuy = localStorage.getItem('botCfg_PotionAutoBuy') === 'true';

                     if (doAutoBuy) {
                         const lastBuyAtt = parseInt(localStorage.getItem('bot_lastBuy_' + storageNeedBuy) || '0', 10);

                         if (Date.now() - lastBuyAtt < 10 * 60 * 1000) {
                             console.warn(`TEST: Próbowałem niedawno kupić '${itemName}', brak efektu. Usypiam zapytania na 10 min.`);
                             localStorage.setItem(storageCooldown, (Date.now() - potionScriptCooldown + (10 * 60 * 1000)).toString());
                             resolve(false); return;
                         }

                         console.warn(`TEST: Brak '${itemName}' w ekwipunku! Włączam kupowanie na Rynku.`);
                         localStorage.setItem(storageNeedBuy, 'true');
                     } else {
                         console.warn(`TEST: Brak '${itemName}'. Auto-Kupowanie wyłączone. Ignoruję na 10 min.`);
                         localStorage.setItem(storageCooldown, (Date.now() - potionScriptCooldown + (10 * 60 * 1000)).toString());
                     }
                     resolve(false);
                }
            }, profilePageLoadDelay);
        });
    }

    async function attemptBuyItem(currentPage, itemName, storageNeedBuy) {
        if (!currentPage.includes(marketLink.replace(baseURL, ""))) {
            goTo(marketLink); return true;
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                localStorage.removeItem(storageNeedBuy);

                const itemHeaders = Array.from(document.querySelectorAll("strong"));
                const targetHeader = itemHeaders.find(el => el.textContent.trim().toLowerCase().includes(itemName.toLowerCase().trim()));

                if (targetHeader) {
                    const itemContainer = targetHeader.closest("tr") || targetHeader.closest("div.item-form") || targetHeader.parentElement.parentElement;

                    if (itemContainer) {
                        const buyButton = Array.from(itemContainer.querySelectorAll("a, button, input")).find(btn => (btn.textContent || btn.value || "").trim().includes("Kup"));

                        if (buyButton) {
                            console.log(`TEST: Znalazłem '${itemName}' u Handlarza. Klikam KUP dokładnie dla tego przedmiotu.`);
                            isNavigating = true;

                            setTimeout(() => {
                                buyButton.click();
                                setTimeout(() => {
                                    const confirmButton = Array.from(document.querySelectorAll("a, button, input")).find(btn => (btn.textContent || btn.value || "").trim() === "Potwierdź");
                                    if (confirmButton) {
                                        console.log(`TEST: Zatwierdzam zakup '${itemName}'.`);
                                        localStorage.setItem('bot_PauseAll', (Date.now() + 5000).toString());
                                        localStorage.setItem('bot_lastBuy_' + storageNeedBuy, Date.now().toString());

                                        confirmButton.click();
                                        setTimeout(() => { goTo(profileLink); }, 1000);
                                    } else {
                                        console.error("TEST: Błąd - brak przycisku Potwierdź.");
                                        window.location.reload();
                                    }
                                }, 1500);
                            }, getRandomDelay());

                            resolve(true); return;
                        }
                    }
                }

                console.error(`TEST: Brak możliwości zakupu ${itemName} u handlarza. Nakładam blokadę na 10 minut.`);
                const cooldownKey = storageNeedBuy === 'needsLifePotion' ? 'lastLifePotionUse' : 'lastEnergyPotionUse';
                localStorage.setItem(cooldownKey, (Date.now() - potionScriptCooldown + (10 * 60 * 1000)).toString());
                goTo(profileLink);
                resolve(true);
            }, profilePageLoadDelay);
        });
    }

    async function attemptChurchHeal(currentPage) {
        if (!currentPage.includes('/city/church')) { goTo(churchLink); return true; }

        return new Promise((resolve) => {
            setTimeout(() => {
                const churchContainer = document.getElementById('church');
                if (!churchContainer) { resolve(false); return; }

                const maxAp = parseInt(localStorage.getItem('botCfg_ChurchApMax') || '10', 10);
                const apMatch = churchContainer.innerHTML.match(/(\d+)\s*(?:&nbsp;)?<img[^>]*alt="Punkty Akcji"/i);
                const apCost = apMatch ? parseInt(apMatch[1], 10) : 0;
                const textFound = Array.from(document.querySelectorAll("#church p")).some(p => p.textContent.includes("100% maksymalnego zdrowia"));

                if (textFound) {
                    if (apCost <= maxAp) {
                        const healButton = document.querySelector("input.btn[value='Uzdrowienie']");
                        if (healButton) {
                            localStorage.setItem('lastChurchUse', Date.now().toString());
                            clickElement(healButton);
                            resolve(true); return;
                        }
                    } else {
                        localStorage.setItem('lastChurchUse', (Date.now() + 15 * 60 * 1000).toString());
                        resolve(false); return;
                    }
                }

                localStorage.setItem('lastChurchUse', Date.now().toString());
                resolve(false);
            }, profilePageLoadDelay);
        });
    }

    async function attemptClanWar(currentPage) {
        if (!currentPage.includes('/clan/index')) { goTo(clanLink); return true; }
        return new Promise((resolve) => {
            setTimeout(() => {
                const joinBtn = document.querySelector('input.join-now[type="submit"]');
                if (joinBtn) {
                    localStorage.setItem('nextClanWar', (Date.now() + clanWarCooldown).toString());
                    clickElement(joinBtn);
                    resolve(true); return;
                } else {
                    localStorage.setItem('nextClanWar', (Date.now() + clanWarCooldown).toString());
                    goTo(adventureLink); resolve(true); return;
                }
            }, profilePageLoadDelay);
        });
    }

    async function attemptRuins(currentPage, config) {
        const isIndex = currentPage.includes('/ancestral/index');
        const isShow = currentPage.includes('/ancestral/show');
        const isFight = currentPage.includes('/ancestral/fight');

        if (isFight) {
            localStorage.setItem(`nextRuin_${config.id}`, (Date.now() + ruinsCooldown).toString());
            localStorage.removeItem('activeRuinTarget');
            goTo(adventureLink); return true;
        }

        if (isShow) {
            return new Promise((resolve) => {
                setTimeout(async () => {
                    const startBtn = document.getElementById("fightBtn");
                    if (startBtn) {
                        const plusButtons = document.querySelectorAll('button.btnPlus1');
                        if (plusButtons.length >= 2) {
                            const plusUnit1 = plusButtons[0];
                            const plusUnit2 = plusButtons[1];
                            const id1 = plusUnit1.getAttribute('data-id');
                            const id2 = plusUnit2.getAttribute('data-id');
                            const slider1 = document.getElementById(`playerArmy${id1}`);
                            const slider2 = document.getElementById(`playerArmy${id2}`);

                            if (slider1 && slider2) {
                                const availableUnit1 = parseInt(slider1.max || '0', 10);
                                const availableUnit2 = parseInt(slider2.max || '0', 10);
                                if (availableUnit1 < config.unit1 || availableUnit2 < config.unit2) {
                                    localStorage.setItem(`nextRuin_${config.id}`, (Date.now() + 30 * 60 * 1000).toString());
                                    localStorage.removeItem('activeRuinTarget');
                                    goTo(adventureLink); resolve(true); return;
                                }

                                for (let i = 0; i < config.unit1; i++) { plusUnit1.click(); await new Promise(r => setTimeout(r, 200)); }
                                for (let i = 0; i < config.unit2; i++) { plusUnit2.click(); await new Promise(r => setTimeout(r, 200)); }

                                localStorage.setItem(`nextRuin_${config.id}`, (Date.now() + ruinsCooldown).toString());
                                clickElement(startBtn);
                                resolve(true); return;
                            }
                        }
                        localStorage.setItem(`nextRuin_${config.id}`, (Date.now() + 5 * 60 * 1000).toString());
                        localStorage.removeItem('activeRuinTarget'); resolve(false); return;
                    }
                    resolve(false);
                }, profilePageLoadDelay);
            });
        }

        const targetUrl = `${baseURL}/ancestral/index?page=1&layerId=${config.id}`;
        if (!isIndex || !currentPage.includes(`layerId=${config.id}`)) { goTo(targetUrl); return true; }

        return new Promise((resolve) => {
            setTimeout(() => {
                const layerContainer = document.getElementById(`layerInfoContainer${config.id}`);
                if (!layerContainer) { resolve(false); return; }

                const text = layerContainer.textContent || "";
                if (text.includes("WARUNKI ODBLOKOWANIA") || text.includes("Dostępne za")) {
                    let waitMs = ruinsCooldown;
                    const timeMatch = text.match(/Dost[ęe]pne za\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i);
                    if (timeMatch) {
                        const h = parseInt(timeMatch[1] || '0', 10); const m = parseInt(timeMatch[2] || '0', 10); const s = parseInt(timeMatch[3] || '0', 10);
                        waitMs = (h * 3600 + m * 60 + s) * 1000 + 5000;
                    }
                    localStorage.setItem(`nextRuin_${config.id}`, (Date.now() + waitMs).toString());
                    localStorage.removeItem('activeRuinTarget'); resolve(false); return;
                }

                const enterBtn = layerContainer.querySelector('a.layerEntryBtn');
                if (enterBtn) { clickElement(enterBtn); resolve(true); return; }

                localStorage.setItem(`nextRuin_${config.id}`, (Date.now() + 5 * 60 * 1000).toString());
                localStorage.removeItem('activeRuinTarget'); resolve(false);
            }, profilePageLoadDelay);
        });
    }

    async function attemptHunting(currentPage, stats) {
        if (!currentPage.includes('/robbery/')) {
            goTo(huntLink); return true;
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                const extractBtn = document.getElementById("extractBloodBtn");
                const isExtractDisabled = extractBtn && (extractBtn.disabled || extractBtn.classList.contains('extractBloodDisabled'));

                if (extractBtn && !isExtractDisabled) {
                    const rankContainer = document.querySelector(".rank-container");
                    let foundRank = null;
                    if (rankContainer) {
                        const match = rankContainer.textContent.match(/([SABCDEF])\s* - \s*Ranga/i);
                        if (match) foundRank = match[1].toUpperCase();
                    }
                    const allowedRanks = (localStorage.getItem('botCfg_HuntRanks') || 'S,A,B,C,D,E,F').split(',');

                    if (foundRank && allowedRanks.includes(foundRank)) {
                        isNavigating = true;
                        extractBtn.click();
                        setTimeout(() => {
                            const confirmModalBtn = document.getElementById("confirmModal_buttonLeft");
                            if (confirmModalBtn) confirmModalBtn.click();
                        }, 800);
                        setTimeout(() => { window.location.href = huntLink; }, 2500);
                        resolve(true); return;
                    }
                }

                const allSlots = document.querySelectorAll(".slots .slot");
                let activeTimersCount = 0;
                let minTimeSeconds = Infinity;

                allSlots.forEach(slot => {
                    const timerSpan = slot.querySelector('span[data-remaining]');
                    if (timerSpan) {
                        const rem = parseInt(timerSpan.getAttribute('data-remaining') || '0', 10);
                        if (!isNaN(rem) && rem > 0) {
                            activeTimersCount++;
                            if (rem < minTimeSeconds) minTimeSeconds = rem;
                        }
                    }
                });

                const totalSlots = allSlots.length > 0 ? allSlots.length : 3;
                const areAllSlotsBusy = activeTimersCount >= totalSlots;

                if (areAllSlotsBusy && minTimeSeconds !== Infinity) {
                    const readyTimestamp = Date.now() + (minTimeSeconds * 1000) + 5000;
                    localStorage.setItem('nextSphereReady', readyTimestamp.toString());
                } else if (!areAllSlotsBusy) {
                    localStorage.setItem('nextSphereReady', '0');
                }

                const huntSpheresOnly = localStorage.getItem('botCfg_HuntSpheresOnly') === 'true';
                if (areAllSlotsBusy && huntSpheresOnly) { resolve(false); return; }

                const huntLoc = localStorage.getItem('botCfg_HuntLocation') || '1';
                const apCost = huntLoc === '5' ? 2 : 1;

                if (stats.currentAP < apCost) { resolve(false); return; }

                const ponownieBtn = Array.from(document.querySelectorAll("button[type='submit'].btn")).find(el => el.textContent.trim().toLowerCase().includes("ponownie"));
                if (ponownieBtn) {
                    clickElement(ponownieBtn);
                    resolve(true); return;
                }

                const initBtn = document.querySelector(`button[onclick='doHunt(${huntLoc})']`);
                if (initBtn) {
                    clickElement(initBtn);
                    resolve(true); return;
                }

                goTo(huntLink);
                resolve(true);

            }, profilePageLoadDelay);
        });
    }

    async function attemptGraveyard(currentPage) {
        if (!currentPage.includes('/city/graveyard')) {
            goTo(graveyardLink); return true;
        }

        return new Promise((resolve) => {
            setTimeout(() => {
                const workSelect = document.querySelector('select[name="workDuration"]');
                if (!workSelect) { resolve(true); return; }

                const workTimeValue = localStorage.getItem('botCfg_GraveyardTime') || '1';
                workSelect.value = workTimeValue;
                const submitBtn = document.querySelector('input[name="dowork"]');
                if (submitBtn) {
                    clickElement(submitBtn);
                    resolve(true); return;
                }
                resolve(false);
            }, profilePageLoadDelay);
        });
    }

    function findAndClickChoice(wantsToExit) {
        const strategyKey = localStorage.getItem('botCfg_AdvStrategy') || 'exp_gold';
        const activeStrategy = adventureStrategies[strategyKey] || adventureStrategies['exp_gold'];
        const choicePriority = activeStrategy.priority;
        const avoidChoices = activeStrategy.avoid;

        const allChoiceElements = document.querySelectorAll("a.btn[href*='/city/adventure/decision/']");
        if (allChoiceElements.length === 0) return;

        if (wantsToExit) {
            const przyciskZakoncz = Array.from(allChoiceElements).find(el => el.textContent.trim().toLowerCase() === 'zakończ przygodę');
            if (przyciskZakoncz) {
                przyciskZakoncz.style.border = '3px solid red';
                clickElement(przyciskZakoncz);
                return;
            }
        }

        const availableChoices = new Map();
        const availableChoiceTexts = [];
        allChoiceElements.forEach(el => {
            const text = el.textContent.trim();
            if (text) { availableChoices.set(text, el); availableChoiceTexts.push(text); }
        });

        for (const preferredText of choicePriority) {
            const matchingChoice = availableChoiceTexts.find(t => t.toLowerCase() === preferredText.toLowerCase());
            if (matchingChoice) {
                const elementToClick = availableChoices.get(matchingChoice);
                elementToClick.style.border = '3px solid gold';
                clickElement(elementToClick);
                return;
            }
        }

        for (const text of availableChoiceTexts) {
            const isAvoided = avoidChoices.some(avoidText => text.toLowerCase() === avoidText.toLowerCase());
            if (!isAvoided) {
                const elementToClick = availableChoices.get(text);
                elementToClick.style.border = '3px solid white';
                clickElement(elementToClick);
                return;
            }
        }

        const forcedElement = allChoiceElements[0];
        forcedElement.style.border = '3px solid red';
        clickElement(forcedElement);
    }

    async function attemptGrotte(currentPage, wantsToExit) {
        const isOnGrottePage = currentPage.includes('/city/grotte');
        const btnKontynuuj = Array.from(document.querySelectorAll("a.btn")).find(el => el.textContent.trim().toLowerCase().includes('kontynuuj'));

        if (btnKontynuuj) {
            btnKontynuuj.style.border = '3px solid magenta';
            clickElement(btnKontynuuj);
            return true;
        }

        if (wantsToExit) { goTo(profileLink); return true; }
        if (!isOnGrottePage) { goTo(grotteLink); return true; }

        return new Promise((resolve) => {
            setTimeout(() => {
                const diff = localStorage.getItem('botCfg_GrotteDiff') || 'Łatwe';
                const attackBtn = document.querySelector(`input[type="submit"][name="difficulty"][value="${diff}"]`);
                if (attackBtn) {
                    attackBtn.style.border = '3px solid gold';
                    clickElement(attackBtn);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, profilePageLoadDelay);
        });
    }

    function runAdventureLogic(currentPage, wantsToExit) {
        const przyciskTawerna = document.querySelector("button[onclick=\"document.location.href='/city/adventure'\"]");
        const przyciskStartQuest = document.querySelector("a.btn[href='/city/adventure/startquest']");

        const btnList = Array.from(document.querySelectorAll("a.btn"));
        const przyciskKontynuuj = btnList.find(el => el.textContent.trim().toLowerCase().includes('kontynuuj'));
        const przyciskZakoncz = btnList.find(el => el.textContent.trim().toLowerCase() === 'zakończ przygodę');

        const przyciskKontynuujPosredni = document.querySelector("a.btn[href='/city/adventure/']");
        const przyciskDecyzji = document.querySelector("a.btn[href*='/city/adventure/decision/']");

        const isOnAdventurePage = currentPage.includes('/city/adventure');

        if (wantsToExit && przyciskKontynuuj && przyciskZakoncz) {
            przyciskZakoncz.style.border = '3px solid red';
            clickElement(przyciskZakoncz);
            return;
        }

        if (wantsToExit && (przyciskTawerna || przyciskStartQuest)) return;

        if (przyciskTawerna) {
            clickElement(przyciskTawerna);
        } else if (przyciskStartQuest) {
            clickElement(przyciskStartQuest);
        } else if (przyciskKontynuuj) {
            clickElement(przyciskKontynuuj);
        } else if (przyciskKontynuujPosredni) {
            clickElement(przyciskKontynuujPosredni);
        } else if (przyciskDecyzji) {
            findAndClickChoice(false);
        } else if (!isOnAdventurePage) {
            goTo(adventureLink);
        } else {
            goTo(adventureLink);
        }
    }

    /**
     * GŁÓWNY ROUTER LOGIKI
     */
    async function mainLogic() {
        createBotPanel();

        if (localStorage.getItem('botCfg_Main') !== 'true') return;
        if (isNavigating) return;

        // --- ZAMRAŻARKA (BLOKADA PO ZAKUPIE) ---
        const pauseUntil = parseInt(localStorage.getItem('bot_PauseAll') || '0', 10);
        if (Date.now() < pauseUntil) {
            console.log(`TEST: Bot wstrzymany. Czeka na przeładowanie serwera gry po zakupie...`);
            return;
        }

        const stats = getStats();
        if (!stats) return;

        applyLevelRestrictionsToGUI(stats);

        // ==== Wymuszone czyszczenie flag-widm ==================================
        if (stats.currentHP >= (stats.maxHP * healthTriggerPercent)) {
            localStorage.removeItem('needsLifePotion');
        }
        if (stats.currentAP > (stats.maxAP - 20)) {
            localStorage.removeItem('needsEnergyPotion');
        }
        // =======================================================================

        const doPotionLife = localStorage.getItem('botCfg_PotionLife') !== 'false';
        const doPotionEnergy = localStorage.getItem('botCfg_PotionEnergy') === 'true';
        const doAutoBuy = localStorage.getItem('botCfg_PotionAutoBuy') === 'true';
        const chosenLifePotion = localStorage.getItem('botCfg_PotionType') || 'Mała Uzdrawiająca Mikstura';

        const doChurch = localStorage.getItem('botCfg_Church') !== 'false';
        const doClan = localStorage.getItem('botCfg_Clan') !== 'false';
        const doRuins = localStorage.getItem('botCfg_Ruins') !== 'false' && stats.level >= 50;
        const doHunt = localStorage.getItem('botCfg_Hunt') === 'true';
        const doTrain = localStorage.getItem('botCfg_Train') === 'true';
        const doAttributes = localStorage.getItem('botCfg_Attributes') === 'true';
        const doAdventure = localStorage.getItem('botCfg_Adventure') !== 'false';
        const doGrotte = localStorage.getItem('botCfg_Grotte') === 'true';
        const doGraveyard = localStorage.getItem('botCfg_Graveyard') !== 'false';

        const healthSafePercent = parseFloat(localStorage.getItem('botCfg_SafeHp') || '0.50');
        const currentPage = window.location.href;
        if (!currentPage.includes('.gameforge.com/')) return;

        const isChurchOnCooldown = (Date.now() - parseInt(localStorage.getItem('lastChurchUse') || '0', 10) < churchScriptCooldown);

        const onAdventurePage = currentPage.includes('/city/adventure');
        const hasStartQuestBtn = document.querySelector("a.btn[href='/city/adventure/startquest']") !== null;
        const hasTavernBtn = document.querySelector("button[onclick=\"document.location.href='/city/adventure'\"]") !== null;
        const isBusyInAdventure = onAdventurePage && !hasStartQuestBtn && !hasTavernBtn;

        // PRIORYTET 0: ZAKUPY MIKSTUR
        if (doAutoBuy && doPotionLife && localStorage.getItem('needsLifePotion') === 'true' && !isBusyInAdventure) {
            const isBuying = await attemptBuyItem(currentPage, chosenLifePotion, 'needsLifePotion');
            if (isBuying) return;
        }
        if (doAutoBuy && doPotionEnergy && localStorage.getItem('needsEnergyPotion') === 'true' && !isBusyInAdventure) {
            const isBuying = await attemptBuyItem(currentPage, potionEnergyName, 'needsEnergyPotion');
            if (isBuying) return;
        }

        const lastLifeUse = parseInt(localStorage.getItem('lastLifePotionUse') || '0', 10);
        const isLifeOnCooldown = (Date.now() - lastLifeUse < potionScriptCooldown);

        const lastEnergyUse = parseInt(localStorage.getItem('lastEnergyPotionUse') || '0', 10);
        const isEnergyOnCooldown = (Date.now() - lastEnergyUse < potionScriptCooldown);

        // PRIORYTET 1: ZDROWIE KRYTYCZNE
        if (stats.currentHP < (stats.maxHP * healthCriticalPercent)) {
            let healAction = false;

            if (doPotionLife && !isLifeOnCooldown) {
                healAction = await attemptUseItem(currentPage, chosenLifePotion, 'lastLifePotionUse', 'needsLifePotion');
            }
            if (doChurch && !healAction && !isChurchOnCooldown) {
                healAction = await attemptChurchHeal(currentPage);
            }
            if (!healAction) {
                waitAndRefresh("Krytyczne HP, wybrane metody niedostępne (cooldown gry lub skryptu).");
            }
            return;
        }

        // PRIORYTET 2: ZDROWIE NISKIE
        if (doPotionLife && stats.currentHP < (stats.maxHP * healthTriggerPercent) && !isBusyInAdventure) {
            if (!isLifeOnCooldown) {
                const potionSuccess = await attemptUseItem(currentPage, chosenLifePotion, 'lastLifePotionUse', 'needsLifePotion');
                if (potionSuccess) return;
            }
        }

        // PRIORYTET 2.1: ODNOWA ENERGII (-20 PA)
        if (doPotionEnergy && stats.currentAP <= (stats.maxAP - 20) && !isBusyInAdventure) {
            if (!isEnergyOnCooldown) {
                const actionTaken = await attemptUseItem(currentPage, potionEnergyName, 'lastEnergyPotionUse', 'needsEnergyPotion');
                if (actionTaken) return;
            }
        }

        // PRIORYTET 2.2: WOJNA KLANOWA
        if (doClan && !isBusyInAdventure) {
            const clanMenuLink = document.querySelector("a[href*='/clan/index']");
            if (clanMenuLink && clanMenuLink.classList.contains('newmessage')) {
                const nextClanWar = parseInt(localStorage.getItem('nextClanWar') || '0', 10);
                if (Date.now() > nextClanWar) {
                    const isDoingClan = await attemptClanWar(currentPage);
                    if (isDoingClan) return;
                }
            }
        }

        // =========================================================================
        // GLOBALNE ZARZĄDZANIE: CZY TRZEBA WYJŚĆ Z LASU?
        // =========================================================================
        let wantsToExit = false;

        let wantsToRuin = false;
        const activeRuinsLevels = (localStorage.getItem('botCfg_RuinsLevels') || '1,2,3,4,5').split(',').map(Number);
        const activeRuinsConfig = ruinsLevels.filter(r => activeRuinsLevels.includes(r.id));

        if (doRuins) {
            const activeTargetId = localStorage.getItem('activeRuinTarget');
            if (activeTargetId && activeRuinsLevels.includes(Number(activeTargetId))) {
                wantsToRuin = true;
            } else {
                for (const ruin of activeRuinsConfig) {
                    if (Date.now() > parseInt(localStorage.getItem(`nextRuin_${ruin.id}`) || '0', 10)) {
                        wantsToRuin = true; break;
                    }
                }
            }
        }

        let wantsToHunt = false;
        const huntLoc = localStorage.getItem('botCfg_HuntLocation') || '1';
        const apCost = huntLoc === '5' ? 2 : 1;
        const huntSpheresOnly = localStorage.getItem('botCfg_HuntSpheresOnly') === 'true';
        const nextSphereTime = parseInt(localStorage.getItem('nextSphereReady') || '0', 10);

        if (doHunt && stats.currentAP >= apCost) {
            if (!huntSpheresOnly || Date.now() >= nextSphereTime) wantsToHunt = true;
        }

        let wantsToTrain = false;
        if (doTrain) {
            const unitId = localStorage.getItem('botCfg_TrainUnit') || '1';
            const costPerUnit = unitCosts[unitId] || 10;
            if (stats.blood >= costPerUnit) wantsToTrain = true;
        }

        let wantsToUpgrade = false;
        if (doAttributes) {
            const nextAttrCheck = parseInt(localStorage.getItem('bot_NextAttrCheck') || '0', 10);
            const activeAttrs = (localStorage.getItem('botCfg_AttrList') || '').split(',').filter(Boolean);

            if (Date.now() > nextAttrCheck) {
                for (const attr of activeAttrs) {
                    const savedCost = localStorage.getItem('bot_attrCost_' + attr);

                    if (!savedCost || isNaN(savedCost)) {
                        wantsToUpgrade = true;
                        break;
                    } else if (stats.gold >= parseInt(savedCost, 10)) {
                        wantsToUpgrade = true;
                        break;
                    }
                }
            }
        }

        let wantsToWork = false;
        if (doGraveyard && stats.currentAP < 3 && !wantsToHunt) {
            if (!doPotionEnergy || isEnergyOnCooldown) wantsToWork = true;
        }

        if (doAdventure && stats.currentAP < 3) wantsToExit = true;
        if (doGrotte && stats.currentAP < 1) wantsToExit = true;
        if (!doAdventure && !doGrotte && stats.currentAP < 1) wantsToExit = true;

        if (stats.currentHP < (stats.maxHP * healthSafePercent)) wantsToExit = true;
        if (wantsToRuin || wantsToHunt || wantsToTrain || wantsToWork) wantsToExit = true;

        // =========================================================================
        // REALIZACJA MODUŁÓW
        // =========================================================================

        if (wantsToUpgrade) {
            const isUpgrading = await attemptAttributesUpgrade(currentPage, stats);
            if (isUpgrading) return;
        }

        if (wantsToRuin && !isBusyInAdventure) {
            const activeTargetId = localStorage.getItem('activeRuinTarget');
            if (activeTargetId && (currentPage.includes('/ancestral/show') || currentPage.includes('/ancestral/fight'))) {
                const activeRuin = activeRuinsConfig.find(r => r.id == activeTargetId);
                if (activeRuin) {
                    const isDoingRuins = await attemptRuins(currentPage, activeRuin);
                    if (isDoingRuins) return;
                }
            }
            for (const ruin of activeRuinsConfig) {
                if (Date.now() > parseInt(localStorage.getItem(`nextRuin_${ruin.id}`) || '0', 10)) {
                    localStorage.setItem('activeRuinTarget', ruin.id.toString());
                    const isDoingRuins = await attemptRuins(currentPage, ruin);
                    if (isDoingRuins) return;
                }
            }
            if (activeTargetId && !currentPage.includes('/ancestral/')) localStorage.removeItem('activeRuinTarget');
        }

        if (wantsToHunt && !isBusyInAdventure) {
            const isHunting = await attemptHunting(currentPage, stats);
            if (isHunting) return;
        }

        if (wantsToTrain && !isBusyInAdventure) {
            const isTraining = await attemptTraining(currentPage, stats);
            if (isTraining) return;
        }

        if (wantsToWork && !isBusyInAdventure) {
            const isWorking = await attemptGraveyard(currentPage);
            if (isWorking) return;
        }

        // =========================================================================
        // ZABEZPIECZENIE PRZED ŚMIERCIĄ
        // =========================================================================
        if (stats.currentHP < (stats.maxHP * healthSafePercent) && !isBusyInAdventure) {
            waitAndRefresh(`Zdrowie poniżej bezpiecznego progu (${Math.round(healthSafePercent*100)}%). Czekam na regenerację`);
            return;
        }

        // PRIORYTET 3: PRZYGODA W LESIE
        if (isBusyInAdventure || (doAdventure && stats.currentAP >= 3)) {
            const forceExit = wantsToExit || !doAdventure;
            runAdventureLogic(currentPage, forceExit);
            return;
        }

        // PRIORYTET 4: GROTA
        if (doGrotte && (stats.currentAP >= 1 || currentPage.includes('/city/grotte'))) {
            const isDoingGrotte = await attemptGrotte(currentPage, wantsToExit);
            if (isDoingGrotte) return;
        }

        // =========================================================================
        // TRYB BEZCZYNNOŚCI (IDLE)
        // =========================================================================
        if (!isNavigating) {
            const idleMin = 2 * 60 * 1000;
            const idleMax = 5 * 60 * 1000;
            const idleTime = Math.floor(Math.random() * (idleMax - idleMin + 1)) + idleMin;
            console.log(`TEST: Brak zadań (Bezczynność). Odświeżę stronę za około ${Math.round(idleTime / 1000 / 60)} min...`);
            setTimeout(() => { window.location.reload(); }, idleTime);
            isNavigating = true;
        }
    }

    async function startBotLoop() {
        try { await mainLogic(); }
        catch (e) { console.error("Bot Error:", e); }
        if (!isNavigating) { setTimeout(startBotLoop, 1000); }
    }

    setTimeout(startBotLoop, 500);

})();
