export function check(checks) {
    for (let i = 0; i < checks.length; ++i) {
        if (checks[i]()) {
            checks[i] = checks[checks.length - 1];
            checks.pop();
            --i;
        }
    }
}