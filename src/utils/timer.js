export class Timer {
    constructor(timeout, step_callback = null, finished_callback = null) {
        this.timeout = timeout;
        this.step_callback = step_callback;
        this.finished_callback = finished_callback;
        this.begin = 0;
        this.is_running = false;
    }

    start() {
        this.begin = document.timeline.currentTime;
        this.is_running = true;
        requestAnimationFrame((t) => this.step(t));
    }

    step(t) {
        const time = t - this.begin;
        const alpha = time / this.timeout;
        if (alpha >= 1.0) {
            this.finish();
            return;
        }
        if (this.step_callback) {
            this.step_callback(alpha);
        }
        requestAnimationFrame((t) => this.step(t));
    }

    finish() {
        this.is_running = false;
        if (this.finished_callback) {
            this.finished_callback();
        }
    }
}