// === Global Variables ===

let allPokemon = [];
let currentOffset = 0;
let currentPokemonIndex = 0;
let currentTab = "main";
const LIMIT = 20;

// === Init ===

async function init() {
  toggleLoadingScreen(true);
  await loadPokemonBatch();
  renderPokemonCards(allPokemon);
  toggleLoadingScreen(false);
}

// === API ===

async function loadPokemonDetails(id) {
  let url = `https://pokeapi.co/api/v2/pokemon/${id}`;
  let response = await fetch(url);
  let pokemon = await response.json();

  return pokemon;
}

async function loadPokemonBatch() {
  let requests = [];
  for (let id = currentOffset + 1; id <= currentOffset + LIMIT; id++) {
    requests.push(loadPokemonDetails(id));
  }
  let newPokemon = await Promise.all(requests);
  allPokemon = allPokemon.concat(newPokemon);
  currentOffset += LIMIT;
}

async function loadMorePokemon() {
  let buttonRef = document.querySelector(`[data-id="load-more-button"]`);
  buttonRef.disabled = true;
  toggleLoadingScreen(true);
  await loadPokemonBatch();
  renderPokemonCards(allPokemon);
  toggleLoadingScreen(false);
  buttonRef.disabled = false;
}

// === Rendern ===

function renderPokemonCards(pokemonList) {
  let cardListRef = document.getElementById("cardList");
  cardListRef.innerHTML = "";
  for (let index = 0; index < pokemonList.length; index++) {
    cardListRef.innerHTML += getPokemonCardTemplate(pokemonList[index]);
  }
}

// === Templates ===

function getPokemonCardTemplate(pokemon) {
  let mainType = pokemon.types[0].type.name;
  let image = pokemon.sprites.other.dream_world.front_default;
  return `
    <li>
  <button class="card type-${mainType}" data-id="card" onclick="openDialog(${pokemon.id})" aria-label="Show details for ${pokemon.name}">
    <img data-id="card-image" src="${image}" alt="${pokemon.name}">
    <span class="cardId">#${pokemon.id}</span>
    <span class="cardName">${pokemon.name}</span>
    <span class="typeList">${getTypePillsTemplate(pokemon.types)}</span>
  </button>
</li>`;
}

function getTypePillsTemplate(types) {
  let pills = "";
  for (let index = 0; index < types.length; index++) {
    let typeName = types[index].type.name;
    pills += `<img class="typeIcon" src="./assets/icons/types/${typeName}.svg" alt="${typeName}">`;
  }
  return pills;
}

function getDialogTemplate(pokemon) {
  let mainType = pokemon.types[0].type.name;
  let image = pokemon.sprites.other.dream_world.front_default;
  return `
  <div class="dialogInner type-${mainType}">
    <span class="dialogId">#${pokemon.id}</span>
    <h2 class="dialogName">${pokemon.name}</h2>
    <img data-id="dialog-image" src="${image}" alt="${pokemon.name}">
    <span class="typeList">${getTypePillsTemplate(pokemon.types)}</span>
    ${getTabsTemplate()}
    <div class="tabContent">${gettabContentTemplate(pokemon)}</div>
  </div>`;
}
function getTabsTemplate() {
  return `
  <div class="tabList">
  <button class="tabButton ${currentTab === "main" ? "active" : ""}" onclick="switchTab('main')">main</button>
  <button class="tabButton ${currentTab === "stats" ? "active" : ""}" onclick="switchTab('stats')">stats</button>
</div>`;
}

function switchTab(tabName) {
  currentTab = tabName;
  renderDialogContent();
}

function gettabContentTemplate(pokemon) {
  if (currentTab === "stats") {
    return getStatsTemplate(pokemon.stats);
  }
  return getMainTemplate(pokemon);
}

function getMainTemplate(pokemon) {
  let abilities = pokemon.abilities
    .map((entry) => entry.ability.name)
    .join(", ");
  return `
    <p>Height: ${pokemon.height / 10} m</p>
    <p>Weight: ${pokemon.weight / 10} kg</p>
    <p>Base experience: ${pokemon.base_experience}</p>
    <p>Abilities: ${abilities}</p>`;
}

// === Dialog ===

function openDialog(pokemonId) {
  currentPokemonIndex = allPokemon.findIndex(
    (pokemon) => pokemon.id === pokemonId,
  );
  renderDialogContent();
  let dialogRef = document.querySelector(`[data-id="dialog"]`);
  dialogRef.showModal();
  document.body.style.overflow = "hidden";
}

function renderDialogContent() {
  let pokemon = allPokemon[currentPokemonIndex];
  let contentRef = document.getElementById("dialogContent");
  contentRef.innerHTML = getDialogTemplate(pokemon);
}

function closeDialog() {
  let dialogRef = document.querySelector(`[data-id="dialog"]`);
  dialogRef.close();
  document.body.style.overflow = "";
}

function changePokemon(direction) {
  let newIndex = currentPokemonIndex + direction;
  if (newIndex >= 0 && newIndex < allPokemon.length) {
    currentPokemonIndex = newIndex;
    renderDialogContent();
  }
}

// === Loadingscreen ===

function toggleLoadingScreen(isVisible) {
  let loadingRef = document.getElementById("loadingScreen");
  loadingRef.classList.toggle("hidden", !isVisible);
}

// === Search ===

function searchPokemon() {
  let inputRef = document.querySelector(`[data-id="search-input"]`);
  let searchTerm = inputRef.value.trim().toLowerCase();
  toggleNotFoundMessage(false);
  toggleSearchHint(searchTerm.length < 3);
  if (searchTerm.length < 3) {
    renderPokemonCards(allPokemon);
    return;
  }
  let results = allPokemon.filter((pokemon) =>
    pokemon.name.includes(searchTerm),
  );
  renderPokemonCards(results);
  toggleNotFoundMessage(results.length === 0);
}

function toggleNotFoundMessage(isVisible) {
  let messageRef = document.querySelector(`[data-id="not-found"]`);
  if (isVisible && !messageRef) {
    let contentRef = document.querySelector(`[data-id="content"]`);
    contentRef.innerHTML += `<p data-id="not-found" class="notFound">No match found.</p>`;
  } else if (!isVisible && messageRef) {
    messageRef.remove();
  }
}

function toggleSearchHint(isVisible) {
  let hintRef = document.getElementById("searchHint");
  hintRef.classList.toggle("hidden", !isVisible);
}

function checkSearchInput() {
  let inputRef = document.querySelector(`[data-id="search-input"]`);
  let searchTerm = inputRef.value.trim();
  toggleSearchHint(searchTerm.length > 0 && searchTerm.length < 3);
}
