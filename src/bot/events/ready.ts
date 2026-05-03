import { client } from '../client';
import { startLPTracker } from '../../services/lpTracker';
import { lavalink } from '../../services/lavalinkManager';
import { log } from '../../utils/logger';

client.once('clientReady', async () => {
  log('info', `✅ Logged in as ${client.user?.tag}`);
  startLPTracker(client);
  await lavalink.init({ ...client.user! });
});
