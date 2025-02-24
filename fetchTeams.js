import { HLTV } from 'hltv';
import fs from 'fs';
import path from 'path';

async function fetchAllTeams() {
  try {
    const rankingPath = path.join('public', 'data', 'teamRanking.json');
    const teamsOutputPath = path.join('public', 'data', 'teams.json');

    // Fetch team ranking and limit to top 100 teams
    let rankingData = await HLTV.getTeamRanking();
    rankingData = rankingData.slice(0, 100);
    fs.writeFileSync(rankingPath, JSON.stringify(rankingData, null, 2));
    console.log(`Ranking data saved to ${rankingPath}`);

    // Fetch detailed info for each team (remove news property)
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
  } catch (error) {
    console.error('Error in fetching all teams:', error);
  }
}

fetchAllTeams();