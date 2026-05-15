
import axios from 'axios';

async function test() {
  try {
    const artistId = 'kQid6pBNoCWW1Z6fX8FOnO61Wov1'; // Lunay
    const res = await axios.get(`http://localhost:3000/artist-services/all/${artistId}`);
    console.log('Response for services:', JSON.stringify(res.data, null, 2));
    
    const resSongs = await axios.get(`http://localhost:3000/artist-songs/all/${artistId}`);
    console.log('Response for songs:', JSON.stringify(resSongs.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
