import { HLTV } from 'hltv';
import fs from 'fs';
import path from 'path';

async function fetchAllTeams() {
  try {
    // Define output paths
    const rankingPath = path.join('public', 'data', 'teamRanking.json');
    const teamsOutputPath = path.join('public', 'data', 'teams.json');
    const statsFolderPath = path.join('public', 'data', 'teamStats');

    // Ensure the teamStats folder exists
    if (!fs.existsSync(statsFolderPath)) {
      fs.mkdirSync(statsFolderPath, { recursive: true });
    }

    // Fetch team ranking and limit to the top 100 teams
    let rankingData = await HLTV.getTeamRanking();
    rankingData = rankingData.slice(0, 100); // Only use teams ranked 1 to 100
    fs.writeFileSync(rankingPath, JSON.stringify(rankingData, null, 2));
    console.log(`Ranking data saved to ${rankingPath}`);

    // Fetch detailed team info for each top-100 team (remove news property)
    const teamPromises = rankingData.map(async (item) => {
      try {
        const team = await HLTV.getTeam({ id: item.team.id });
        if (team && team.news) {
          delete team.news;
        }
        return team;
      } catch (error) {
        console.warn(`Error fetching team with id ${item.team.id}: ${error.message}`);
        return {
          id: item.team.id,
          name: item.team.name,
          logo: null,
          error: true
        };
      }
    });
    const teamsData = await Promise.all(teamPromises);
    fs.writeFileSync(teamsOutputPath, JSON.stringify(teamsData, null, 2));
    console.log(`Teams data saved to ${teamsOutputPath}`);

    // For each top-100 team, fetch stats and write to individual files
    const statsPromises = rankingData.map(async (item) => {
      const filePath = path.join(statsFolderPath, `${item.team.id}.json`);
      try {
        // Note: HLTV.getTeamStats is assumed to return an object containing map and player stats.
        const stats = await HLTV.getTeamStats({ id: item.team.id });
        fs.writeFileSync(filePath, JSON.stringify(stats, null, 2));
        console.log(`Stats for team ${item.team.id} saved to ${filePath}`);
      } catch (error) {
        console.warn(`Error fetching stats for team with id ${item.team.id}: ${error.message}`);
        // Write fallback stats data so that every team gets a file
        fs.writeFileSync(filePath, JSON.stringify({ error: true, message: error.message }, null, 2));
      }
    });
    await Promise.all(statsPromises);
  } catch (error) {
    console.error('Error in fetching all teams:', error);
  }
}

fetchAllTeams();
