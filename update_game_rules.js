const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateGames() {
  const { data: games, error } = await supabase.from('intimacy_games').select('id, category, intensity');
  if (error) { console.error(error); return; }

  for (const game of games) {
    let rules = [];
    
    if (game.category === 'card' || game.category === 'Card Games') {
      rules.push('Grab a standard deck of cards and shuffle thoroughly.');
      rules.push('Penalty: If you skip an action, you must remove one piece of clothing and take a drink.');
      if (game.intensity === 'Sensory') {
        rules.push('Hearts = Share a romantic fantasy. Spades = Remove an accessory (watch, socks). Face Cards = Execute a 1-minute light massage.');
      } else if (game.intensity === 'Playful') {
        rules.push('Hearts = Share an adventurous fantasy. Spades = Remove a shirt. Face Cards = Execute a blindfolded sensory touch for 2 minutes.');
      } else if (game.intensity === 'Intense') {
        rules.push('Hearts = Confess a deep, dark fantasy. Spades = Remove pants/skirt. Face Cards = Execute an intense dominant/submissive touch command.');
      } else if (game.intensity === 'Extreme') {
        rules.push('Hearts = Describe an extreme taboo you want to try. Spades = Strip completely naked. Face Cards = Execute a physical command with restraint/impact play.');
      } else {
        rules.push('Hearts = Share a fantasy. Spades = Remove an item. Face Cards = Execute a sensory touch.');
      }
    } 
    else if (game.category === 'movie' || game.category === 'Movie Night Games') {
      rules.push('Select a movie together. Before hitting play, agree on 3 common tropes for this genre.');
      if (game.intensity === 'Sensory') {
        rules.push('Assign light actions (kiss on neck, hold hands, whisper sweet nothings) to each trope.');
      } else if (game.intensity === 'Playful') {
        rules.push('Assign playful dares (remove an item, straddle lap, blindfold for 5 mins) to each trope.');
      } else if (game.intensity === 'Intense') {
        rules.push('Assign intense acts (edging, impact play, explicit confession) to each trope.');
      } else if (game.intensity === 'Extreme') {
        rules.push('Assign extreme commands (pain play, prolonged submission, heavy restraint) to each trope.');
      } else {
        rules.push('Assign an action to each trope.');
      }
      rules.push('Execute the action whenever the trope appears on screen.');
      rules.push('If you miss a trope, your partner assigns a penalty action of their choice.');
    } 
    else if (game.category === 'date_night' || game.category === 'Date Night Games') {
      rules.push('Begin the evening in public. Establish a safe word before leaving the house.');
      if (game.intensity === 'Sensory') {
        rules.push('Pretend you are strangers. Make intense eye contact and hold hands under the table.');
      } else if (game.intensity === 'Playful') {
        rules.push('Pretend you are secretly having an affair. Whisper explicit things you want to do later.');
      } else if (game.intensity === 'Intense') {
        rules.push('One partner commands the other via text message while sitting across from each other. Disobedience means punishment later.');
      } else if (game.intensity === 'Extreme') {
        rules.push('Wear a discrete remote-controlled toy in public. The dominant partner controls it throughout dinner.');
      } else {
        rules.push('Pretend you are strangers meeting at a bar.');
      }
      rules.push('Once home, fully execute the roleplay scenario established during the date.');
    }
    else if (game.category === 'drinking' || game.category === 'Drinking Games') {
      rules.push('Take turns answering provocative questions. If you refuse, take a drink.');
      if (game.intensity === 'Sensory') {
        rules.push('If you both refuse, share a passionate 2-minute kiss instead.');
      } else if (game.intensity === 'Playful') {
        rules.push('If you both refuse, both remove a piece of clothing.');
      } else if (game.intensity === 'Intense') {
        rules.push('If you both refuse, one partner must spank the other.');
      } else if (game.intensity === 'Extreme') {
        rules.push('If you both refuse, perform a heavy BDSM command immediately.');
      } else {
        rules.push('If both refuse, remove clothing.');
      }
      rules.push('The game ends when one partner taps out or finishes their drink.');
    }

    if (rules.length > 0) {
      const content = { rules: rules };
      await supabase.from('intimacy_games').update({ content }).eq('id', game.id);
    }
  }
  console.log('Successfully updated games with distinct variations.');
}
updateGames();
