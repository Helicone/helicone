import { alertSqsCongestion } from './alertSqsCongestion';
import { AlertManager } from './AlertManager';

export default {
	async fetch(req) {
		const url = new URL(req.url);
		url.pathname = '/__scheduled';
		url.searchParams.append('cron', '* * * * *');
		return new Response(
			`To test the scheduled handler, ensure you have used the "--test-scheduled" then try running "curl ${url.href}".`,
		);
	},

	async scheduled(
		controller: ScheduledController,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		if (controller.cron === '* * * * *') {
			const apiHeartbeat = await fetch(`${env.VALHALLA_URL}/healthcheck`);
			if (apiHeartbeat.ok) {
				await fetch(env.API_HEARTBEAT_URL);
			}
			try {
				await alertSqsCongestion(env, new AlertManager(env));
			} catch (error) {
				console.error('Error alerting about SQS congestion', error);
			}
		}
	},
} satisfies ExportedHandler<Env>;
