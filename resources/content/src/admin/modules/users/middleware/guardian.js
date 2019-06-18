class Guardian {
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
        return 'guardian';
    }

    /**
     * {@inheritDoc}
     */
    handle() {
        if (! this.user.isLoggedIn()) {
            this.router.navigateTo('/login');
            return;
        }

        return Middleware.NEXT;
    }
}

DI.register({
    class: Guardian,
    alias: 'guardianMiddleware',
});