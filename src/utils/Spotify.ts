import axios from 'axios';
import { spotifyRedirectUri } from '../variables';

const accountsApiBase = 'https://accounts.spotify.com/api';

export async function token(code: string) {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', spotifyRedirectUri);
  return await axios.post(`${accountsApiBase}/token`, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ODc0NWM1ODNjYzZiNDJiODk1ZDU2Mjc2Y2RmMzkxYWQ6MzQxNWFmOWJjZDQwNDc3N2JjZTk0MjVhMTI5MjJiZjY='
    }
  });
}

export async function accessToken(refreshToken: string) {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  return await axios.post(`${accountsApiBase}/token`, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ODc0NWM1ODNjYzZiNDJiODk1ZDU2Mjc2Y2RmMzkxYWQ6MzQxNWFmOWJjZDQwNDc3N2JjZTk0MjVhMTI5MjJiZjY='
    }
  });
}