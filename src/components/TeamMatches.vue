<template>
  <div class="team-matches">
    <h2>Recent Matches for {{ teamStats ? teamStats.name : '' }}</h2>
    <div class="team-select">
      <label for="team-select">Select Team:</label>
      <select id="team-select" v-model="selectedTeam" @change="onTeamChange">
        <option v-for="team in teams" :key="team.team.id" :value="team">
          {{ team.team.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading">Loading match data...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    <div v-else-if="processedMatches.length">
      <h3>{{ teamStats.name }} - Recent Matches (BO3)</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Opponent</th>
            <th>Match Score</th>
            <th>Overall Result</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(match, index) in processedMatches"
            :key="index"
            class="match-row"
            @click="togglePopup(match)"
          >
            <td>{{ formatDate(match.date) }}</td>
            <td>{{ match.event }}</td>
            <td>{{ match.opponent }}</td>
            <td>{{ match.matchScore }}</td>
            <td>{{ match.overallResult }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else>
      <p>No match data available for this team.</p>
    </div>

    <!-- Modal Popup for match details -->
    <div v-if="activeMatch" class="modal-overlay" @click.self="activeMatch = null">
      <div class="modal-content">
        <h3>Match Details</h3>
        <p><strong>Event:</strong> {{ activeMatch.event }}</p>
        <p><strong>Date:</strong> {{ formatDate(activeMatch.date) }}</p>
        <p><strong>Opponent:</strong> {{ activeMatch.opponent }}</p>
        <p>
          <strong>Match Score:</strong>
          {{ activeMatch.matchScore }} ({{ activeMatch.overallResult }})
        </p>
        <table class="maps-table">
          <thead>
            <tr>
              <th>Map</th>
              <th>Your Score</th>
              <th>Opponent Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(map, idx) in activeMatch.mapsDetail" :key="idx">
              <td>{{ map.map }}</td>
              <td>{{ map.myScore }}</td>
              <td>{{ map.oppScore }}</td>
            </tr>
          </tbody>
        </table>
        <button class="close-button" @click="activeMatch = null">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// Helper: sanitize team names for filenames.
function sanitizeFileName(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

// Helper: format a timestamp into a readable date.
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

const teams = ref([]);           // Teams loaded from teamRanking.json
const selectedTeam = ref(null);  // Selected team object
const teamStats = ref(null);     // Stats for the selected team
const loading = ref(false);
const error = ref(null);
const activeMatch = ref(null);   // Holds the match whose popup is active

// Fetch teams from teamRanking.json
async function fetchTeams() {
  try {
    const response = await fetch('/data/teamRanking.json');
    const data = await response.json();
    teams.value = data;
    if (teams.value.length > 0) {
      selectedTeam.value = teams.value[0];
      await fetchTeamStats();
    }
  } catch (err) {
    console.error('Error fetching teams:', err);
    error.value = err.message;
  }
}

// Fetch stats for the selected team using its sanitized name.
async function fetchTeamStats() {
  if (!selectedTeam.value) return;
  loading.value = true;
  error.value = null;
  const teamName = selectedTeam.value.team.name;
  const sanitizedName = sanitizeFileName(teamName);
  try {
    const response = await fetch(`/data/teamStats/${sanitizedName}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const statsData = await response.json();
    if (!statsData.name || statsData.name.trim() === "") {
      statsData.name = teamName;
    }
    teamStats.value = statsData;
  } catch (err) {
    console.error(`Error fetching stats for ${teamName}:`, err);
    error.value = err.message;
    teamStats.value = null;
  } finally {
    loading.value = false;
  }
}

function onTeamChange() {
  activeMatch.value = null;
  fetchTeamStats();
}

// Group individual map results into matches.
// Here we assume maps belong to the same match if they share the same event id, the same opponent id,
// and their timestamps differ by less than 3 hours.
function groupMapsIntoMatches(matches) {
  const groups = [];
  const THRESHOLD = 3 * 60 * 60 * 1000; // 3 hours in ms
  const myTeamId = selectedTeam.value.team.id;
  let currentGroup = [];
  
  matches.forEach(match => {
    const opponentId = (match.team1.id === myTeamId) ? match.team2.id : match.team1.id;
    if (currentGroup.length === 0) {
      currentGroup.push(match);
    } else {
      const lastMatch = currentGroup[currentGroup.length - 1];
      const lastOpponentId = (lastMatch.team1.id === myTeamId) ? lastMatch.team2.id : lastMatch.team1.id;
      const sameEvent = match.event.id === lastMatch.event.id;
      if (sameEvent && opponentId === lastOpponentId && (Math.abs(match.date - lastMatch.date) < THRESHOLD)) {
        currentGroup.push(match);
      } else {
        groups.push(currentGroup);
        currentGroup = [match];
      }
    }
  });
  if (currentGroup.length > 0) groups.push(currentGroup);
  return groups;
}

// Process matches: group maps into matches and compute aggregated info.
const processedMatches = computed(() => {
  if (!teamStats.value || !Array.isArray(teamStats.value.matches)) return [];
  const myTeamId = selectedTeam.value.team.id;
  // Sort maps by date ascending so that maps of the same match are consecutive.
  const sorted = [...teamStats.value.matches].sort((a, b) => a.date - b.date);
  const groups = groupMapsIntoMatches(sorted);
  
  return groups.map(group => {
    // Use the date of the first map as the match date.
    const matchDate = group[0].date;
    const eventName = group[0].event && group[0].event.name ? group[0].event.name : '';
    const opponent = (group[0].team1.id === myTeamId) ? group[0].team2.name : group[0].team1.name;
    
    let wins = 0, losses = 0, draws = 0;
    // Build an array of maps detail objects for the popup.
    const mapsDetail = group.map(m => {
      const mapName = m.map || 'Unknown';
      const myScore = (m.team1.id === myTeamId) ? m.result.team1 : m.result.team2;
      const oppScore = (m.team1.id === myTeamId) ? m.result.team2 : m.result.team1;
      if (typeof myScore === 'number' && typeof oppScore === 'number') {
        if (myScore > oppScore) wins++;
        else if (myScore < oppScore) losses++;
        else draws++;
      }
      return {
        map: mapName,
        myScore,
        oppScore
      };
    });
    
    // Create a match score summary, e.g. "2-1"
    const matchScore = `${wins}-${losses}`;
    // Overall result based on wins vs. losses.
    let overallResult = 'Draw';
    if (wins > losses) overallResult = 'Win';
    else if (wins < losses) overallResult = 'Loss';
    
    return {
      date: matchDate,
      event: eventName,
      opponent,
      matchScore,
      overallResult,
      mapsDetail
    };
  }).sort((a, b) => b.date - a.date); // sort descending by match date
});

// Toggle popup: if the clicked match is already active, hide it; otherwise, set it as active.
function togglePopup(match) {
  if (activeMatch.value &&
      activeMatch.value.date === match.date &&
      activeMatch.value.event === match.event &&
      activeMatch.value.opponent === match.opponent) {
    activeMatch.value = null;
  } else {
    activeMatch.value = match;
  }
}

onMounted(() => {
  fetchTeams();
});
</script>

<style scoped>
.team-matches {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
  background-color: #f9f9f9;
  color: #333;
}

.team-matches h2 {
  text-align: center;
  margin-bottom: 20px;
}

.team-select {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.team-select label {
  margin-right: 10px;
  font-weight: bold;
}

.team-select select {
  padding: 5px 10px;
  font-size: 1em;
}

.loading,
.error {
  text-align: center;
  font-style: italic;
  margin-top: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

th {
  background-color: #f5f5f5;
}

.match-row {
  cursor: pointer;
}

.match-row:hover {
  background-color: #eaeaea;
}

/* Modal popup styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  max-width: 500px;
  width: 90%;
  border-radius: 8px;
  text-align: left;
  position: relative;
}

.maps-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.maps-table th,
.maps-table td {
  border: 1px solid #ccc;
  padding: 6px;
  text-align: center;
}

.maps-table th {
  background-color: #eee;
}

.close-button {
  display: block;
  margin: 20px auto 0;
  padding: 8px 16px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.close-button:hover {
  background-color: #0056b3;
}
</style>
