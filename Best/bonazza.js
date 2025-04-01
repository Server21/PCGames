document.addEventListener("DOMContentLoaded", function() {
  // Se l'utente è già loggato, reindirizza a bonazza.html
  if (localStorage.getItem("loggedInUser")) {
    window.location.href = "bonazza.html";
  }

  document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    try {
      const response = await fetch("https://raw.githubusercontent.com/Server21/PCGames/refs/heads/main/accounts.json");
      const accounts = await response.json();

      if (accounts[username]) {
        let accountData = accounts[username];
        // Gestione formato stringa o oggetto (per eventuale data di scadenza)
        let validPassword = (typeof accountData === "string") ? accountData : accountData.password;
        if (password === validPassword) {
          // (Simulazione) Controllo per impedire login simultanei da dispositivi diversi
          if (localStorage.getItem("activeUser") && localStorage.getItem("activeUser") !== username) {
            alert("Questo account è già connesso su un altro dispositivo. Effettua il logout prima di accedere da un nuovo dispositivo.");
            return;
          }
          localStorage.setItem("loggedInUser", username);
          localStorage.setItem("activeUser", username);
          if (rememberMe) {
            localStorage.setItem("rememberMe", "true");
          }
          window.location.href = "bonazza.html";
        } else {
          alert("Credenziali errate.");
        }
      } else {
        alert("Utente non trovato.");
      }
    } catch (error) {
      console.error("Errore nel caricamento degli account: ", error);
    }
  });
});
