import { client } from '../client';
import { startLPTracker } from '../../services/lpTracker';
import { log } from '../../utils/logger';

client.once('ready', () => {
  log('info', `✅ Logged in as ${client.user?.tag}`);
  startLPTracker(client);
});
