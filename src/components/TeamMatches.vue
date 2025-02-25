<template>
  <div class="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
    <h2 class="text-3xl font-bold text-center mb-6">
      Recent Matches for {{ teamStats ? teamStats.name : '' }}
    </h2>

    <!-- Team Selector -->
    <div class="flex items-center justify-center mb-6 space-x-3">
      <label for="team-select" class="font-semibold text-gray-700">
        Select Team:
      </label>
      <select
        id="team-select"
        v-model="selectedTeam"
        @change="onTeamChange"
        class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option v-for="team in teams" :key="team.team.id" :value="team">
          {{ team.team.name }}
        </option>
      </select>
    </div>

    <!-- Loading / Error / Table -->
    <div v-if="loading" class="text-center text-gray-600 italic">
      Loading match data...
    </div>
    <div v-else-if="error" class="text-center text-red-500 italic">
      Error: {{ error }}
    </div>
    <div v-else-if="processedMatches.length">
      <h3 class="text-2xl font-semibold text-center mb-4">
        {{ teamStats.name }} - Recent Matches (BO3)
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full border border-gray-300">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-left text-sm font-medium border-r border-gray-300">Date</th>
              <th class="px-4 py-2 text-left text-sm font-medium border-r border-gray-300">Event</th>
              <th class="px-4 py-2 text-left text-sm font-medium border-r border-gray-300">Opponent</th>
              <th class="px-4 py-2 text-center text-sm font-medium border-r border-gray-300">Match Score</th>
              <th class="px-4 py-2 text-center text-sm font-medium">Overall Result</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr
              v-for="(match, index) in processedMatches"
              :key="index"
              @click="togglePopup(match)"
              class="cursor-pointer hover:bg-gray-200 transition-colors"
            >
              <td class="px-4 py-2 text-sm">{{ formatDate(match.date) }}</td>
              <td class="px-4 py-2 text-sm">{{ match.event }}</td>
              <td class="px-4 py-2 text-sm">{{ match.opponent }}</td>
              <td class="px-4 py-2 text-sm text-center font-semibold">{{ match.matchScore }}</td>
              <td
                class="px-4 py-2 text-sm text-center font-semibold"
                :class="{
                  'text-green-600': match.overallResult === 'Win',
                  'text-red-600': match.overallResult === 'Loss',
                  'text-yellow-600': match.overallResult === 'Draw'
                }"
              >
                {{ match.overallResult }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="text-center text-gray-600 mt-6">
      <p>No match data available for this team.</p>
    </div>

    <!-- Modal Popup for match details -->
    <transition name="fade">
      <div
        v-if="activeMatch"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="activeMatch = null"
      >
        <div class="bg-white rounded-lg p-6 w-11/12 max-w-md shadow-xl">
          <h3 class="text-xl font-bold text-gray-800 mb-3">Match Details</h3>
          <p class="mb-1">
            <span class="font-semibold text-gray-700">Event:</span>
            {{ activeMatch.event }}
          </p>
          <p class="mb-1">
            <span class="font-semibold text-gray-700">Date:</span>
            {{ formatDate(activeMatch.date) }}
          </p>
          <p class="mb-1">
            <span class="font-semibold text-gray-700">Opponent:</span>
            {{ activeMatch.opponent }}
          </p>
          <p class="mb-4">
            <span class="font-semibold text-gray-700">Match Score:</span>
            {{ activeMatch.matchScore }}
            (<span
              :class="{
                'text-green-600': activeMatch.overallResult === 'Win',
                'text-red-600': activeMatch.overallResult === 'Loss',
                'text-yellow-600': activeMatch.overallResult === 'Draw'
              }"
              class="font-semibold"
            >
              {{ activeMatch.overallResult }}
            </span>)
          </p>
          <div class="overflow-x-auto">
            <table class="w-full border border-gray-300">
              <thead class="bg-gray-200">
                <tr>
                  <th class="px-3 py-2 text-sm font-medium border-r border-gray-300">Map</th>
                  <th class="px-3 py-2 text-sm font-medium border-r border-gray-300 text-center">Your Score</th>
                  <th class="px-3 py-2 text-sm font-medium text-center">Opponent Score</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr
                  v-for="(map, idx) in activeMatch.mapsDetail"
                  :key="idx"
                >
                  <td class="px-3 py-2 text-sm">{{ map.map }}</td>
                  <td class="px-3 py-2 text-sm text-center">{{ map.myScore }}</td>
                  <td class="px-3 py-2 text-sm text-center">{{ map.oppScore }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <button
            class="mt-6 block mx-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            @click="activeMatch = null"
          >
            Close
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Helper: sanitize team names for filenames.
function sanitizeFileName(name) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
}

// Helper: format a timestamp into a readable date.
function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

