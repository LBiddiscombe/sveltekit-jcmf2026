export class MatchTimer {
	timeRemainingSeconds = $state(0);
	timeExpired = $state(false);
	weighInEarlyActive = $state(false);

	setTimeLimit(minutes?: number) {
		if (minutes !== undefined) {
			this.timeRemainingSeconds = Math.max(0, minutes * 60);
			this.timeExpired = this.timeRemainingSeconds <= 0;
		} else {
			this.timeRemainingSeconds = 0;
			this.timeExpired = false;
		}
	}

	reset() {
		this.timeRemainingSeconds = 0;
		this.timeExpired = false;
		this.weighInEarlyActive = false;
	}

	tick(elapsedMs: number) {
		const ms = this.weighInEarlyActive ? elapsedMs * 30 : elapsedMs;

		if (this.timeRemainingSeconds > 0) {
			this.timeRemainingSeconds = Math.max(0, this.timeRemainingSeconds - ms / 1000);
			if (this.timeRemainingSeconds <= 0) {
				this.timeExpired = true;
			}
		}
	}

	weighInEarly() {
		this.weighInEarlyActive = true;
	}

	forceExpire() {
		this.timeExpired = true;
	}
}
