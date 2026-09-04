// === Global Variables ===

let allPokemon = [];
let currentOffset = 0;
let currentPokemonIndex = 0;
let currentTab = "main";
let evolutionCache = {};
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

async function loadEvolutionChain(pokemonId) {
  let speciesResponse = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`,
  );
  let species = await speciesResponse.json();
  let chainResponse = await fetch(species.evolution_chain.url);
  let chainData = await chainResponse.json();
  return chainData.chain;
}

function getIdFromUrl(url) {
  let parts = url.split("/");
  return parts[parts.length - 2];
}
async function getEvolutionChain(pokemonId) {
  if (evolutionCache[pokemonId]) {
    return evolutionCache[pokemonId];
  }
  let chain = await loadEvolutionChain(pokemonId);
  evolutionCache[pokemonId] = chain;
  return chain;
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
    <div class="tabContent">${getTabContentTemplate(pokemon)}</div>
  </div>`;
}

function getTabsTemplate() {
  return `
  <div class="tabList">
  <button class="tabButton ${currentTab === "main" ? "active" : ""}" onclick="switchTab('main')">main</button>
  <button class="tabButton ${currentTab === "stats" ? "active" : ""}" onclick="switchTab('stats')">stats</button>
  <button class="tabButton ${currentTab === "evo" ? "active" : ""}" onclick="switchTab('evo')">evo chain</button>
</div>`;
}

async function switchTab(tabName) {
  currentTab = tabName;
  renderDialogContent();
  if (tabName === "evo") {
    await renderEvolutionChain();
  }
}

async function renderEvolutionChain() {
  let pokemon = allPokemon[currentPokemonIndex];
  let chain = await getEvolutionChain(pokemon.id);
  let evoContentRef = document.getElementById("evoContent");
  if (evoContentRef) {
    evoContentRef.innerHTML = getEvolutionTemplate(chain);
  }
}

function getEvolutionTemplate(chain) {
  let stages = getEvolutionStages(chain);
  let html = "";
  for (let index = 0; index < stages.length; index++) {
    if (index > 0) {
      html += `<span class="evoArrow">&raquo;</span>`;
    }
    html += getEvolutionStageTemplate(stages[index]);
  }
  return `<div class="evoChain">${html}</div>`;
}

function getEvolutionStages(chain) {
  let stages = [
    { name: chain.species.name, id: getIdFromUrl(chain.species.url) },
  ];
  let current = chain;
  while (current.evolves_to.length > 0) {
    current = current.evolves_to[0];
    stages.push({
      name: current.species.name,
      id: getIdFromUrl(current.species.url),
    });
  }
  return stages;
}

function getEvolutionStageTemplate(stage) {
  let image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${stage.id}.svg`;
  return `
<div class="evoStage">
  <img src="${image}" alt="${stage.name}">
  <span class="evoName">${stage.name}</span>
</div>`;
}

function getTabContentTemplate(pokemon) {
  if (currentTab === "stats") {
    return getStatsTemplate(pokemon.stats);
  }
  if (currentTab === "evo") {
    return `<div id="evoContent"><img src="./assets/icons/favicon.png" alt=""></div>`;
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

function getStatsTemplate(stats) {
  let rows = "";
  for (let index = 0; index < stats.length; index++) {
    let percentage = (stats[index].base_stat / 255) * 100;
    rows += `
    <div class="statRow">
  <span class="statName">${stats[index].stat.name}</span>
  <span class="statBar"
    ><span class="statFill" style="width: ${percentage}%"></span
  ></span>
</div>`;
  }
  return rows;
}

// === Dialog ===

async function openDialog(pokemonId) {
  currentPokemonIndex = allPokemon.findIndex(
    (pokemon) => pokemon.id === pokemonId,
  );
  renderDialogContent();
  let dialogRef = document.querySelector(`[data-id="dialog"]`);
  dialogRef.showModal();
  document.body.style.overflow = "hidden";
  if (currentTab === "evo") {
    await renderEvolutionChain();
  }
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

async function changePokemon(direction) {
  let newIndex = currentPokemonIndex + direction;
  if (newIndex >= 0 && newIndex < allPokemon.length) {
    currentPokemonIndex = newIndex;
    renderDialogContent();
    if (currentTab === "evo") {
      await renderEvolutionChain();
    }
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