const teams = ref([])           // Teams loaded from teamRanking.json
const selectedTeam = ref(null)  // Selected team object
const teamStats = ref(null)     // Stats for the selected team
const loading = ref(false)
const error = ref(null)
const activeMatch = ref(null)   // Active match for popup

// Fetch teams from teamRanking.json
async function fetchTeams() {
  try {
    const response = await fetch('/data/teamRanking.json')
    const data = await response.json()
    teams.value = data
    if (teams.value.length > 0) {
      selectedTeam.value = teams.value[0]
      await fetchTeamStats()
    }
  } catch (err) {
    console.error('Error fetching teams:', err)
    error.value = err.message
  }
}

// Fetch stats for the selected team using its sanitized name.
async function fetchTeamStats() {
  if (!selectedTeam.value) return
  loading.value = true
  error.value = null
  const teamName = selectedTeam.value.team.name
  const sanitizedName = sanitizeFileName(teamName)
  try {
    const response = await fetch(`/data/teamStats/${sanitizedName}.json`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const statsData = await response.json()
    if (!statsData.name || statsData.name.trim() === '') {
      statsData.name = teamName
    }
    teamStats.value = statsData
  } catch (err) {
    console.error(`Error fetching stats for ${teamName}:`, err)
    error.value = err.message
    teamStats.value = null
  } finally {
    loading.value = false
  }
}

function onTeamChange() {
  activeMatch.value = null
  fetchTeamStats()
}

// Group individual map results into matches.
// We assume maps belong to the same match if they share the same event id, the same opponent id,
// and their timestamps differ by less than 3 hours.
function groupMapsIntoMatches(matches) {
  const groups = []
  const THRESHOLD = 3 * 60 * 60 * 1000 // 3 hours in ms
  const myTeamId = selectedTeam.value.team.id
  let currentGroup = []
  
  matches.forEach(match => {
    const opponentId = (match.team1.id === myTeamId) ? match.team2.id : match.team1.id
    if (currentGroup.length === 0) {
      currentGroup.push(match)
    } else {
      const lastMatch = currentGroup[currentGroup.length - 1]
      const lastOpponentId = (lastMatch.team1.id === myTeamId) ? lastMatch.team2.id : lastMatch.team1.id
      const sameEvent = match.event.id === lastMatch.event.id
      if (sameEvent && opponentId === lastOpponentId && (Math.abs(match.date - lastMatch.date) < THRESHOLD)) {
        currentGroup.push(match)
      } else {
        groups.push(currentGroup)
        currentGroup = [match]
      }
    }
  })
  if (currentGroup.length > 0) groups.push(currentGroup)
  return groups
}

// Process matches: group maps into matches and compute aggregated info.
const processedMatches = computed(() => {
  if (!teamStats.value || !Array.isArray(teamStats.value.matches)) return []
  const myTeamId = selectedTeam.value.team.id
  // Sort maps by date ascending so that maps of the same match are consecutive.
  const sorted = [...teamStats.value.matches].sort((a, b) => a.date - b.date)
  const groups = groupMapsIntoMatches(sorted)
  
  return groups.map(group => {
    // Use the date of the first map as the match date.
    const matchDate = group[0].date
    const eventName = group[0].event && group[0].event.name ? group[0].event.name : ''
    const opponent = (group[0].team1.id === myTeamId) ? group[0].team2.name : group[0].team1.name
    
    let wins = 0, losses = 0, draws = 0
    // Build maps detail for the popup.
    const mapsDetail = group.map(m => {
      const mapName = m.map || 'Unknown'
      const myScore = (m.team1.id === myTeamId) ? m.result.team1 : m.result.team2
      const oppScore = (m.team1.id === myTeamId) ? m.result.team2 : m.result.team1
      if (typeof myScore === 'number' && typeof oppScore === 'number') {
        if (myScore > oppScore) wins++
        else if (myScore < oppScore) losses++
        else draws++
      }
      return {
        map: mapName,
        myScore,
        oppScore
      }
    })
    
    // Create match score summary, e.g., "2-1"
    const matchScore = `${wins}-${losses}`
    // Overall result based on wins vs. losses.
    let overallResult = 'Draw'
    if (wins > losses) overallResult = 'Win'
    else if (wins < losses) overallResult = 'Loss'
    
    return {
      date: matchDate,
      event: eventName,
      opponent,
      matchScore,
      overallResult,
      mapsDetail
    }
  }).sort((a, b) => b.date - a.date) // sort descending by match date
})

// Toggle popup: if the clicked match is already active, hide it; otherwise, set it as active.
function togglePopup(match) {
  if (
    activeMatch.value &&
    activeMatch.value.date === match.date &&
    activeMatch.value.event === match.event &&
    activeMatch.value.opponent === match.opponent
  ) {
    activeMatch.value = null
  } else {
    activeMatch.value = match
  }
}

onMounted(() => {
  fetchTeams()
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
