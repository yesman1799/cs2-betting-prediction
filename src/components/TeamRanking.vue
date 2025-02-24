<template>
  <div class="team-ranking">
    <h1>Team Rankings</h1>
    <ul v-if="mergedTeams.length">
      <li v-for="item in mergedTeams" :key="item.team.id" class="ranking-item">
        <!-- Left: Placement -->
        <div class="position">{{ item.place }}</div>
        
        <!-- Middle: Team Logo and Name -->
        <div class="team-info">
          <img
            v-if="item.team.logo"
            :src="item.team.logo"
            :alt="`Logo of ${item.team.name}`"
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
import { ref, onMounted, computed } from 'vue'

const ranking = ref([]);
const teamsDetails = ref([]);

const mergedTeams = computed(() => {
  return ranking.value.map(item => {
    const detailed = teamsDetails.value.find(t => t.id === item.team.id);
    return {
      ...item,
      team: {
        ...item.team,
        logo: detailed && detailed.logo ? detailed.logo : item.team.logo || ''
      }
    }
  });
});

onMounted(async () => {
  try {
    const rankingResponse = await fetch('/data/teamRanking.json');
    ranking.value = await rankingResponse.json();

    const teamsResponse = await fetch('/data/teams.json');
    teamsDetails.value = await teamsResponse.json();
  } catch (error) {
    console.error('Error loading teams data:', error);
  }
});
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
