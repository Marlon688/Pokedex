async function loadPokemonDetails(id) {
  let url = `https://pokeapi.co/api/v2/pokemon/${id}`;
  let response = await fetch(url);
  let pokemon = await response.json();
  return pokemon;
}

let allPokemon = [];
let currentOffset = 0;
const LIMIT = 20;
async function loadPokemonBatch() {
  let requests = [];
  for (let id = currentOffset + 1; id <= currentOffset + LIMIT; id++) {
    requests.push(loadPokemonDetails(id));
  }
  let newpokemon = await Promise.all(requests);
  allPokemon = allPokemon.concat(newpokemon);
  currentOffset += LIMIT;
}

function renderPokemonCards() {
  let cardListRef = document.getElementById("cardList");
  cardListRef.innerHTML = "";
  for (let index = 0; index < allPokemon.length; index++) {
    cardListRef.innerHTML += getPokemonCardTemplate(allPokemon[index]);
  }
}

function getPokemonCardTemplate(pokemon) {
  let mainType = pokemon.types[0].type.name;
  let image = pokemon.sprites.other.dream_world.front_default;
  return `
    <li>
  <button class="card type-${mainType}" data-id="card" aria-label="Show details for ${pokemon.name}">
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

async function loadMorePokemon() {
  let buttonRef = document.querySelector(`[data-id="load-more-button"]`);
  buttonRef.disabled = true;
  await loadPokemonBatch();
  renderPokemonCards();
  buttonRef.disabled = false;
}

async function init() {
  await loadPokemonBatch();
  renderPokemonCards();
}
