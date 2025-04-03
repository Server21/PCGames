document.addEventListener("DOMContentLoaded", function() {
  const user = localStorage.getItem("loggedInUser");
  if (!user) {
    // Se l'utente non è loggato, reindirizza alla pagina di login
    window.location.href = "login.html";
    return;
  }

  // Visualizza le informazioni dell'utente e il numero di utenti online (simulato)
  document.getElementById("userDisplay").innerText = user;
  document.getElementById("onlineUsers").innerText = "Utenti online: " + (parseInt(localStorage.getItem("onlineCount")) || 1);

  // Carica le informazioni sull'abbonamento da accounts.json e mostra la data di scadenza
  fetch("https://raw.githubusercontent.com/Server21/PCGames/refs/heads/main/accounts.json")
    .then(response => response.json())
    .then(accounts => {
      if (accounts[user]) {
        let accountData = accounts[user];
        if (typeof accountData === "object" && accountData.expires) {
          const expireDate = new Date(accountData.expires);
          const today = new Date();
          const diffTime = expireDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          document.getElementById("expiresInfo").innerText = 
            "Scadenza: " + expireDate.toLocaleDateString() + " (" + diffDays + " giorni rimanenti)";
        } else {
          document.getElementById("expiresInfo").innerText = "Abbonamento a vita";
        }
      }
    })
    .catch(error => console.error("Errore nel caricamento degli account: ", error));

  // Logout: rimuove i dati di login e reindirizza alla pagina di login
  document.getElementById("logoutBtn").addEventListener("click", function() {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("activeUser");
    window.location.href = "login.html";
  });

  // Carica i giochi da games.json
  let gamesData = [];
  fetch("https://server21.github.io/PCGames/games.json")
    .then(response => response.json())
    .then(data => {
      gamesData = data;
      populateTagFilter(gamesData);
      displayGames(gamesData);
    })
    .catch(error => console.error("Errore nel caricamento dei giochi: ", error));

  // Funzionalità di ricerca e filtro
  document.getElementById("searchInput").addEventListener("input", function() {
    const query = this.value.toLowerCase();
    const selectedTag = document.getElementById("tagFilter").value;
    const filteredGames = gamesData.filter(game => {
      const matchesQuery = game.name.toLowerCase().includes(query) || game.description.toLowerCase().includes(query);
      const matchesTag = selectedTag === "" || (game.category && game.category.includes(selectedTag));
      return matchesQuery && matchesTag;
    });
    displayGames(filteredGames);
  });

  document.getElementById("tagFilter").addEventListener("change", function() {
    document.getElementById("searchInput").dispatchEvent(new Event('input'));
  });

  function populateTagFilter(games) {
    const tags = new Set();
    games.forEach(game => {
      if (game.category) {
        game.category.forEach(tag => tags.add(tag));
      }
    });
    const tagFilter = document.getElementById("tagFilter");
    tags.forEach(tag => {
      const option = document.createElement("option");
      option.value = tag;
      option.innerText = tag;
      tagFilter.appendChild(option);
    });
  }

  function displayGames(games) {
    const container = document.getElementById("gamesContainer");
    container.innerHTML = "";
    games.forEach(game => {
      const gameDiv = document.createElement("div");
      gameDiv.className = "game";

      const img = document.createElement("img");
      img.src = game.image_url;
      img.alt = game.name;

      const title = document.createElement("h3");
      title.innerText = game.name;

      const description = document.createElement("p");
      description.innerText = game.description;

      // Tag (categorie)
      const tagsDiv = document.createElement("div");
      tagsDiv.className = "tags";
      if (game.category) {
        game.category.forEach(tag => {
          const span = document.createElement("span");
          span.className = "tag";
          span.innerText = tag;
          tagsDiv.appendChild(span);
        });
      }

      // Lingue supportate
      const languagesDiv = document.createElement("div");
      languagesDiv.className = "languages";
      if (game.languages) {
        game.languages.forEach(lang => {
          const span = document.createElement("span");
          span.className = "language";
          span.innerText = lang;
          languagesDiv.appendChild(span);
        });
      }

      // Pulsante per il download (apre l'iframe nella stessa pagina)
      const downloadBtn = document.createElement("button");
      downloadBtn.innerText = "Download";
      downloadBtn.addEventListener("click", function() {
        loadDownload(game.download_link);
      });

      gameDiv.appendChild(img);
      gameDiv.appendChild(title);
      gameDiv.appendChild(description);
      gameDiv.appendChild(tagsDiv);
      gameDiv.appendChild(languagesDiv);
      gameDiv.appendChild(downloadBtn);

      container.appendChild(gameDiv);
    });
  }

  function loadDownload(link) {
    let downloadArea = document.getElementById("downloadArea");
    if (!downloadArea) {
      downloadArea = document.createElement("div");
      downloadArea.id = "downloadArea";
      document.body.appendChild(downloadArea);
    }
    downloadArea.innerHTML = `<iframe src="${link}" width="100%" height="600px" frameborder="0"></iframe>`;
  }

  // --- Gestione Chat ---
  const telegramBotToken = "7370826671:AAE8mLjIygj2DmvduIFobmRVKVgqvjugkdM";
  const telegramChatId = "1832064994";

  function canSendMessage() {
    let chatData = JSON.parse(localStorage.getItem("chatData")) || { count: 0, date: new Date().toISOString().slice(0, 10) };
    const today = new Date().toISOString().slice(0, 10);
    if (chatData.date !== today) {
      chatData = { count: 0, date: today };
    }
    return chatData.count < 2;
  }

  function incrementMessageCount() {
    let chatData = JSON.parse(localStorage.getItem("chatData")) || { count: 0, date: new Date().toISOString().slice(0, 10) };
    const today = new Date().toISOString().slice(0, 10);
    if (chatData.date !== today) {
      chatData = { count: 0, date: today };
    }
    chatData.count++;
    localStorage.setItem("chatData", JSON.stringify(chatData));
  }

  document.getElementById("sendChatBtn").addEventListener("click", function() {
    const message = document.getElementById("chatInput").value.trim();
    if (message === "") return;
    if (!canSendMessage()) {
      alert("Hai raggiunto il limite di messaggi per oggi.");
      return;
    }
    sendTelegramMessage(message);
  });

  function sendTelegramMessage(message) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const data = {
      chat_id: telegramChatId,
      text: `[${user}]: ${message}`
    };

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(response => response.json())
      .then(result => {
        if (result.ok) {
          incrementMessageCount();
          const chatMessages = document.getElementById("chatMessages");
          const msgDiv = document.createElement("div");
          msgDiv.className = "chat-message";
          msgDiv.innerText = message;
          chatMessages.appendChild(msgDiv);
          document.getElementById("chatInput").value = "";
        } else {
          alert("Errore nell'invio del messaggio.");
        }
      })
      .catch(error => console.error("Errore nella chat: ", error));
  }

  // Aggiornamento in tempo reale dei giochi ogni 30 secondi (polling)
  setInterval(function() {
    fetch("https://server21.github.io/PCGames/games.json")
      .then(response => response.json())
      .then(data => {
        gamesData = data;
        displayGames(gamesData);
      });
  }, 30000);

  // Gestione apertura/chiusura chat
  const openChatBtn = document.getElementById("openChatBtn");
  const chatContainer = document.getElementById("chatContainer");
  const closeChatBtn = document.getElementById("closeChat");

  openChatBtn.addEventListener("click", function() {
    chatContainer.style.display = "flex";
    openChatBtn.style.display = "none";
  });

  closeChatBtn.addEventListener("click", function() {
    chatContainer.style.display = "none";
    openChatBtn.style.display = "block";
  });
});
