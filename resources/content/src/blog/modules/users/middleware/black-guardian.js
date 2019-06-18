/**
 * This is the reverse to the guardian
 * which doesn't allow `logged-in` users to access the provided router
 * to this middleware
 */
class BlackGuardian {
    /**
     * {@inheritDoc}
     */
    constructor(user, router) {
        this.user = user;
        this.router = router;
    }

    /**
     * {@inheritDoc}
     */
    name() {
        return 'blackGuardian';
    }

    /**
     * {@inheritDoc}
     */
    handle() {
        if (this.user.isLoggedIn()) {
            this.router.navigateTo('/');
            return false;
        }

        return Middleware.NEXT;
    }
}

DI.register({
    class: BlackGuardian,
    alias: 'blackGuardianMiddleware',
});