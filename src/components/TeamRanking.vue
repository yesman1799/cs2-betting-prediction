<template>
  <div class="team-ranking">
    <h1>Team Rankings</h1>
    <ul v-if="teams.length">
      <li
        v-for="item in teams"
        :key="item.team.id"
        class="ranking-item"
      >
        <!-- Left: Placement -->
        <div class="position">{{ item.place }}</div>
        
        <!-- Middle: Team Logo and Name -->
        <div class="team-info">
          <img
            v-if="item.team.logo"
            :src="item.team.logo"
            alt="Logo"
            class="logo"
          />
          <span class="name">{{ item.team.name }}</span>
        </div>
        
        <!-- Right: Points -->
        <div class="points">{{ item.points }}</div>
      </li>
    </ul>
    <p v-else>Loading teams data...</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const teams = ref([])

onMounted(async () => {
  try {
    const response = await fetch('/data/teamRanking.json')
    const data = await response.json()
    teams.value = data
  } catch (error) {
    console.error('Error loading teams data:', error)
  }
})
</script>

<style scoped>
.team-ranking {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px;
}

.team-ranking h1 {
  text-align: center;
  margin-bottom: 30px;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 10px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ccc;
}

.position {
  width: 80px;
  text-align: center;
  font-size: 1.5em;
  font-weight: bold;
}

.team-info {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 30px;
}

.logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: 20px;
}

.name {
  font-size: 1.5em;
  font-weight: 600;
}

.points {
  width: 100px;
  text-align: center;
  font-size: 1.5em;
  font-weight: bold;
}
</style>
