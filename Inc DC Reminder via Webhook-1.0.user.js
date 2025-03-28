// ==UserScript==
// @name         Inc DC Reminder via Webhook
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sendet Discord-Nachricht bei Inc-Erhöhung.
// @author       Marcel2511
// @match        https://*.die-staemme.de/*
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    let intervalId = null;
    let intervalTime = 10000; // 10 Sekunden Standard
    let lastSentValue = 0;

    async function getWebhook() {
        return await GM_getValue("webhookURL", "");
    }

    async function setWebhook() {
        const current = await getWebhook();
        const input = prompt("Discord Webhook-URL:", current);
        if (input && input.startsWith("https://discord.com/api/webhooks/")) {
            await GM_setValue("webhookURL", input);
            alert("Webhook gespeichert.");
        } else if (input) {
            alert("Ungültige Webhook-URL.");
        }
    }

    function getSpielerName() {
        const el = document.querySelector('a[href*="screen=ranking"]');
        return el ? el.textContent.trim() : "Unbekannt";
    }

    async function sendToDiscord(value) {
        const webhookURL = await getWebhook();
        if (!webhookURL) {
            console.warn("Kein Webhook gesetzt.");
            return;
        }

        const spielerName = getSpielerName();
        const payload = {
            content: `Neuer Inc – ${spielerName} – Gesamtanzahl: ${value}`,
            username: "Incs-Bot",
            avatar_url: "https://i.imgur.com/4M34hi2.png"
        };

        fetch(webhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(() => console.log("Discord-Benachrichtigung gesendet:", value))
        .catch(err => console.error("Fehler beim Senden:", err));
    }

    function checkValue() {
        const p = document.getElementById("incomings_amount");
        if (p) {
            const x = parseInt(p.textContent.trim(), 10);
            if (!isNaN(x) && x > 0 && x > lastSentValue) {
                sendToDiscord(x);
                lastSentValue = x;
            } else if (!isNaN(x) && x < lastSentValue) {
                lastSentValue = x;
            }
        }
    }

    async function startInterval() {
        const webhookURL = await getWebhook();
        if (!webhookURL) {
            alert("Bitte DC Webhook setzen");
            return;
        }

        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(checkValue, intervalTime);
        console.log("Intervall gestartet mit", intervalTime / 1000, "Sekunden");
    }

    function stopInterval() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            console.log("Intervall gestoppt.");
        }
    }

    function changeIntervalTime() {
        const newTimeSec = prompt("Neues Intervall in **Sekunden**:", intervalTime / 1000);
        if (newTimeSec !== null) {
            const parsed = parseInt(newTimeSec, 10);
            if (!isNaN(parsed) && parsed > 0) {
                intervalTime = parsed * 1000;
                console.log("Neues Intervall gesetzt:", parsed, "Sekunden");
                if (intervalId) {
                    startInterval(); // Neustart mit neuem Wert
                }
            } else {
                alert("Ungültige Eingabe.");
            }
        }
    }

    // Menüeinträge
    GM_registerMenuCommand("Start Intervall", startInterval);
    GM_registerMenuCommand("Stop Intervall", stopInterval);
    GM_registerMenuCommand("Intervall ändern", changeIntervalTime);
    GM_registerMenuCommand("Webhook eingeben", setWebhook);
})();
