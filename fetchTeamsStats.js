import { HLTV } from 'hltv';
import fs from 'fs';
import path from 'path';

// Convert team name to a safe filename.
function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens.
    .replace(/[^a-z0-9\-]/g, ''); // Remove non-alphanumeric characters (except hyphen).
}

// Simple delay function.
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Directory where stats files are stored.
const statsDir = path.join('public', 'data', 'teamStats');

// A helper to decide whether the stats data is valid.
// We consider the data valid if there's a non-empty "name" and the "matches" array exists and is non-empty.
function isStatsValid(stats) {
  return stats &&
         !stats.error &&
         stats.name && stats.name.trim() !== "" &&
         Array.isArray(stats.matches) &&
         stats.matches.length > 0;
}

// Fetch stats for a given team and write it to its file.
async function fetchStatsForTeam(team) {
  const teamId = team.team.id;
  const teamName = team.team.name;
  const sanitizedName = sanitizeFileName(teamName);
  const filePath = path.join(statsDir, `${sanitizedName}.json`);

  try {
    // Attempt to fetch stats. (Adjust HLTV.getTeamStats if needed.)
    const stats = await HLTV.getTeamStats({ id: teamId });
    // If the stats object is incomplete, throw an error.
    if (!stats.name || stats.name.trim() === "" ||
        !Array.isArray(stats.matches) || stats.matches.length === 0) {
      throw new Error("Incomplete stats: empty team name or empty matches array");
    }
    // Ensure the stats object has a valid name.
    if (!stats.name || stats.name.trim() === "") {
      stats.name = teamName;
    }
    fs.writeFileSync(filePath, JSON.stringify(stats, null, 2));
    console.log(`Stats for team "${teamName}" saved to ${filePath}`);
  } catch (error) {
    console.warn(`Error fetching stats for team "${teamName}" (id: ${teamId}): ${error.message}`);
    // Write fallback data including the team name so that the file isn't empty.
    const fallback = { error: true, message: error.message, id: teamId, name: teamName };
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  }
}

// Main processing function.
async function processTeamStats() {
  try {
    // Fetch the ranking data and limit to top 100 teams.
    let rankingData = await HLTV.getTeamRanking();
    rankingData = rankingData.slice(0, 100);
    console.log(`Processing top ${rankingData.length} teams.`);

    // Ensure the stats directory exists.
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }

    // Check each team's stats file and collect teams that have incomplete data.
    const incompleteTeams = [];
    for (const team of rankingData) {
      const teamName = team.team.name;
      const sanitizedName = sanitizeFileName(teamName);
      const filePath = path.join(statsDir, `${sanitizedName}.json`);
      let valid = false;
      if (fs.existsSync(filePath)) {
        try {
          const existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          valid = isStatsValid(existingData);
        } catch {
          valid = false;
        }
      }
      if (!valid) {
        incompleteTeams.push(team);
      }
    }

    if (incompleteTeams.length === 0) {
      console.log("All team stats are valid. Exiting.");
      return;
    }

    console.log(`Found ${incompleteTeams.length} teams with incomplete stats. Attempting to fetch their stats...`);

    // Attempt to fetch stats for each incomplete team (in parallel).
    await Promise.all(incompleteTeams.map(team => fetchStatsForTeam(team)));

    console.log("Waiting 3 minutes before re-checking incomplete teams...");
    await delay(3 * 60 * 1000);

    // Recursively process until all team stats are valid.
    await processTeamStats();
  } catch (error) {
    console.error("Error processing team stats:", error);
  }
}

processTeamStats();
