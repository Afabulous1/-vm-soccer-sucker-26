"use client";

import { useEffect } from "react";
import { useToast } from "./ToastProvider";

const MESSAGES = [
  "Välkommen tillbaka! Redo att slå kompisarna? 🔥",
  "Du är tillbaka! VM väntar — dina gissningar med det? ⚽",
  "Inloggad och redo! Klockan tickar mot den 1 juni ⏰",
  "Välkommen, gissaren! Låt oss hoppas på kaos 🎯",
  "Hej hej! Ligatabellen uppdateras — kolla läget 👀",
];

const SESSION_KEY = "vm26_welcomed";

export default function LoginWelcome({ username }: { username: string }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const id  = setTimeout(() => showToast(`${username}! ${msg}`, "success"), 700);
    return () => clearTimeout(id);
  }, [username, showToast]);

  return null;
}
