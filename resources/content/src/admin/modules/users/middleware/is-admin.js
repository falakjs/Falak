class IsAdminMiddleware {

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
        return 'isAdmin';
    }

    /**
     * Handle middleware
     */
    handle() {
        if (this.user.accountType !== 'admin') {
            this.router.navigateTo('/login');
        }
        return Middleware.NEXT;
    }
}

DI.register({
    class: IsAdminMiddleware,
    alias: 'isAdminMiddleware',
});