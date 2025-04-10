export class Timer {
    constructor(timeout, step_callback = null, finished_callback = null) {
        this.timeout = timeout;
        this.step_callback = step_callback;
        this.finished_callback = finished_callback;
        this.begin = 0;
        this.cur_time = 0;
        this.is_running = false;
    }

    start(from = 0) {
        this.begin = document.timeline.currentTime - from;
        this.cur_time = from;
        this.is_running = true;
        requestAnimationFrame((t) => this.step(t));
    }

    step(t) {
        this.cur_time = t - this.begin;
        const alpha = this.cur_time / this.timeout;
        if (this.step_callback) {
            this.step_callback(alpha);
        }
        if (alpha > 1.0) {
            this.finish();
            return;
        }
        requestAnimationFrame((t) => this.step(t));
    }

    finish() {
        this.is_running = false;
        this.cur_time = 0;
        if (this.finished_callback) {
            this.finished_callback();
        }
    }
}