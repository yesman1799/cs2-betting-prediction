<template>
  <div id="app">
    <nav>
      <router-link to="/" class="nav-link">Team Rankings</router-link>
      <router-link to="/matches" class="nav-link">Matches</router-link>
      <router-link to="/stats" class="nav-link">Team Stats</router-link>
      <router-link to="/head-to-head" class="nav-link">Head-to-Head</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script setup>
// No additional logic needed here.
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
}

nav {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  background-color: #f5f5f5;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-weight: bold;
}

.nav-link.router-link-active {
  color: #42b983;
}
</style>
