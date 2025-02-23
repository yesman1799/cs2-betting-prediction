import { HLTV } from 'hltv';
import fs from 'fs';
import path from 'path';

const outputPath = path.join('public', 'data', 'teamRanking.json');

HLTV.getTeamRanking()
  .then((ranking) => {
    fs.writeFileSync(outputPath, JSON.stringify(ranking, null, 2));
    console.log(`Data saved to ${outputPath}`);
  })
  .catch((error) => {
    console.error('Error fetching team ranking:', error);
  });

HLTV.getTeam({ id: 6665 })
  .then((team) => {
    fs.writeFileSync(
      path.join('public', 'data', 'team.json'),
      JSON.stringify(team, null, 2)
    );
    console.log('Data saved to public/data/team.json');
  })
  .catch((error) => {
    console.error('Error fetching team:', error);
  });