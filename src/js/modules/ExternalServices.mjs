export default class ExternalServices {
  constructor(){
    this.footballBaseUrl = 'https://api-football-v1.p.rapidapi.com/v3';
    this.basketballBaseUrl = 'https://api-basketball.p.rapidapi.com';

    // Fallback/dummy header values for development. Replace with real credentials.
    this.headers = {
      'x-rapidapi-key': 'YOUR_KEY_HERE',
      'x-rapidapi-host': 'YOUR_HOST_HERE'
    };
  }

  async handleResponse(response){
    if(!response.ok){
      throw new Error(`Request failed with status ${response.status}`);
    }

    return await response.json();
  }

  async getFixtures(sport, dateString){
    if(!sport || !dateString) throw new Error('sport and dateString are required');

    let base;
    const lower = String(sport).toLowerCase();
    if(lower === 'football') base = this.footballBaseUrl;
    else if(lower === 'basketball') base = this.basketballBaseUrl;
    else throw new Error(`Unsupported sport: ${sport}`);

    const url = `${base}/fixtures?date=${encodeURIComponent(dateString)}`;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      }
    };

    try{
      const response = await fetch(url, options);
      return await this.handleResponse(response);
    }catch(err){
      console.warn('ExternalServices.getFixtures error:', err);
      throw err;
    }
  }
}
