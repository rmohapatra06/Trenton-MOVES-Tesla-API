import axios from 'axios';

const BASE_URL = 'https://fleet-api.prd.na.vn.cloud.tesla.com/api/1';

export function createFleetClient(token: string) {
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listVehicles(token: string) {
  const client = createFleetClient(token);
  const resp = await client.get('/vehicles');
  return resp.data;
}

// Further helpers, e.g., get vehicle state, send commands, etc.
